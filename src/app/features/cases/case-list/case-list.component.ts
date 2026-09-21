import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AiApiService, CaseStats, InvCase, Severity } from '../../../core/services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

export const SEVERITY_BADGE: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-yellow', critical: 'badge-red' };
export const STATUS_LABEL: Record<string, string> = { open: 'Open', triage: 'In triage', investigating: 'Investigating', escalated: 'Escalated', resolved: 'Resolved', closed: 'Closed' };

/** Investigation cases opened by your team. Triage (severity, deadline, first steps) is worked out by fixed rules when a case is opened. */
@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, ModalComponent],
  template: `
  <app-page-header title="Case Management" subtitle="Investigations into suspicious activity, from the first alert to a decision.">
    <button *ngIf="canOpen" class="btn-primary" (click)="openCreate()">Open a case</button>
  </app-page-header>

  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5" *ngIf="stats() as s">
    <div class="card p-4"><p class="muted">Open cases</p><p class="text-2xl font-bold text-ink-950">{{ s.open }}</p></div>
    <div class="card p-4"><p class="muted">Overdue</p><p class="text-2xl font-bold" [class.text-red-600]="s.overdue > 0">{{ s.overdue }}</p></div>
    <div class="card p-4"><p class="muted">High or critical</p><p class="text-2xl font-bold text-ink-950">{{ (s.bySeverity['high'] || 0) + (s.bySeverity['critical'] || 0) }}</p></div>
    <div class="card p-4"><p class="muted">Average time open</p><p class="text-2xl font-bold text-ink-950">{{ s.averageOpenAgeDays | number: '1.0-1' }} <span class="text-sm font-medium text-ink-500">days</span></p></div>
  </div>

  <div class="flex flex-wrap gap-3 mb-4">
    <input class="input max-w-xs" placeholder="Search title or subject..." [(ngModel)]="query" (ngModelChange)="reload()" aria-label="Search"/>
    <select class="input !w-auto" [(ngModel)]="status" (ngModelChange)="reload()" aria-label="Status">
      <option value="">All statuses</option><option *ngFor="let s of statuses" [value]="s">{{ label(s) }}</option></select>
    <select class="input !w-auto" [(ngModel)]="severity" (ngModelChange)="reload()" aria-label="Severity">
      <option value="">All severities</option><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select>
  </div>

  <div class="card overflow-x-auto">
    <table class="table">
      <thead><tr><th>Case</th><th>Subject</th><th>Severity</th><th>Status</th><th>Assigned to</th><th>Due</th><th>Opened</th></tr></thead>
      <tbody>
        <tr *ngFor="let c of cases" class="cursor-pointer" (click)="open(c)">
          <td><a [routerLink]="['/app/cases', c.caseId]" class="font-medium text-ink-900 hover:text-brand-700" (click)="$event.stopPropagation()">{{ c.title }}</a>
            <div class="text-xs text-ink-400 font-mono">{{ c.caseId }}</div></td>
          <td>{{ c.subjectName || '—' }}<div class="text-xs text-ink-400">{{ c.subjectType }}</div></td>
          <td><span [ngClass]="badge(c.severity)">{{ c.severity | titlecase }}</span></td>
          <td>{{ label(c.status) }}</td>
          <td class="text-sm">{{ c.assignee || 'Unassigned' }}</td>
          <td class="text-sm whitespace-nowrap" [class.text-red-600]="c.overdue">{{ c.dueAt | date: 'MMM d, HH:mm' }}<span *ngIf="c.overdue"> (overdue)</span></td>
          <td class="text-sm text-ink-500 whitespace-nowrap">{{ c.createdAt | date: 'mediumDate' }}</td>
        </tr>
        <tr *ngIf="loaded && !cases.length"><td colspan="7" class="text-center text-sm text-ink-400 py-10">No cases yet. Open one when something needs investigating.</td></tr>
      </tbody>
    </table>
  </div>
  <div class="flex items-center justify-between mt-3 text-sm text-ink-500" *ngIf="totalPages > 1">
    <span>Page {{ page + 1 }} of {{ totalPages }}</span>
    <div class="flex gap-2"><button class="btn-secondary btn-sm" [disabled]="page === 0" (click)="go(page - 1)">Previous</button><button class="btn-secondary btn-sm" [disabled]="page + 1 >= totalPages" (click)="go(page + 1)">Next</button></div>
  </div>

  <app-modal [open]="createOpen()" title="Open a case" subtitle="Severity, deadline and first steps are worked out from what you enter." (close)="createOpen.set(false)">
    <div class="space-y-3">
      <div><label class="label" for="c-title">Title</label><input id="c-title" class="input" [(ngModel)]="title" maxlength="200" placeholder="e.g. Repeated deposits just under the reporting limit"/></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label" for="c-type">Subject</label><select id="c-type" class="input" [(ngModel)]="subjectType"><option value="individual">A person</option><option value="business">A business</option></select></div>
        <div><label class="label" for="c-name">Name</label><input id="c-name" class="input" [(ngModel)]="subjectName" maxlength="200"/></div>
      </div>
      <div><label class="label" for="c-ref">Customer or account reference (optional)</label><input id="c-ref" class="input" [(ngModel)]="subjectRef" maxlength="64"/></div>
      <div><label class="label" for="c-desc">What happened?</label><textarea id="c-desc" class="input" rows="3" [(ngModel)]="description" maxlength="4000"></textarea></div>
      <div class="grid grid-cols-2 gap-3">
        <div><label class="label" for="c-sev">Your view of the severity</label><select id="c-sev" class="input" [(ngModel)]="severityHint"><option value="">Let the rules decide</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
        <div><label class="label" for="c-ev">First piece of evidence (optional)</label><input id="c-ev" class="input" [(ngModel)]="evidenceText" maxlength="500" placeholder="What did you see?"/></div>
      </div>
      <p class="text-sm text-red-700" *ngIf="createError()" role="alert">{{ createError() }}</p>
    </div>
    <div modal-footer class="flex gap-3 w-full sm:w-auto">
      <button class="btn-secondary flex-1" (click)="createOpen.set(false)">Cancel</button>
      <button class="btn-primary flex-1" [disabled]="busy() || title.trim().length < 3" (click)="create()">{{ busy() ? 'Opening...' : 'Open case' }}</button>
    </div>
  </app-modal>
  `
})
export class CaseListComponent implements OnInit {
  readonly statuses = Object.keys(STATUS_LABEL);
  cases: InvCase[] = [];
  stats = signal<CaseStats | null>(null);
  loaded = false;
  page = 0;
  totalPages = 0;
  query = '';
  status = '';
  severity = '';
  error = signal('');
  createOpen = signal(false);
  createError = signal('');
  busy = signal(false);
  title = ''; description = ''; subjectType: 'individual' | 'business' = 'individual'; subjectName = ''; subjectRef = ''; severityHint: '' | Severity = ''; evidenceText = '';

  constructor(private ai: AiApiService, private auth: AuthService, private router: Router) {}

  get canOpen() { return this.auth.hasMinRole(3); }

  ngOnInit() {
    this.reload();
    this.ai.caseStats().subscribe({ next: s => this.stats.set(s), error: () => undefined });
  }

  label(s: string) { return STATUS_LABEL[s] ?? s; }
  badge(s: string) { return SEVERITY_BADGE[s] ?? 'badge-gray'; }
  open(c: InvCase) { this.router.navigate(['/app/cases', c.caseId]); }

  reload() { this.page = 0; this.load(); }
  go(p: number) { this.page = p; this.load(); }

  private load() {
    this.ai.cases({ status: this.status || undefined, severity: this.severity || undefined, q: this.query.trim() || undefined, page: this.page, size: 20 }).subscribe({
      next: p => { this.cases = p.items; this.totalPages = p.totalPages; this.loaded = true; this.error.set(''); },
      error: (e: ApiError) => { this.loaded = true; this.error.set(e.httpStatus === 403 ? 'Cases are visible to the Reviewer role (level 3) and above.' : e.userMessage); }
    });
  }

  openCreate() {
    this.title = this.description = this.subjectName = this.subjectRef = this.evidenceText = '';
    this.subjectType = 'individual';
    this.severityHint = '';
    this.createError.set('');
    this.createOpen.set(true);
  }

  create() {
    this.busy.set(true);
    this.createError.set('');
    this.ai.createCase({
      title: this.title.trim(), description: this.description.trim() || undefined, subjectType: this.subjectType, subjectName: this.subjectName.trim() || undefined,
      subjectRef: this.subjectRef.trim() || undefined, severityHint: this.severityHint || undefined,
      evidence: this.evidenceText.trim() ? [{ type: 'other', description: this.evidenceText.trim() }] : []
    }).subscribe({
      next: c => { this.busy.set(false); this.createOpen.set(false); this.router.navigate(['/app/cases', c.caseId]); },
      error: (e: ApiError) => { this.busy.set(false); this.createError.set(e.userMessage); }
    });
  }
}
