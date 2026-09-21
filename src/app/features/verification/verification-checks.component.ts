import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
import { AuthService } from '../../core/services/auth.service';
import { VerificationApiService, VerificationType, VerificationView } from '../../core/services/verification-api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

type Kind = 'id' | 'business' | 'document';

interface TypeDef {
  value: VerificationType;
  label: string;
  numberLabel: string;
  /** Fields this check uses beyond the number. */
  fields: ('name' | 'dob' | 'phone' | 'companyName' | 'bankCode')[];
  hint?: string;
}

const TYPES: Record<Kind, TypeDef[]> = {
  id: [
    { value: 'BVN', label: 'Bank Verification Number (BVN)', numberLabel: 'BVN (11 digits)', fields: ['name', 'dob', 'phone'] },
    { value: 'NIN', label: 'National Identification Number (NIN)', numberLabel: 'NIN (11 digits)', fields: ['name', 'dob'] },
    { value: 'INTERNATIONAL_PASSPORT', label: 'International passport', numberLabel: 'Passport number', fields: ['name', 'dob'] },
    { value: 'DRIVERS_LICENCE', label: 'Driver’s licence', numberLabel: 'Licence number', fields: ['name', 'dob'] },
    { value: 'VOTERS_CARD', label: 'Voter’s card', numberLabel: 'Voter’s card number (VIN)', fields: ['name'] },
    { value: 'PHONE_NUMBER', label: 'Phone number', numberLabel: 'Phone number', fields: ['name'] }
  ],
  business: [
    { value: 'CAC', label: 'Company registration (CAC RC / BN)', numberLabel: 'Registration number', fields: ['companyName'] },
    { value: 'TIN', label: 'Tax identification number (TIN)', numberLabel: 'TIN', fields: ['companyName'] },
    { value: 'BANK_ACCOUNT', label: 'Bank account', numberLabel: 'Account number', fields: ['name', 'bankCode'] }
  ],
  document: [
    { value: 'DOCUMENT', label: 'Document authenticity', numberLabel: 'Document reference or number', fields: ['name'], hint: 'The provider checks the reference against the issuing record.' }
  ]
};

const TITLES: Record<Kind, { title: string; subtitle: string; runTitle: string }> = {
  id: { title: 'ID Verification', subtitle: 'Check a person’s identity document against the official record.', runTitle: 'Run an ID check' },
  business: { title: 'Business Verification', subtitle: 'Check a company registration, tax number or bank account.', runTitle: 'Run a business check' },
  document: { title: 'Document Verification', subtitle: 'Check that a document reference is genuine.', runTitle: 'Run a document check' }
};

/**
 * The manual verification tools: run a check through the platform's verification provider and keep the company's history of them.
 * The same screen serves the ID, business and document pages; only the kinds of check offered differ. Identity numbers are masked in
 * the history (the server keeps only the last three characters).
 */
@Component({
  selector: 'app-verification-checks',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent],
  template: `
  <app-page-header [title]="text.title" [subtitle]="text.subtitle"></app-page-header>

  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

  <div class="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-5 items-start">
    <!-- run a check -->
    <section class="card p-5">
      <h2 class="font-semibold text-ink-900 mb-3">{{ text.runTitle }}</h2>
      <p *ngIf="!canRun" class="text-sm text-ink-500 mb-3">Running checks needs the Compliance Officer role (level 3) or higher. You can still read the history.</p>
      <form (ngSubmit)="run()" class="space-y-3" novalidate>
        <div *ngIf="types.length > 1">
          <label class="label" for="v-type">Type of check</label>
          <select id="v-type" class="input" [(ngModel)]="typeValue" name="type" [disabled]="!canRun || busy()">
            <option *ngFor="let t of types" [value]="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div>
          <label class="label" for="v-number">{{ def().numberLabel }}</label>
          <input id="v-number" class="input font-mono" [(ngModel)]="idNumber" name="idNumber" autocomplete="off" maxlength="64" [disabled]="!canRun || busy()"/>
          <p class="text-xs text-ink-500 mt-1" *ngIf="def().hint">{{ def().hint }}</p>
        </div>
        <div class="grid grid-cols-2 gap-3" *ngIf="uses('name')">
          <div><label class="label" for="v-first">First name</label><input id="v-first" class="input" [(ngModel)]="firstName" name="firstName" maxlength="100" [disabled]="!canRun || busy()"/></div>
          <div><label class="label" for="v-last">Last name</label><input id="v-last" class="input" [(ngModel)]="lastName" name="lastName" maxlength="100" [disabled]="!canRun || busy()"/></div>
        </div>
        <div *ngIf="uses('companyName')"><label class="label" for="v-company">Company name</label><input id="v-company" class="input" [(ngModel)]="companyName" name="companyName" maxlength="200" [disabled]="!canRun || busy()"/></div>
        <div *ngIf="uses('bankCode')"><label class="label" for="v-bank">Bank code</label><input id="v-bank" class="input" [(ngModel)]="bankCode" name="bankCode" maxlength="10" placeholder="e.g. 058" [disabled]="!canRun || busy()"/></div>
        <div *ngIf="uses('dob')"><label class="label" for="v-dob">Date of birth</label><input id="v-dob" class="input" type="date" [(ngModel)]="dob" name="dob" [disabled]="!canRun || busy()"/></div>
        <div *ngIf="uses('phone')"><label class="label" for="v-phone">Phone (optional)</label><input id="v-phone" class="input" type="tel" [(ngModel)]="phone" name="phone" maxlength="32" [disabled]="!canRun || busy()"/></div>
        <button class="btn-primary w-full" type="submit" [disabled]="!canRun || busy() || !idNumber.trim()">{{ busy() ? 'Checking...' : 'Run check' }}</button>
      </form>

      <div *ngIf="latest() as v" class="mt-5 p-4 rounded-xl border" [ngClass]="cardClass(v.status)" role="status">
        <p class="font-semibold">{{ statusLabel(v.status) }}<span *ngIf="v.matchScore != null"> &middot; match {{ v.matchScore }}%</span></p>
        <p class="text-sm mt-1">{{ v.message }}</p>
        <button class="text-sm underline mt-2" (click)="open(v)">See the details</button>
      </div>
    </section>

    <!-- history -->
    <section class="card">
      <div class="p-4 flex flex-wrap items-center justify-between gap-3 border-b border-ink-100">
        <h2 class="font-semibold text-ink-900">History</h2>
        <select class="input !w-auto" [(ngModel)]="statusFilter" aria-label="Filter by result">
          <option value="all">All results</option><option value="VERIFIED">Verified</option><option value="REVIEW">Needs review</option><option value="FAILED">Not verified</option>
        </select>
      </div>
      <div class="overflow-x-auto">
        <table class="table">
          <thead><tr><th>Check</th><th>Subject</th><th>Number</th><th>Result</th><th>Match</th><th>When</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let v of filtered()">
              <td>{{ typeLabel(v.type) }}</td>
              <td>{{ v.subject || '—' }}</td>
              <td class="font-mono text-xs">{{ v.maskedNumber }}</td>
              <td><span [ngClass]="badge(v.status)">{{ statusLabel(v.status) }}</span></td>
              <td>{{ v.matchScore != null ? v.matchScore + '%' : '—' }}</td>
              <td class="text-sm text-ink-500 whitespace-nowrap">{{ v.createdAt | date: 'medium' }}</td>
              <td class="text-right"><button class="btn-secondary btn-sm" (click)="open(v)">Details</button></td>
            </tr>
            <tr *ngIf="loaded && !filtered().length"><td colspan="7" class="text-center text-sm text-ink-400 py-8">No checks yet.</td></tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>

  <app-modal [open]="!!selected()" title="Check details" (close)="selected.set(null)">
    <div *ngIf="selected() as v" class="space-y-4 text-sm">
      <div class="flex items-center gap-2"><span [ngClass]="badge(v.status)">{{ statusLabel(v.status) }}</span><span class="text-ink-500">{{ typeLabel(v.type) }} &middot; {{ v.createdAt | date: 'medium' }}</span></div>
      <p>{{ v.message }}</p>
      <dl class="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5">
        <dt class="text-ink-500">Reference</dt><dd class="font-mono text-xs">{{ v.id }}</dd>
        <dt class="text-ink-500">Number</dt><dd class="font-mono text-xs">{{ v.maskedNumber }}</dd>
        <dt class="text-ink-500" *ngIf="v.subject">Subject</dt><dd *ngIf="v.subject">{{ v.subject }}</dd>
        <dt class="text-ink-500">Provider</dt><dd>{{ v.provider }}</dd>
        <dt class="text-ink-500" *ngIf="v.matchScore != null">Match score</dt><dd *ngIf="v.matchScore != null">{{ v.matchScore }}%</dd>
      </dl>
      <div *ngIf="entries(v).length">
        <p class="font-medium text-ink-800 mb-1">What the provider returned</p>
        <dl class="grid grid-cols-[140px_1fr] gap-x-3 gap-y-1.5 bg-ink-50 rounded-lg p-3">
          <ng-container *ngFor="let e of entries(v)"><dt class="text-ink-500">{{ e[0] }}</dt><dd class="break-words">{{ e[1] }}</dd></ng-container>
        </dl>
      </div>
    </div>
    <div modal-footer class="w-full sm:w-auto"><button class="btn-primary w-full" (click)="selected.set(null)">Close</button></div>
  </app-modal>
  `
})
export class VerificationChecksComponent implements OnInit {
  @Input() kind: Kind = 'id';

  all: VerificationView[] = [];
  loaded = false;
  busy = signal(false);
  error = signal('');
  latest = signal<VerificationView | null>(null);
  selected = signal<VerificationView | null>(null);
  statusFilter = 'all';

  typeValue: VerificationType = 'BVN';
  idNumber = '';
  firstName = '';
  lastName = '';
  companyName = '';
  bankCode = '';
  dob = '';
  phone = '';

  constructor(private api: VerificationApiService, private auth: AuthService) {}

  get types(): TypeDef[] { return TYPES[this.kind]; }
  get text() { return TITLES[this.kind]; }
  get canRun() { return this.auth.hasMinRole(3); }

  ngOnInit() {
    this.typeValue = this.types[0].value;
    this.load();
  }

  private load() {
    this.api.list().subscribe({
      next: p => { this.all = p.items; this.loaded = true; },
      error: (e: ApiError) => { this.loaded = true; this.error.set(e.httpStatus === 403 ? 'You need the Compliance Analyst role (level 2) or higher to see checks.' : e.userMessage); }
    });
  }

  def(): TypeDef { return this.types.find(t => t.value === this.typeValue) ?? this.types[0]; }
  uses(f: TypeDef['fields'][number]) { return this.def().fields.includes(f); }
  typeLabel(t: VerificationType) { return Object.values(TYPES).flat().find(x => x.value === t)?.label ?? t; }

  /** This page only lists the kinds of check it can run. */
  filtered(): VerificationView[] {
    const mine = new Set<string>(this.types.map(t => t.value));
    return this.all.filter(v => mine.has(v.type) && (this.statusFilter === 'all' || v.status === this.statusFilter));
  }

  run() {
    const number = this.idNumber.trim();
    if (!number || this.busy()) return;
    const extra: Record<string, string> = {};
    if (this.uses('companyName') && this.companyName.trim()) extra['companyName'] = this.companyName.trim();
    if (this.uses('bankCode') && this.bankCode.trim()) extra['bankCode'] = this.bankCode.trim();
    this.busy.set(true);
    this.error.set('');
    this.api.run({
      type: this.typeValue, idNumber: number,
      firstName: this.uses('name') ? this.firstName.trim() || undefined : undefined,
      lastName: this.uses('name') ? this.lastName.trim() || undefined : undefined,
      dateOfBirth: this.uses('dob') ? this.dob || undefined : undefined,
      phone: this.uses('phone') ? this.phone.trim() || undefined : undefined,
      extra: Object.keys(extra).length ? extra : undefined
    }).subscribe({
      next: v => {
        this.busy.set(false);
        this.latest.set(v);
        this.idNumber = '';
        this.all = [v, ...this.all];
      },
      error: (e: ApiError) => {
        this.busy.set(false);
        this.error.set(e.httpStatus === 503 ? 'The verification service is not available right now. Please try again shortly.' : e.userMessage);
      }
    });
  }

  open(v: VerificationView) { this.selected.set(v); }

  entries(v: VerificationView): [string, string][] {
    return Object.entries(v.result ?? {}).filter(([, val]) => val !== null && val !== '').map(([k, val]) => [this.humanize(k), String(val)]);
  }

  private humanize(k: string): string {
    const s = k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim().toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  statusLabel(s: string) { return s === 'VERIFIED' ? 'Verified' : s === 'REVIEW' ? 'Needs review' : s === 'FAILED' ? 'Not verified' : s; }
  badge(s: string) { return s === 'VERIFIED' ? 'badge-green' : s === 'REVIEW' ? 'badge-yellow' : 'badge-red'; }
  cardClass(s: string) { return s === 'VERIFIED' ? 'bg-brand-50 border-brand-200 text-brand-900' : s === 'REVIEW' ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-900'; }
}
