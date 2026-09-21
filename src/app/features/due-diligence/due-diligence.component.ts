import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { Customer } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';
import { ComplianceApiService } from '../../core/services/compliance-api.service';
import { DdKind, DdSuggestion, DdStatus, DueDiligence, OperationsApiService } from '../../core/services/operations-api.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

const STATUS: Record<DdStatus, { label: string; badge: string }> = {
  IN_PROGRESS: { label: 'In progress', badge: 'badge-blue' },
  PENDING_REVIEW: { label: 'Waiting for review', badge: 'badge-yellow' },
  COMPLETED: { label: 'Completed', badge: 'badge-green' }
};

/**
 * Customer due diligence (CDD) and enhanced due diligence (EDD) files. The team fills a checklist, submits it, and a Compliance
 * Officer approves it or sends it back. The platform pre-fills only what it already knows (a passed identity check, a screening)
 * and says where it came from; it never completes an item on its own. The same screen serves both kinds.
 */
@Component({
  selector: 'app-due-diligence',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, ModalComponent],
  template: `
  <app-page-header [title]="kind === 'CDD' ? 'Customer Due Diligence' : 'Enhanced Due Diligence'"
    [subtitle]="kind === 'CDD' ? 'The standard checks on every customer: who they are, what they do, where their money comes from.' : 'The extra scrutiny for high-risk customers: politically exposed persons, sanctions concerns and high risk scores.'">
    <button *ngIf="auth.hasMinRole(3)" class="btn-primary" (click)="openPicker()">Open a {{ kind }} file</button>
  </app-page-header>

  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>
  <div *ngIf="toast()" class="fixed bottom-6 right-6 z-40 bg-ink-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg fade-in">{{ toast() }}</div>

  <div class="card p-4 mb-5 border-l-4 border-amber-400" *ngIf="suggestions().length && auth.hasMinRole(3)">
    <p class="font-medium text-ink-900">{{ suggestions().length }} customer{{ suggestions().length > 1 ? 's' : '' }} probably need{{ suggestions().length > 1 ? '' : 's' }} a {{ kind }} file</p>
    <ul class="mt-2 space-y-1 text-sm">
      <li *ngFor="let s of suggestions().slice(0, 5)" class="flex items-center gap-2">
        <span class="text-ink-800">{{ s.customerName }}</span>
        <span class="text-ink-500" *ngIf="s.reasons.length">{{ s.reasons.join('; ') }}</span>
        <button class="btn-secondary btn-sm ml-auto" (click)="open(s.submissionId)">Open file</button>
      </li>
    </ul>
  </div>

  <div class="grid grid-cols-3 gap-4 mb-5">
    <div class="card p-4"><p class="muted">In progress</p><p class="text-2xl font-bold text-blue-600">{{ count('IN_PROGRESS') }}</p></div>
    <div class="card p-4"><p class="muted">Waiting for review</p><p class="text-2xl font-bold text-amber-600">{{ count('PENDING_REVIEW') }}</p></div>
    <div class="card p-4"><p class="muted">Completed</p><p class="text-2xl font-bold text-brand-600">{{ count('COMPLETED') }}</p><p class="text-xs text-red-600" *ngIf="overdueCount()">{{ overdueCount() }} due for another review</p></div>
  </div>

  <div class="grid lg:grid-cols-5 gap-5">
    <div class="lg:col-span-2">
      <div class="card overflow-x-auto">
        <table class="table" aria-label="Files">
          <thead><tr><th>Customer</th><th>Done</th><th>Status</th></tr></thead>
          <tbody>
            <tr *ngFor="let f of files()" class="cursor-pointer" [class.bg-brand-50]="selected()?.id === f.id" (click)="select(f)">
              <td><span class="font-medium text-ink-900">{{ f.customerName }}</span><p class="text-xs text-ink-500">{{ f.riskLevel || 'no risk rating' }} risk</p></td>
              <td class="text-sm">{{ f.completionPercent }}%</td>
              <td><span [ngClass]="statusOf(f).badge">{{ statusOf(f).label }}</span><p class="text-xs text-red-600" *ngIf="f.reviewOverdue">review overdue</p></td>
            </tr>
          </tbody>
        </table>
        <p *ngIf="!loading() && !files().length" class="py-10 text-center text-sm text-ink-400">No {{ kind }} files yet.</p>
        <p *ngIf="loading()" class="py-10 text-center text-sm text-ink-400">Loading...</p>
      </div>
    </div>

    <div class="lg:col-span-3">
      <div class="card p-5" *ngIf="selected() as f">
        <div class="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 class="font-semibold text-ink-900">{{ f.customerName }}</h3>
            <p class="text-xs text-ink-500">{{ f.email }} <span *ngIf="f.country">· {{ f.country }}</span>
              <a *ngIf="f.submissionId" class="text-brand-600 ml-2" [routerLink]="['/app/my-clients', f.submissionId]">Open customer</a></p>
          </div>
          <span [ngClass]="statusOf(f).badge">{{ statusOf(f).label }}</span>
        </div>

        <div *ngIf="f.reasons.length" class="mb-3 p-3 rounded-lg bg-amber-50 text-sm text-amber-800">
          <p class="font-medium">Why this file was opened</p>
          <ul class="list-disc ml-5"><li *ngFor="let r of f.reasons">{{ r }}</li></ul>
        </div>
        <div *ngIf="f.decisionReason && f.status === 'IN_PROGRESS'" class="mb-3 p-3 rounded-lg bg-red-50 text-sm text-red-700">
          <p class="font-medium">Sent back by {{ f.decidedBy }}</p><p>{{ f.decisionReason }}</p>
        </div>
        <p class="text-sm text-ink-600 mb-3" *ngIf="f.status === 'COMPLETED'">Approved by {{ f.decidedBy }} on {{ f.decidedAt | date: 'mediumDate' }}. Next review by <strong [class.text-red-600]="f.reviewOverdue">{{ f.nextReviewAt | date: 'mediumDate' }}</strong>.</p>

        <div class="h-1.5 bg-ink-100 rounded-full overflow-hidden mb-4"><div class="h-full bg-brand-600" [style.width.%]="f.completionPercent"></div></div>

        <div class="space-y-3 mb-4">
          <div *ngFor="let i of f.checklist">
            <label class="text-sm text-ink-700 flex items-center gap-1.5" [attr.for]="'dd-' + i.key">
              <span [class.text-brand-600]="i.completed" [class.text-ink-300]="!i.completed" aria-hidden="true">{{ i.completed ? '●' : '○' }}</span>
              {{ i.label }} <span class="text-red-500" *ngIf="i.required" title="Required">*</span>
            </label>
            <textarea class="input mt-1" rows="2" [id]="'dd-' + i.key" [ngModel]="i.value" [disabled]="f.status !== 'IN_PROGRESS' || !auth.hasMinRole(3)"
              (change)="setField(f, i.key, $any($event.target).value)" placeholder="Not yet provided"></textarea>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 mb-5">
          <button class="btn-secondary btn-sm" *ngIf="auth.hasMinRole(3)" [disabled]="busy() || f.status !== 'IN_PROGRESS' || f.completionPercent < 100" (click)="submit(f)">Submit for review</button>
          <button class="btn-primary btn-sm" *ngIf="auth.hasMinRole(4)" [disabled]="busy() || f.status !== 'PENDING_REVIEW'" (click)="approve(f)">Approve</button>
          <button class="btn-secondary btn-sm" *ngIf="auth.hasMinRole(4)" [disabled]="busy() || f.status !== 'PENDING_REVIEW'" (click)="sendBackOpen = true">Send back</button>
        </div>

        <h4 class="text-sm font-semibold text-ink-900 mb-2">Notes</h4>
        <ul class="space-y-2 mb-3"><li *ngFor="let n of f.notes" class="text-sm"><span class="font-medium">{{ n.author }}</span> <span class="text-xs text-ink-400">{{ n.at | date: 'medium' }}</span><p class="text-ink-700">{{ n.text }}</p></li></ul>
        <p class="text-sm text-ink-400 mb-2" *ngIf="!f.notes.length">No notes yet.</p>
        <div class="flex gap-2" *ngIf="auth.hasMinRole(3)">
          <input class="input" aria-label="New note" [(ngModel)]="noteText" placeholder="Add a note" (keyup.enter)="addNote(f)"/>
          <button class="btn-secondary" [disabled]="!noteText.trim()" (click)="addNote(f)">Add</button>
        </div>
      </div>
      <div class="card p-10 text-center text-sm text-ink-400" *ngIf="!selected()">Pick a file on the left to work on it.</div>
    </div>
  </div>

  <app-modal [open]="pickerOpen" [title]="'Open a ' + kind + ' file'" subtitle="Choose the customer it is for." (close)="pickerOpen = false" [showFooter]="false">
    <input class="input mb-3" aria-label="Search customers" placeholder="Search by name or email" [(ngModel)]="pickerQuery"/>
    <ul class="divide-y divide-ink-100 max-h-72 overflow-y-auto">
      <li *ngFor="let c of pickerList()" class="py-2 flex items-center gap-2">
        <span class="text-sm"><span class="font-medium text-ink-900">{{ c.fullName }}</span> <span class="text-ink-500">{{ c.email }}</span></span>
        <span class="badge-gray ml-auto">{{ c.riskLevel || 'unrated' }}</span>
        <button class="btn-secondary btn-sm" (click)="open(c.id)">Open</button>
      </li>
    </ul>
    <p class="text-sm text-ink-400 py-4" *ngIf="!pickerList().length">No customers match.</p>
  </app-modal>

  <app-modal [open]="sendBackOpen" title="Send this file back" subtitle="Say what has to be fixed. The reason is kept with the file." (close)="sendBackOpen = false">
    <label class="label" for="sb-reason">What needs fixing</label>
    <textarea id="sb-reason" class="input" rows="3" [(ngModel)]="sendBackReason"></textarea>
    <div modal-footer class="flex gap-2">
      <button class="btn-secondary" (click)="sendBackOpen = false">Cancel</button>
      <button class="btn-primary" [disabled]="!sendBackReason.trim() || busy()" (click)="sendBack()">Send back</button>
    </div>
  </app-modal>
  `
})
export class DueDiligenceComponent implements OnInit {
  @Input() kind: DdKind = 'CDD';

  files = signal<DueDiligence[]>([]);
  selected = signal<DueDiligence | null>(null);
  suggestions = signal<DdSuggestion[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  toast = signal('');
  noteText = '';
  pickerOpen = false;
  pickerQuery = '';
  customers: Customer[] = [];
  sendBackOpen = false;
  sendBackReason = '';

  constructor(public auth: AuthService, private ops: OperationsApiService, private api: ComplianceApiService) {}

  ngOnInit() { this.load(); }

  statusOf(f: DueDiligence) { return STATUS[f.status]; }
  count(s: DdStatus) { return this.files().filter(f => f.status === s).length; }
  overdueCount() { return this.files().filter(f => f.reviewOverdue).length; }

  load(selectId?: string) {
    this.ops.dueDiligence(this.kind).subscribe({
      next: list => {
        this.loading.set(false);
        this.files.set(list);
        const keep = selectId ?? this.selected()?.id;
        this.selected.set(list.find(f => f.id === keep) ?? null);
      },
      error: (e: ApiError) => { this.loading.set(false); this.error.set(e.userMessage); }
    });
    if (this.auth.hasMinRole(3)) {
      this.ops.ddSuggestions().subscribe({ next: s => this.suggestions.set(s.filter(x => x.kind === this.kind)), error: () => this.suggestions.set([]) });
    }
  }

  select(f: DueDiligence) { this.selected.set(f); this.error.set(''); }

  openPicker() {
    this.pickerOpen = true;
    if (!this.customers.length) this.api.customers({ size: 200 }).subscribe({ next: p => (this.customers = p.items), error: (e: ApiError) => this.error.set(e.userMessage) });
  }

  pickerList() {
    const q = this.pickerQuery.trim().toLowerCase();
    return this.customers.filter(c => !q || c.fullName.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)).slice(0, 50);
  }

  open(submissionId: string) {
    this.busy.set(true);
    this.ops.openDd(submissionId, this.kind).subscribe({
      next: d => { this.busy.set(false); this.pickerOpen = false; this.flash(`${this.kind} file opened.`); this.load(d.id); },
      error: (e: ApiError) => { this.busy.set(false); this.pickerOpen = false; this.error.set(e.userMessage); }
    });
  }

  setField(f: DueDiligence, key: string, value: string) {
    this.ops.setDdField(f.id, key, value).subscribe({ next: d => this.replace(d), error: (e: ApiError) => { this.error.set(e.userMessage); this.load(f.id); } });
  }

  addNote(f: DueDiligence) {
    const text = this.noteText.trim();
    if (!text) return;
    this.ops.addDdNote(f.id, text).subscribe({ next: d => { this.noteText = ''; this.replace(d); }, error: (e: ApiError) => this.error.set(e.userMessage) });
  }

  submit(f: DueDiligence) { this.act(this.ops.submitDd(f.id), 'Submitted for review.'); }
  approve(f: DueDiligence) { this.act(this.ops.approveDd(f.id), 'Approved. The next review date is set.'); }

  sendBack() {
    const f = this.selected();
    if (!f) return;
    this.act(this.ops.sendBackDd(f.id, this.sendBackReason.trim()), 'Sent back.');
    this.sendBackOpen = false;
    this.sendBackReason = '';
  }

  private act(call: import('rxjs').Observable<DueDiligence>, message: string) {
    this.busy.set(true);
    this.error.set('');
    call.subscribe({
      next: d => { this.busy.set(false); this.flash(message); this.replace(d); this.load(d.id); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  private replace(d: DueDiligence) {
    this.files.update(l => l.map(x => (x.id === d.id ? d : x)));
    this.selected.set(d);
  }

  private toastTimer?: ReturnType<typeof setTimeout>;
  private flash(m: string) {
    this.toast.set(m);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2600);
  }
}
