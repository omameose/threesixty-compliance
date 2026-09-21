import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { AuthService } from '../../core/services/auth.service';
import { Obligation, ObligationCategory, ObligationRequest, OperationsApiService } from '../../core/services/operations-api.service';
import { OverviewService, Snapshot } from '../../core/services/overview.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

const CATEGORY_LABEL: Record<ObligationCategory, string> = {
  STR: 'Suspicious transaction report', CTR: 'Currency transaction report', TRAINING: 'Training', KYC_REVIEW: 'KYC review',
  POLICY_REVIEW: 'Policy review', LICENCE: 'Licence', RETURN: 'Regulatory return', OTHER: 'Other'
};

interface Derived { date: string; title: string; detail: string; link: string[]; overdue: boolean }

/**
 * The company's own calendar of filings, reviews and training. The platform does not know any regulator's deadlines, so the company
 * records them here (with the regulator's name if it wants), and can ask for a repeat every N months. Deadlines that the platform
 * does know about, from cases, due diligence reviews and re-screening, are listed underneath, read-only.
 */
@Component({
  selector: 'app-regulatory-calendar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, ModalComponent],
  template: `
  <app-page-header title="Regulatory Calendar" subtitle="Your filings, reviews and training, with their deadlines. Add the dates your regulator gives you.">
    <button *ngIf="auth.hasMinRole(4)" class="btn-primary" (click)="openForm()">Add an obligation</button>
  </app-page-header>

  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>
  <div *ngIf="toast()" class="fixed bottom-6 right-6 z-40 bg-ink-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg fade-in">{{ toast() }}</div>

  <div class="grid grid-cols-3 gap-4 mb-5">
    <div class="card p-4"><p class="muted">Overdue</p><p class="text-2xl font-bold" [class.text-red-600]="group('overdue').length">{{ group('overdue').length }}</p></div>
    <div class="card p-4"><p class="muted">Due in 7 days</p><p class="text-2xl font-bold text-amber-600">{{ group('week').length }}</p></div>
    <div class="card p-4"><p class="muted">Later</p><p class="text-2xl font-bold text-ink-950">{{ group('later').length }}</p></div>
  </div>

  <ng-container *ngFor="let g of groups">
    <ng-container *ngIf="group(g.key).length">
      <h3 class="font-semibold text-ink-900 mb-2 mt-5">{{ g.label }}</h3>
      <div class="card overflow-x-auto">
        <table class="table" [attr.aria-label]="g.label">
          <thead><tr><th>Obligation</th><th>Type</th><th>Due</th><th>Owner</th><th></th></tr></thead>
          <tbody>
            <tr *ngFor="let o of group(g.key)">
              <td><p class="font-medium text-ink-900">{{ o.title }}</p><p class="text-xs text-ink-500"><span *ngIf="o.regulator">{{ o.regulator }} · </span><span *ngIf="o.repeatMonths">repeats every {{ o.repeatMonths }} months</span></p></td>
              <td><span class="badge-blue">{{ label(o.category) }}</span></td>
              <td class="text-sm whitespace-nowrap" [class.text-red-600]="o.overdue">{{ o.dueDate | date: 'mediumDate' }}<span class="block text-xs" *ngIf="o.status === 'OPEN'">{{ o.daysLeft < 0 ? -o.daysLeft + ' days late' : o.daysLeft === 0 ? 'today' : 'in ' + o.daysLeft + ' days' }}</span><span class="block text-xs text-ink-500" *ngIf="o.status === 'COMPLETED'">done {{ o.completedAt | date: 'mediumDate' }} by {{ o.completedBy }}</span></td>
              <td class="text-sm text-ink-600">{{ o.owner || '—' }}</td>
              <td class="text-right whitespace-nowrap" *ngIf="auth.hasMinRole(4)">
                <ng-container *ngIf="o.status === 'OPEN'">
                  <button class="btn-primary btn-sm" [disabled]="busy()" (click)="complete(o)">Mark done</button>
                  <button class="btn-secondary btn-sm ml-1" (click)="openForm(o)">Edit</button>
                </ng-container>
                <button class="btn-secondary btn-sm ml-1" (click)="confirmDelete = o">Delete</button>
              </td>
              <td *ngIf="!auth.hasMinRole(4)"></td>
            </tr>
          </tbody>
        </table>
      </div>
    </ng-container>
  </ng-container>
  <div class="card p-10 text-center text-sm text-ink-500 mt-5" *ngIf="!loading() && !items().length">No obligations yet. {{ auth.hasMinRole(4) ? 'Add the filings and reviews your regulator requires.' : 'A Compliance Officer can add them.' }}</div>
  <p *ngIf="loading()" class="py-16 text-center text-ink-400">Loading...</p>

  <ng-container *ngIf="derived().length">
    <h3 class="font-semibold text-ink-900 mb-1 mt-8">From your records</h3>
    <p class="text-sm text-ink-500 mb-2">Deadlines the platform knows about: case responses, due diligence reviews and re-screening.</p>
    <div class="card divide-y divide-ink-100">
      <a *ngFor="let d of derived()" [routerLink]="d.link" class="flex items-center justify-between gap-3 px-4 py-3 hover:bg-ink-50">
        <div><p class="text-sm font-medium text-ink-900">{{ d.title }}</p><p class="text-xs text-ink-500">{{ d.detail }}</p></div>
        <span class="text-sm whitespace-nowrap" [class.text-red-600]="d.overdue">{{ d.date | date: 'mediumDate' }}</span>
      </a>
    </div>
  </ng-container>

  <app-modal [open]="formOpen" [title]="editing ? 'Edit obligation' : 'Add an obligation'" (close)="formOpen = false">
    <div class="space-y-4">
      <div><label class="label" for="o-title">Title</label><input id="o-title" class="input" [(ngModel)]="form.title" placeholder="e.g. Annual AML return"/></div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="label" for="o-cat">Type</label>
          <select id="o-cat" class="input" [(ngModel)]="form.category"><option *ngFor="let c of categories" [value]="c">{{ label(c) }}</option></select></div>
        <div><label class="label" for="o-due">Due date</label><input id="o-due" class="input" type="date" [(ngModel)]="form.dueDate"/></div>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div><label class="label" for="o-reg">Regulator (optional)</label><input id="o-reg" class="input" [(ngModel)]="form.regulator"/></div>
        <div><label class="label" for="o-own">Owner (optional)</label><input id="o-own" class="input" [(ngModel)]="form.owner"/></div>
      </div>
      <div><label class="label" for="o-rep">Repeat every (months, optional)</label><input id="o-rep" class="input" type="number" min="1" max="60" [(ngModel)]="repeat"/>
        <p class="text-xs text-ink-500 mt-1">When you mark it done, the next one is added that many months after this due date.</p></div>
      <div><label class="label" for="o-desc">Notes (optional)</label><textarea id="o-desc" class="input" rows="2" [(ngModel)]="form.description"></textarea></div>
    </div>
    <div modal-footer class="flex gap-2">
      <button class="btn-secondary" (click)="formOpen = false">Cancel</button>
      <button class="btn-primary" [disabled]="!form.title.trim() || !form.dueDate || busy()" (click)="save()">{{ editing ? 'Save' : 'Add' }}</button>
    </div>
  </app-modal>

  <app-modal [open]="!!confirmDelete" title="Delete this obligation?" (close)="confirmDelete = null">
    <p class="text-sm text-ink-600">Delete <strong>{{ confirmDelete?.title }}</strong>? Completed items are a record of what was done, so only delete one you added by mistake. The audit trail keeps a note of the deletion.</p>
    <div modal-footer class="flex gap-2">
      <button class="btn-secondary" (click)="confirmDelete = null">Cancel</button>
      <button class="btn-danger" [disabled]="busy()" (click)="remove()">Delete</button>
    </div>
  </app-modal>
  `
})
export class RegulatoryCalendarComponent implements OnInit {
  items = signal<Obligation[]>([]);
  derived = signal<Derived[]>([]);
  loading = signal(true);
  busy = signal(false);
  error = signal('');
  toast = signal('');
  categories = Object.keys(CATEGORY_LABEL) as ObligationCategory[];
  groups = [{ key: 'overdue', label: 'Overdue' }, { key: 'week', label: 'Due in the next 7 days' }, { key: 'later', label: 'Later' }, { key: 'done', label: 'Completed' }];

  formOpen = false;
  editing: Obligation | null = null;
  form: ObligationRequest = this.blank();
  repeat: number | null = null;
  confirmDelete: Obligation | null = null;

  constructor(public auth: AuthService, private ops: OperationsApiService, private overview: OverviewService) {}

  ngOnInit() {
    this.load();
    this.overview.load().subscribe(s => this.derived.set(this.deriveFrom(s)));
  }

  label(c: ObligationCategory) { return CATEGORY_LABEL[c]; }

  group(key: string): Obligation[] {
    const all = this.items();
    switch (key) {
      case 'overdue': return all.filter(o => o.status === 'OPEN' && o.overdue);
      case 'week': return all.filter(o => o.status === 'OPEN' && !o.overdue && o.daysLeft <= 7);
      case 'later': return all.filter(o => o.status === 'OPEN' && o.daysLeft > 7);
      default: return all.filter(o => o.status === 'COMPLETED').sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')).slice(0, 20);
    }
  }

  load() {
    this.ops.obligations().subscribe({
      next: l => { this.items.set(l); this.loading.set(false); },
      error: (e: ApiError) => { this.loading.set(false); this.error.set(e.userMessage); }
    });
  }

  openForm(o?: Obligation) {
    this.editing = o ?? null;
    this.form = o ? { title: o.title, category: o.category, regulator: o.regulator ?? '', description: o.description ?? '', dueDate: o.dueDate, owner: o.owner ?? '' } : this.blank();
    this.repeat = o?.repeatMonths ?? null;
    this.formOpen = true;
  }

  save() {
    this.busy.set(true);
    const body: ObligationRequest = { ...this.form, title: this.form.title.trim(), repeatMonths: this.repeat ? Number(this.repeat) : null };
    const call = this.editing ? this.ops.updateObligation(this.editing.id, body) : this.ops.createObligation(body);
    call.subscribe({
      next: () => { this.busy.set(false); this.formOpen = false; this.error.set(''); this.flash(this.editing ? 'Saved.' : 'Added.'); this.load(); },
      error: (e: ApiError) => { this.busy.set(false); this.formOpen = false; this.error.set(e.userMessage); }
    });
  }

  complete(o: Obligation) {
    this.busy.set(true);
    this.ops.completeObligation(o.id).subscribe({
      next: r => { this.busy.set(false); this.flash(r.length > 1 ? `Done. The next one is due ${r[1].dueDate}.` : 'Marked as done.'); this.load(); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  remove() {
    const o = this.confirmDelete;
    if (!o) return;
    this.busy.set(true);
    this.ops.deleteObligation(o.id).subscribe({
      next: () => { this.busy.set(false); this.confirmDelete = null; this.flash('Deleted.'); this.load(); },
      error: (e: ApiError) => { this.busy.set(false); this.confirmDelete = null; this.error.set(e.userMessage); }
    });
  }

  /** Dates the platform itself knows, for the next 30 days and anything already late. */
  private deriveFrom(s: Snapshot): Derived[] {
    const now = Date.now();
    const horizon = now + 30 * 86400000;
    const out: Derived[] = [];
    for (const c of s.cases) {
      if (['resolved', 'closed'].includes(c.status) || !c.dueAt) continue;
      if (Date.parse(c.dueAt) <= horizon) out.push({ date: c.dueAt, title: `Respond to case: ${c.title}`, detail: `${c.severity} severity`, link: ['/app/cases', c.caseId], overdue: c.overdue });
    }
    for (const d of s.dueDiligence) {
      if (d.status === 'COMPLETED' && d.nextReviewAt && Date.parse(d.nextReviewAt) <= horizon) out.push({ date: d.nextReviewAt, title: `${d.kind} review for ${d.customerName}`, detail: 'Due diligence file due for another look', link: [d.kind === 'CDD' ? '/app/cdd' : '/app/edd'], overdue: d.reviewOverdue });
    }
    for (const m of s.monitoring) {
      if (Date.parse(m.nextDueAt) <= horizon) out.push({ date: m.nextDueAt, title: `Re-screen ${m.customerName}`, detail: `Every ${m.frequencyDays} days (${m.riskLevel ?? 'unrated'} risk)`, link: ['/app/continuous-monitoring'], overdue: m.overdue });
    }
    return out.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 40);
  }

  private blank(): ObligationRequest { return { title: '', category: 'RETURN', regulator: '', description: '', dueDate: '', owner: '' }; }
  private toastTimer?: ReturnType<typeof setTimeout>;
  private flash(m: string) {
    this.toast.set(m);
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toast.set(''), 2800);
  }
}
