import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../core/http/api.service';
import { AuthService } from '../../core/services/auth.service';
import { KycApiService, KycDocument, KycOptions, KycProgress, KycRecord, STEP_SECTION } from '../../core/services/kyc-api.service';
import { UtilService } from '../../core/services/util.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Choice, KycFieldComponent, humanize } from './kyc-field.component';
import { KYC_STEPS, KycField, KycList, KycStepDef } from './kyc-schema';

const PHONE = /^\+?[0-9]{7,15}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function getPath(obj: any, path: string): any {
  return path.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
}

function setPath(obj: any, path: string, value: unknown) {
  const keys = path.split('.');
  let o = obj;
  for (const k of keys.slice(0, -1)) o = o[k] ??= {};
  if (value === undefined) delete o[keys[keys.length - 1]];
  else o[keys[keys.length - 1]] = value;
}

const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Company verification (KYC/KYB): eleven steps, each saved on its own so people can stop and come back. Steps are rendered from
 * kyc-schema.ts; the server re-validates everything and its message is shown if it disagrees with the checks made here.
 */
@Component({
  selector: 'app-kyc-wizard',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, KycFieldComponent],
  template: `
  <div class="max-w-6xl mx-auto" *ngIf="record() as rec; else loadingTpl">
    <div class="flex flex-wrap items-end justify-between gap-3 mb-4">
      <div>
        <h1 class="text-2xl font-bold text-ink-950">Company verification</h1>
        <p class="muted">Complete all 11 steps so we can verify {{ rec.companyName || 'your company' }}. You can save and return at any time.</p>
      </div>
      <span class="badge" [ngClass]="statusClass(rec.status)">{{ statusLabel(rec.status) }}</span>
    </div>

    <div class="w-full h-2 rounded-full bg-ink-100 mb-5 overflow-hidden" aria-label="Progress">
      <div class="h-full bg-brand-600 transition-all" [style.width.%]="progress()?.progressPercentage ?? rec.progressPercentage"></div>
    </div>

    <!-- status banners -->
    <div *ngIf="rec.status === 'APPROVED'" class="card p-4 mb-5 border-green-200 bg-green-50 text-green-800">
      <p class="font-semibold">Your company is verified.</p>
      <p class="text-sm">All features are now available.</p>
      <a routerLink="/app/dashboard" class="btn-primary inline-block mt-3">Go to dashboard</a>
    </div>
    <div *ngIf="rec.status === 'SUBMITTED' || rec.status === 'IN_REVIEW'" class="card p-4 mb-5 border-brand-200 bg-brand-50 text-brand-800">
      <p class="font-semibold">{{ rec.status === 'IN_REVIEW' ? 'A reviewer is looking at your application.' : 'Your application has been submitted.' }}</p>
      <p class="text-sm">You can read your answers below, but they are locked while we review them. We will email you when there is a decision.</p>
    </div>
    <div *ngIf="rec.status === 'REJECTED'" class="card p-4 mb-5 border-red-200 bg-red-50 text-red-800">
      <p class="font-semibold">Your application was not approved.</p>
      <p class="text-sm" *ngIf="rec.decisionReason">{{ rec.decisionReason }}</p>
      <p class="text-sm mt-1">Please contact support if you believe this is a mistake.</p>
    </div>
    <div *ngIf="rec.status === 'MORE_INFO_REQUIRED'" class="card p-4 mb-5 border-amber-200 bg-amber-50 text-amber-900">
      <p class="font-semibold">The reviewer needs more information.</p>
      <ng-container *ngIf="progress()?.openInfoRequest as req">
        <p class="text-sm mt-1 whitespace-pre-line">{{ req.message }}</p>
        <ul class="list-disc ml-5 text-sm mt-1" *ngIf="req.items?.length"><li *ngFor="let i of req.items">{{ i }}</li></ul>
        <p class="text-sm mt-1" *ngIf="req.deadline">Please reply by {{ req.deadline }}.</p>
      </ng-container>
      <p class="text-sm mt-2">Update the steps concerned, then resubmit.</p>
      <textarea class="input mt-3 bg-white" rows="2" placeholder="Note for the reviewer (optional)" [value]="resubmitNote" (input)="resubmitNote = $any($event.target).value"></textarea>
      <button class="btn-primary mt-3" [disabled]="busy()" (click)="resubmit()">{{ busy() ? 'Sending...' : 'Resubmit for review' }}</button>
    </div>

    <div *ngIf="notice()" class="mb-4 p-3 rounded-lg bg-brand-50 text-brand-800 text-sm" role="status">{{ notice() }}</div>
    <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

    <div class="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
      <!-- stepper -->
      <nav class="card p-2 h-fit lg:sticky lg:top-2" aria-label="Verification steps">
        <button *ngFor="let s of steps" type="button" class="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition"
                [ngClass]="s.number === active() ? 'bg-brand-50 text-brand-800 font-semibold' : 'text-ink-700 hover:bg-ink-50'"
                (click)="go(s.number)">
          <span class="w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold"
                [ngClass]="isDone(s.number) ? 'bg-green-500 text-white' : s.number === active() ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-600'">
            <app-icon *ngIf="isDone(s.number)" name="check" [size]="12"></app-icon>
            <ng-container *ngIf="!isDone(s.number)">{{ s.number }}</ng-container>
          </span>
          {{ s.title }}
        </button>
      </nav>

      <!-- current step -->
      <section class="card p-5 sm:p-6" *ngIf="step() as st">
        <h2 class="text-lg font-semibold text-ink-950">Step {{ st.number }} of {{ steps.length }}: {{ st.title }}</h2>
        <p class="muted mb-5">{{ st.intro }}</p>

        <div *ngFor="let g of st.groups" class="mb-6">
          <h3 *ngIf="g.title" class="section-title mb-3">{{ g.title }}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ng-container *ngFor="let f of g.fields">
              <app-kyc-field *ngIf="visible(f, model[st.number])" [field]="f" [id]="'f' + st.number + '-' + f.key"
                [value]="get(model[st.number], f.key)" [choices]="choicesFor(f)" [required]="isRequired(f, model[st.number])"
                [disabled]="!editable()" [error]="errors()[f.key] || ''"
                (valueChange)="set(model[st.number], f.key, $event, f.key)"></app-kyc-field>
            </ng-container>
          </div>
        </div>

        <div *ngFor="let l of st.lists" class="mb-6">
          <div class="flex items-center justify-between mb-3">
            <h3 class="section-title">{{ l.singular }}s</h3>
            <button *ngIf="editable() && rows(st, l).length < l.max" type="button" class="btn-secondary text-sm" (click)="addRow(st, l)">Add {{ l.singular.toLowerCase() }}</button>
          </div>
          <p *ngIf="!rows(st, l).length" class="muted text-sm">None added{{ l.min > 0 ? ' yet. At least ' + l.min + ' is required.' : '.' }}</p>
          <p *ngIf="errors()[l.key]" class="text-sm text-red-600 mb-2" role="alert">{{ errors()[l.key] }}</p>

          <div *ngFor="let row of rows(st, l); let i = index" class="border border-ink-100 rounded-xl p-4 mb-4">
            <div class="flex items-center justify-between mb-3">
              <p class="font-medium text-ink-800">{{ l.singular }} {{ i + 1 }}</p>
              <button *ngIf="editable() && rows(st, l).length > l.min" type="button" class="text-sm text-red-600 hover:underline" (click)="removeRow(st, l, i)">Remove</button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ng-container *ngFor="let f of l.fields">
                <app-kyc-field *ngIf="visible(f, row)" [field]="f" [id]="'f' + st.number + '-' + l.key + '-' + i + '-' + f.key"
                  [value]="get(row, f.key)" [choices]="choicesFor(f)" [required]="isRequired(f, row)" [disabled]="!editable()"
                  [error]="errors()[l.key + '.' + i + '.' + f.key] || ''"
                  (valueChange)="set(row, f.key, $event, l.key + '.' + i + '.' + f.key)"></app-kyc-field>
              </ng-container>
            </div>
          </div>
        </div>

        <!-- documents (step 10) -->
        <div *ngIf="st.documents" class="mb-6">
          <h3 class="section-title mb-3">Required documents</h3>
          <ul class="mb-4 space-y-1">
            <li *ngFor="let d of progress()?.requiredDocuments ?? rec.requiredDocuments" class="flex items-center gap-2 text-sm">
              <span class="w-5 h-5 rounded-full flex items-center justify-center" [ngClass]="d.satisfied ? 'bg-green-500 text-white' : 'bg-ink-100 text-ink-500'">
                <app-icon *ngIf="d.satisfied" name="check" [size]="12"></app-icon>
              </span>
              <span [class.text-ink-500]="d.satisfied">{{ d.label }}</span>
            </li>
          </ul>

          <div *ngIf="editable()" class="border border-dashed border-ink-200 rounded-xl p-4 mb-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-sm font-medium text-ink-800 mb-1" for="doc-type">Document type</label>
                <select id="doc-type" class="input" (change)="docType = $any($event.target).value">
                  <option value="">Select...</option>
                  <option *ngFor="let c of docTypes()" [value]="c.value">{{ c.label }}</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-ink-800 mb-1" for="doc-desc">Description (optional)</label>
                <input id="doc-desc" class="input" type="text" maxlength="500" (input)="docDescription = $any($event.target).value" />
              </div>
              <div class="sm:col-span-2">
                <label class="block text-sm font-medium text-ink-800 mb-1" for="doc-file">File (PDF, image or Office document, up to 10 MB)</label>
                <input id="doc-file" type="file" class="text-sm" (change)="pickFile($event)" />
              </div>
            </div>
            <button type="button" class="btn-primary mt-3" [disabled]="uploading() || !docType || !file" (click)="upload()">
              {{ uploading() ? 'Uploading...' : 'Upload document' }}
            </button>
            <p *ngIf="docError()" class="text-sm text-red-600 mt-2" role="alert">{{ docError() }}</p>
          </div>

          <table class="table w-full" *ngIf="documents().length">
            <thead><tr><th>Type</th><th>File</th><th>Status</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let d of documents()">
                <td>{{ d.documentTypeLabel }}</td>
                <td>{{ d.fileName }} <span class="muted">({{ size(d.sizeBytes) }})</span>
                  <p class="text-xs text-red-600" *ngIf="d.reviewerComment">{{ d.reviewerComment }}</p></td>
                <td><span class="badge" [ngClass]="d.status === 'APPROVED' ? 'badge-green' : d.status === 'REJECTED' ? 'badge-red' : 'badge-gray'">{{ label(d.status) }}</span></td>
                <td class="text-right whitespace-nowrap">
                  <button type="button" class="text-brand-600 hover:underline text-sm mr-3" (click)="download(d)">Download</button>
                  <button type="button" *ngIf="editable()" class="text-red-600 hover:underline text-sm" (click)="removeDocument(d)">Delete</button>
                </td>
              </tr>
            </tbody>
          </table>
          <p *ngIf="!documents().length" class="muted text-sm">No documents uploaded yet.</p>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-ink-100">
          <button type="button" class="btn-secondary" [disabled]="st.number === 1" (click)="go(st.number - 1)">Back</button>
          <div class="flex gap-3">
            <button type="button" class="btn-secondary" *ngIf="st.number < steps.length" (click)="go(st.number + 1)">Skip for now</button>
            <button type="button" class="btn-primary" *ngIf="editable()" [disabled]="busy()" (click)="save(st)">
              {{ busy() ? 'Saving...' : st.submits ? 'Submit for review' : 'Save and continue' }}
            </button>
          </div>
        </div>
      </section>
    </div>
  </div>

  <ng-template #loadingTpl>
    <div class="max-w-6xl mx-auto card p-10 text-center">
      <p *ngIf="!loadError()" class="muted">Loading your verification...</p>
      <ng-container *ngIf="loadError()">
        <p class="text-red-700 mb-3">{{ loadError() }}</p>
        <button class="btn-primary" (click)="load()">Try again</button>
      </ng-container>
    </div>
  </ng-template>
  `
})
export class KycWizardComponent implements OnInit {
  readonly steps = KYC_STEPS;
  record = signal<KycRecord | null>(null);
  progress = signal<KycProgress | null>(null);
  active = signal(1);
  model: Record<number, any> = {};
  errors = signal<Record<string, string>>({});
  busy = signal(false);
  error = signal('');
  notice = signal('');
  loadError = signal('');
  documents = signal<KycDocument[]>([]);
  uploading = signal(false);
  docError = signal('');
  docTypes = signal<Choice[]>([]);
  resubmitNote = '';
  docType = '';
  docDescription = '';
  file: File | null = null;
  private choiceMap: Record<string, Choice[]> = {};

  step = computed(() => this.steps.find(s => s.number === this.active()));
  editable = computed(() => this.record()?.editable === true);

  constructor(private kyc: KycApiService, private util: UtilService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loadError.set('');
    forkJoin({ rec: this.kyc.record(), options: this.kyc.options(), countries: this.util.countries$ }).subscribe({
      next: ({ rec, options, countries }) => {
        this.buildChoices(options, countries.map(c => ({ value: c.name, label: c.name })));
        this.applyRecord(rec);
        const first = rec.steps.find(s => s.current)?.number ?? rec.steps.find(s => !s.completed)?.number ?? 1;
        if (this.active() === 1 && !this.record()) this.active.set(first);
        this.record.set(rec);
        this.syncApproval(rec);
      },
      error: (e: ApiError) => this.loadError.set(e.userMessage)
    });
  }

  /** After approval the session still carries the old "not approved" state, so refresh it once. */
  private syncApproval(rec: KycRecord) {
    if (rec.status === 'APPROVED' && !this.auth.currentUser()?.companyApproved) {
      this.auth.refreshAccessToken().subscribe({ next: () => this.auth.reloadProfile().subscribe({ error: () => undefined }), error: () => undefined });
    }
  }

  private buildChoices(o: KycOptions, countries: Choice[]) {
    const plain = (list: string[]) => list.map(v => ({ value: v, label: humanize(v) }));
    this.choiceMap = {
      country: countries,
      businessTypes: plain(o.businessTypes), licenceTypes: plain(o.licenceTypes), licenceCategories: plain(o.licenceCategories),
      industrySectors: plain(o.industrySectors), countryCounts: plain(o.countryCounts),
      transactionCountRanges: plain(o.transactionCountRanges).map(c => ({ ...c, label: c.label.replace(/ to /, ' to ') })),
      paymentForms: plain(o.paymentForms), foreignLicencePresence: plain(o.foreignLicencePresence),
      customerRegistrationMethods: plain(o.customerRegistrationMethods)
    };
    this.docTypes.set(o.documentTypes.map(d => ({ value: d.value, label: d.label })));
  }

  private applyRecord(rec: KycRecord) {
    this.documents.set(rec.documents ?? []);
    this.progress.set({ status: rec.status, progressPercentage: rec.progressPercentage, editable: rec.editable, steps: rec.steps,
      requiredDocuments: rec.requiredDocuments, openInfoRequest: rec.infoRequests?.find(r => r.status === 'OPEN') ?? null });
    for (const st of this.steps) {
      const saved = JSON.parse(JSON.stringify(rec.sections?.[STEP_SECTION[st.number]] ?? {}));
      for (const l of st.lists ?? []) {
        saved[l.key] = Array.isArray(saved[l.key]) ? saved[l.key] : [];
        if (!saved[l.key].length && l.min > 0 && rec.editable) saved[l.key].push({});
      }
      this.model[st.number] = saved;
    }
  }

  // ------------------------------------------------------------------ helpers used by the template

  get = getPath;
  size = (bytes: number) => bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';
  label = humanize;

  statusLabel(s: string) {
    return s === 'MORE_INFO_REQUIRED' ? 'More information needed' : s === 'IN_REVIEW' ? 'In review' : humanize(s);
  }

  statusClass(s: string) {
    return s === 'APPROVED' ? 'badge-green' : s === 'REJECTED' ? 'badge-red' : s === 'DRAFT' ? 'badge-gray' : 'badge-yellow';
  }

  isDone(n: number) {
    return !!(this.progress()?.steps.find(s => s.number === n)?.completed);
  }

  choicesFor(f: KycField): Choice[] {
    return f.type === 'country' ? this.choiceMap['country'] ?? [] : f.options ? this.choiceMap[f.options] ?? [] : [];
  }

  visible(f: KycField, m: any) {
    return !f.showIf || f.showIf(m, this.model);
  }

  isRequired(f: KycField, m: any) {
    return typeof f.required === 'function' ? f.required(m, this.model) : f.required === true;
  }

  rows(st: KycStepDef, l: KycList): any[] {
    return this.model[st.number][l.key];
  }

  addRow(st: KycStepDef, l: KycList) {
    this.rows(st, l).push({});
  }

  removeRow(st: KycStepDef, l: KycList, i: number) {
    this.rows(st, l).splice(i, 1);
    this.errors.set({});
  }

  /** Edits are applied in place; the error under that field disappears as soon as it is touched. */
  set(model: any, key: string, value: unknown, errorKey: string) {
    setPath(model, key, value);
    if (this.errors()[errorKey]) {
      const { [errorKey]: _gone, ...rest } = this.errors();
      this.errors.set(rest);
    }
  }

  go(n: number) {
    if (n < 1 || n > this.steps.length) return;
    this.active.set(n);
    this.errors.set({});
    this.error.set('');
    this.notice.set('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ------------------------------------------------------------------ validation and saving

  private fieldError(f: KycField, m: any): string {
    const v = getPath(m, f.key);
    if (empty(v)) return this.isRequired(f, m) ? `${f.label} is required` : '';
    if (f.type === 'email' && !EMAIL.test(v)) return 'Enter a valid email address';
    if (f.type === 'tel' && !PHONE.test(v)) return 'Use 7 to 15 digits, with an optional leading +';
    if ((f.type === 'number' || f.type === 'percent') && (f.min !== undefined && v < f.min || f.max !== undefined && v > f.max)) {
      return `Enter a value between ${f.min} and ${f.max}`;
    }
    if (f.type === 'date' && f.dateRule) {
      if (f.dateRule === 'not-future' && v > today()) return 'The date cannot be in the future';
      if (f.dateRule === 'past' && v >= today()) return 'The date must be in the past';
    }
    return '';
  }

  private validate(st: KycStepDef): Record<string, string> {
    const errs: Record<string, string> = {};
    const m = this.model[st.number];
    for (const g of st.groups) {
      for (const f of g.fields) {
        if (!this.visible(f, m)) continue;
        const e = this.fieldError(f, m);
        if (e) errs[f.key] = e;
      }
    }
    for (const l of st.lists ?? []) {
      const rows = m[l.key] as any[];
      if (rows.length < l.min) errs[l.key] = `Add at least ${l.min} ${l.singular.toLowerCase()}`;
      rows.forEach((row, i) => l.fields.forEach(f => {
        if (!this.visible(f, row)) return;
        const e = this.fieldError(f, row);
        if (e) errs[`${l.key}.${i}.${f.key}`] = e;
      }));
    }
    if (st.number === 3) {
      const all = [...m.naturalPersonShareholders, ...m.entityShareholders];
      if (!all.length) errs['naturalPersonShareholders'] = 'Add at least one shareholder';
      else if (all.reduce((t, r) => t + (Number(r.percentageOfShares) || 0), 0) > 100.01) errs['naturalPersonShareholders'] = 'Shareholdings add up to more than 100%';
    }
    return errs;
  }

  /** Only what the server expects: hidden and empty fields are left out, and row counts are derived from the lists. */
  private body(st: KycStepDef): any {
    const m = this.model[st.number];
    const out: any = {};
    for (const g of st.groups) {
      for (const f of g.fields) {
        if (!this.visible(f, m)) continue;
        const v = getPath(m, f.key);
        if (!empty(v)) setPath(out, f.key, v);
      }
    }
    for (const l of st.lists ?? []) {
      out[l.key] = (m[l.key] as any[]).map(row => {
        const r: any = {};
        for (const f of l.fields) {
          const v = getPath(row, f.key);
          if (this.visible(f, row) && !empty(v)) setPath(r, f.key, v);
        }
        return r;
      });
      out[l.countKey] = out[l.key].length;
    }
    if (st.number === 9) out.numberOfPaymentFormsAccepted = (out.paymentFormsAccepted ?? []).length;
    return out;
  }

  save(st: KycStepDef) {
    this.error.set('');
    this.notice.set('');
    const errs = this.validate(st);
    this.errors.set(errs);
    if (Object.keys(errs).length) {
      this.error.set('Please fix the highlighted fields.');
      setTimeout(() => document.querySelector('[role=alert]')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
      return;
    }
    this.busy.set(true);
    this.kyc.saveStep(st.number, this.body(st)).subscribe({
      next: r => {
        this.busy.set(false);
        this.progress.set(r.progress);
        if (r.submitted || st.submits) {
          this.notice.set('Your application has been submitted for review.');
          this.reloadRecord();
        } else {
          this.notice.set(`Step ${st.number} saved.`);
          this.go(st.number + 1);
          this.notice.set(`Step ${st.number} saved.`);
        }
      },
      error: (e: ApiError) => {
        this.busy.set(false);
        this.error.set(e.userMessage);
      }
    });
  }

  private reloadRecord() {
    this.kyc.record().subscribe({
      next: rec => {
        this.applyRecord(rec);
        this.record.set(rec);
        this.syncApproval(rec);
      },
      error: (e: ApiError) => this.error.set(e.userMessage)
    });
  }

  resubmit() {
    this.busy.set(true);
    this.error.set('');
    this.kyc.resubmit(this.resubmitNote.trim() || undefined).subscribe({
      next: () => {
        this.busy.set(false);
        this.resubmitNote = '';
        this.notice.set('Thank you. Your application has been sent back for review.');
        this.reloadRecord();
      },
      error: (e: ApiError) => {
        this.busy.set(false);
        this.error.set(e.userMessage);
      }
    });
  }

  // ------------------------------------------------------------------ documents

  pickFile(ev: Event) {
    this.docError.set('');
    const f = (ev.target as HTMLInputElement).files?.[0] ?? null;
    if (f && f.size > MAX_UPLOAD_BYTES) {
      this.docError.set('That file is larger than 10 MB.');
      this.file = null;
      return;
    }
    this.file = f;
  }

  upload() {
    if (!this.file || !this.docType) return;
    this.uploading.set(true);
    this.docError.set('');
    this.kyc.upload(this.file, this.docType, this.docDescription.trim() || undefined).subscribe({
      next: () => {
        this.uploading.set(false);
        this.file = null;
        (document.getElementById('doc-file') as HTMLInputElement | null)?.value && ((document.getElementById('doc-file') as HTMLInputElement).value = '');
        this.refreshDocuments();
      },
      error: (e: ApiError) => {
        this.uploading.set(false);
        this.docError.set(e.userMessage);
      }
    });
  }

  removeDocument(d: KycDocument) {
    if (!confirm(`Delete ${d.fileName}?`)) return;
    this.kyc.deleteDocument(d.documentId).subscribe({
      next: () => this.refreshDocuments(),
      error: (e: ApiError) => this.docError.set(e.userMessage)
    });
  }

  download(d: KycDocument) {
    this.kyc.download(d.documentId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = d.fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.docError.set('The file could not be downloaded.')
    });
  }

  private refreshDocuments() {
    forkJoin({ docs: this.kyc.documents(), progress: this.kyc.progress() }).subscribe({
      next: ({ docs, progress }) => {
        this.documents.set(docs);
        this.progress.set(progress);
      },
      error: (e: ApiError) => this.docError.set(e.userMessage)
    });
  }
}
