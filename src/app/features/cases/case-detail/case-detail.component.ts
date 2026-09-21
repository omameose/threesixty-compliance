import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ApiError } from '../../../core/http/api.service';
import { AiApiService, CaseAction, CaseEvent, InvCase } from '../../../core/services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { SEVERITY_BADGE, STATUS_LABEL } from '../case-list/case-list.component';

/** Where a case can move next: the same table the service enforces. */
const NEXT: Record<string, string[]> = {
  open: ['triage', 'investigating', 'closed'], triage: ['investigating', 'escalated', 'closed'], investigating: ['escalated', 'resolved', 'closed'],
  escalated: ['investigating', 'resolved', 'closed'], resolved: ['closed', 'investigating'], closed: ['investigating']
};
const EVENT_LABEL: Record<string, string> = {
  created: 'Case opened', note: 'Note', status: 'Status changed', assignment: 'Assignment', action: 'Response recorded', evidence: 'Evidence added',
  analysis: 'Analysis refreshed', sar_draft: 'STR draft created'
};

/**
 * One case: why it matters, what to do first, the evidence and the full history. Notes and evidence need the Reviewer role (3), changing
 * the status, assigning, recording a response and drafting a report need the Compliance Officer role (4). Responses are RECORDED here for
 * the audit trail; nothing on this page blocks an account or files a report by itself.
 */
@Component({
  selector: 'app-case-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ModalComponent],
  template: `
  <a routerLink="/app/cases" class="text-sm text-ink-500 hover:text-ink-800 inline-block mb-3">&larr; All cases</a>
  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>
  <div *ngIf="notice()" class="mb-4 p-3 rounded-lg bg-brand-50 text-brand-800 text-sm" role="status">{{ notice() }}</div>

  <ng-container *ngIf="c as cs">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h1 class="text-2xl font-bold text-ink-950">{{ cs.title }}</h1>
        <p class="muted mt-1"><span class="font-mono">{{ cs.caseId }}</span> &middot; {{ cs.subjectName || 'Subject not named' }} ({{ cs.subjectType }}) &middot; opened {{ cs.createdAt | date: 'medium' }}</p>
      </div>
      <div class="flex gap-2 items-center">
        <span [ngClass]="badge(cs.severity)">{{ cs.severity | titlecase }}</span>
        <span class="badge-gray">{{ label(cs.status) }}<span *ngIf="cs.resolution"> &middot; {{ cs.resolution.replace('_', ' ') }}</span></span>
        <span *ngIf="cs.overdue" class="badge-red">Overdue</span>
      </div>
    </div>

    <div class="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
      <div class="space-y-5">
        <section class="card p-5">
          <h2 class="font-semibold text-ink-900 mb-2">Briefing</h2>
          <p class="text-sm text-ink-700 whitespace-pre-line">{{ cs.triage.summary }}</p>
          <p class="text-xs text-ink-400 mt-2">Priority {{ cs.triage.priority }} &middot; response due {{ cs.dueAt | date: 'medium' }} ({{ cs.triage.slaHours }} hours) &middot;
            {{ cs.triage.model.generatedByModel ? 'wording by ' + cs.triage.model.model : 'wording written from fixed rules' }}</p>
          <div class="grid sm:grid-cols-2 gap-4 mt-4">
            <div><h3 class="text-sm font-semibold text-ink-800 mb-1">Why it was rated {{ cs.severity }}</h3><ul class="list-disc ml-5 text-sm text-ink-600 space-y-1"><li *ngFor="let r of cs.triage.reasons">{{ r }}</li></ul></div>
            <div><h3 class="text-sm font-semibold text-ink-800 mb-1">Suggested first steps</h3><ol class="list-decimal ml-5 text-sm text-ink-600 space-y-1"><li *ngFor="let s of cs.triage.recommendedSteps">{{ s }}</li></ol></div>
          </div>
          <div *ngIf="canWork" class="mt-4"><button class="btn-secondary btn-sm" [disabled]="busy()" (click)="run(ai.reanalyse(cs.caseId), 'Analysis refreshed.')">Refresh the analysis</button></div>
        </section>

        <section class="card p-5">
          <div class="flex items-center justify-between mb-3"><h2 class="font-semibold text-ink-900">Evidence ({{ cs.evidence.length }})</h2>
            <button *ngIf="canWork" class="btn-secondary btn-sm" (click)="evidenceOpen.set(true)">Add evidence</button></div>
          <ul class="divide-y divide-ink-100">
            <li *ngFor="let e of cs.evidence" class="py-2 text-sm">
              <span class="badge-gray mr-2">{{ e.type.replace('_', ' ') }}</span><span *ngIf="e.severity" [ngClass]="badge(e.severity)" class="mr-2">{{ e.severity }}</span>
              <span class="font-medium" *ngIf="e.code">{{ e.code }}: </span>{{ e.description }}
            </li>
            <li *ngIf="!cs.evidence.length" class="py-3 text-sm text-ink-400">No evidence attached yet.</li>
          </ul>
        </section>

        <section class="card p-5">
          <h2 class="font-semibold text-ink-900 mb-3">History</h2>
          <div *ngIf="canWork" class="flex gap-2 mb-4">
            <input class="input" [(ngModel)]="note" maxlength="4000" placeholder="Add a note for the case file..." aria-label="Note" (keyup.enter)="addNote()"/>
            <button class="btn-primary shrink-0" [disabled]="busy() || !note.trim()" (click)="addNote()">Add note</button>
          </div>
          <ol class="space-y-3">
            <li *ngFor="let ev of history(cs)" class="flex gap-3">
              <span class="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0"></span>
              <div class="min-w-0">
                <p class="text-sm"><span class="font-medium text-ink-800">{{ evLabel(ev) }}</span> <span class="text-xs text-ink-400">{{ ev.createdAt | date: 'medium' }}</span></p>
                <p class="text-sm text-ink-600 whitespace-pre-line break-words" *ngIf="ev.type !== 'sar_draft'">{{ ev.message }}</p>
                <p class="text-sm text-ink-600" *ngIf="ev.type === 'sar_draft'">A draft was written for the compliance officer to review. <button class="text-brand-600 underline" (click)="showDraft(ev.message)">Read it</button></p>
              </div>
            </li>
          </ol>
        </section>
      </div>

      <aside class="space-y-5">
        <section class="card p-5" *ngIf="canManage">
          <h2 class="font-semibold text-ink-900 mb-3">Status</h2>
          <label class="label" for="st">Move to</label>
          <select id="st" class="input mb-3" [(ngModel)]="nextStatus"><option value="">Choose...</option><option *ngFor="let s of nextOptions(cs)" [value]="s">{{ label(s) }}</option></select>
          <ng-container *ngIf="needsResolution(cs)">
            <label class="label" for="res">Outcome</label>
            <select id="res" class="input mb-3" [(ngModel)]="resolution"><option value="">Choose...</option><option value="confirmed">Confirmed: suspicion stands</option><option value="false_positive">False positive</option><option value="inconclusive">Inconclusive</option></select>
          </ng-container>
          <input class="input mb-3" [(ngModel)]="statusNote" maxlength="2000" placeholder="Note (optional)" aria-label="Status note"/>
          <button class="btn-primary w-full" [disabled]="busy() || !nextStatus || (needsResolution(cs) && !resolution)" (click)="changeStatus(cs)">Update status</button>
        </section>

        <section class="card p-5" *ngIf="canManage">
          <h2 class="font-semibold text-ink-900 mb-3">Assigned to</h2>
          <p class="text-sm mb-2">{{ cs.assignee || 'Nobody yet' }}</p>
          <div class="flex gap-2"><input class="input" [(ngModel)]="assignee" placeholder="Email or name" aria-label="Assignee"/>
            <button class="btn-secondary shrink-0" [disabled]="busy()" (click)="assign(cs)">Assign</button></div>
          <button class="text-sm text-brand-600 underline mt-2" (click)="assignee = me()">Use my email</button>
        </section>

        <section class="card p-5" *ngIf="canManage">
          <h2 class="font-semibold text-ink-900 mb-1">Response</h2>
          <p class="text-xs text-ink-500 mb-3">Recorded for the audit trail. Someone still has to carry it out: nothing here blocks an account or files a report.</p>
          <select class="input mb-2" [(ngModel)]="action" aria-label="Response"><option value="">Choose a response...</option><option *ngFor="let a of actions" [value]="a.action">{{ a.label }}</option></select>
          <input class="input mb-3" [(ngModel)]="actionNote" maxlength="2000" placeholder="Note (optional)" aria-label="Response note"/>
          <button class="btn-secondary w-full" [disabled]="busy() || !action" (click)="recordAction(cs)">Record response</button>
        </section>

        <section class="card p-5" *ngIf="canManage">
          <h2 class="font-semibold text-ink-900 mb-1">Suspicious transaction report</h2>
          <p class="text-xs text-ink-500 mb-3">Drafts the narrative from this case for the MLRO to review. It is never filed automatically.</p>
          <button class="btn-secondary w-full" [disabled]="busy()" (click)="draft(cs)">{{ busy() ? 'Drafting...' : 'Draft the report' }}</button>
        </section>
        <p *ngIf="!canManage" class="text-xs text-ink-400">Changing the status, assigning, recording responses and drafting reports needs the Compliance Officer role (level 4).</p>
      </aside>
    </div>
  </ng-container>

  <app-modal [open]="evidenceOpen()" title="Add evidence" (close)="evidenceOpen.set(false)">
    <div class="space-y-3">
      <div><label class="label" for="e-type">Type</label><select id="e-type" class="input" [(ngModel)]="evType">
        <option value="alert">Alert</option><option value="risk_score">Risk score</option><option value="screening_hit">Screening hit</option><option value="transaction_alert">Transaction alert</option>
        <option value="verification">Verification</option><option value="document">Document</option><option value="other">Other</option></select></div>
      <div><label class="label" for="e-sev">Severity</label><select id="e-sev" class="input" [(ngModel)]="evSeverity"><option value="">Not rated</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
      <div><label class="label" for="e-code">Code (optional)</label><input id="e-code" class="input" [(ngModel)]="evCode" maxlength="64" placeholder="e.g. STRUCTURING"/></div>
      <div><label class="label" for="e-desc">What it shows</label><textarea id="e-desc" class="input" rows="3" [(ngModel)]="evText" maxlength="1000"></textarea></div>
    </div>
    <div modal-footer class="flex gap-3 w-full sm:w-auto">
      <button class="btn-secondary flex-1" (click)="evidenceOpen.set(false)">Cancel</button>
      <button class="btn-primary flex-1" [disabled]="busy() || !evText.trim()" (click)="addEvidence()">Add</button>
    </div>
  </app-modal>

  <app-modal [open]="!!draftText()" title="Draft report" subtitle="Not filed. The MLRO must review and approve it." (close)="draftText.set('')">
    <pre class="text-xs whitespace-pre-wrap font-sans text-ink-800 max-h-[60vh] overflow-y-auto">{{ draftText() }}</pre>
    <div modal-footer class="flex gap-3 w-full sm:w-auto">
      <button class="btn-secondary flex-1" (click)="copyDraft()">{{ copied() ? 'Copied' : 'Copy text' }}</button>
      <button class="btn-primary flex-1" (click)="draftText.set('')">Close</button>
    </div>
  </app-modal>
  `
})
export class CaseDetailComponent implements OnInit {
  /** Bound from the route parameter. */
  @Input() caseId!: string;

  c?: InvCase;
  actions: CaseAction[] = [];
  error = signal('');
  notice = signal('');
  busy = signal(false);
  evidenceOpen = signal(false);
  draftText = signal('');
  copied = signal(false);

  note = ''; nextStatus = ''; resolution = ''; statusNote = ''; assignee = ''; action = ''; actionNote = '';
  evType = 'other'; evSeverity = ''; evCode = ''; evText = '';

  constructor(public ai: AiApiService, private auth: AuthService) {}

  get canWork() { return this.auth.hasMinRole(3); }
  get canManage() { return this.auth.hasMinRole(4); }
  me() { return this.auth.currentUser()?.email ?? ''; }

  ngOnInit() {
    this.load();
    if (this.canManage) this.ai.caseActions().subscribe({ next: a => this.actions = a, error: () => undefined });
  }

  private load() {
    this.ai.getCase(this.caseId).subscribe({ next: c => this.c = c, error: (e: ApiError) => this.error.set(e.httpStatus === 404 ? 'This case was not found.' : e.userMessage) });
  }

  label(s: string) { return STATUS_LABEL[s] ?? s; }
  badge(s: string) { return SEVERITY_BADGE[s] ?? 'badge-gray'; }
  evLabel(e: CaseEvent) { return EVENT_LABEL[e.type] ?? e.type; }
  history(c: InvCase): CaseEvent[] { return [...(c.events ?? [])].reverse(); }
  nextOptions(c: InvCase) { return NEXT[c.status] ?? []; }
  needsResolution(c: InvCase) { return (this.nextStatus === 'resolved' || this.nextStatus === 'closed') && c.status !== 'resolved'; }

  /** Runs a change and shows the case as the server now holds it. */
  run(call: Observable<InvCase>, success: string, after?: () => void) {
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    call.subscribe({
      next: c => { this.busy.set(false); this.c = c; this.notice.set(success); after?.(); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  addNote() { this.run(this.ai.addNote(this.caseId, this.note.trim()), 'Note added.', () => this.note = ''); }
  changeStatus(c: InvCase) {
    this.run(this.ai.setCaseStatus(this.caseId, this.nextStatus, this.needsResolution(c) ? this.resolution : undefined, this.statusNote.trim() || undefined), 'Status updated.',
      () => { this.nextStatus = this.resolution = this.statusNote = ''; });
  }
  assign(c: InvCase) { this.run(this.ai.assignCase(this.caseId, this.assignee.trim() || null), this.assignee.trim() ? 'Case assigned.' : 'Assignment cleared.', () => this.assignee = ''); void c; }
  recordAction(c: InvCase) { this.run(this.ai.recordAction(this.caseId, this.action, this.actionNote.trim() || undefined), 'Response recorded. It has not been carried out by the system.', () => { this.action = this.actionNote = ''; }); void c; }
  addEvidence() {
    this.run(this.ai.addEvidence(this.caseId, [{ type: this.evType, severity: (this.evSeverity || null) as never, code: this.evCode.trim() || null, description: this.evText.trim() }]), 'Evidence added.',
      () => { this.evidenceOpen.set(false); this.evText = this.evCode = this.evSeverity = ''; this.evType = 'other'; });
  }

  draft(c: InvCase) {
    this.busy.set(true);
    this.error.set('');
    this.ai.sarDraft(c.caseId).subscribe({
      next: r => { this.busy.set(false); this.draftText.set(r.draft); this.load(); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  showDraft(text: string) { this.draftText.set(text); }
  copyDraft() { navigator.clipboard?.writeText(this.draftText()).catch(() => undefined); this.copied.set(true); setTimeout(() => this.copied.set(false), 1500); }
}
