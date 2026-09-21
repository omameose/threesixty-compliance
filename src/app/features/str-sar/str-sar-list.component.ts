import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { AiApiService, InvCase } from '../../core/services/ai-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SEVERITY_BADGE, STATUS_LABEL } from '../cases/case-list/case-list.component';

/**
 * Cases that may need a suspicious transaction report (high or critical severity, escalated, or confirmed as suspicious), with a drafting
 * tool. A draft is written from the case file for the MLRO to review. The platform never files anything with a regulator: filing
 * happens outside it, and this page says so.
 */
@Component({
  selector: 'app-str-sar-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, ModalComponent],
  template: `
  <app-page-header title="STR/SAR Management" subtitle="Draft the narrative of a suspicious transaction report from a case."></app-page-header>

  <div class="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">
    Drafts are for your MLRO to review and edit. This platform does not file reports with the NFIU or any regulator: file through the regulator's own portal.
  </div>
  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

  <div class="card overflow-x-auto">
    <table class="table">
      <thead><tr><th>Case</th><th>Subject</th><th>Severity</th><th>Status</th><th>Outcome</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let c of candidates()">
          <td><a [routerLink]="['/app/cases', c.caseId]" class="font-medium text-ink-900 hover:text-brand-700">{{ c.title }}</a><div class="text-xs text-ink-400 font-mono">{{ c.caseId }}</div></td>
          <td>{{ c.subjectName || '—' }}</td>
          <td><span [ngClass]="badge(c.severity)">{{ c.severity | titlecase }}</span></td>
          <td>{{ label(c.status) }}</td>
          <td>{{ c.resolution ? c.resolution.replace('_', ' ') : '—' }}</td>
          <td class="text-right whitespace-nowrap">
            <a class="btn-secondary btn-sm" [routerLink]="['/app/cases', c.caseId]">Open case</a>
            <button *ngIf="canDraft" class="btn-primary btn-sm ml-1" [disabled]="busyId() === c.caseId" (click)="draft(c)">{{ busyId() === c.caseId ? 'Drafting...' : 'Draft report' }}</button>
          </td>
        </tr>
        <tr *ngIf="loaded && !candidates().length"><td colspan="6" class="text-center text-sm text-ink-400 py-10">No case needs a report right now. High and critical cases, escalations and confirmed cases appear here.</td></tr>
      </tbody>
    </table>
  </div>
  <p *ngIf="!canDraft" class="text-xs text-ink-400 mt-3">Drafting needs the Compliance Officer role (level 4).</p>

  <app-modal [open]="!!text()" title="Draft report" subtitle="Not filed. The MLRO must review and approve it." (close)="text.set('')">
    <pre class="text-xs whitespace-pre-wrap font-sans text-ink-800 max-h-[60vh] overflow-y-auto">{{ text() }}</pre>
    <div modal-footer class="flex gap-3 w-full sm:w-auto">
      <button class="btn-secondary flex-1" (click)="copy()">{{ copied() ? 'Copied' : 'Copy text' }}</button>
      <button class="btn-primary flex-1" (click)="text.set('')">Close</button>
    </div>
  </app-modal>
  `
})
export class StrSarListComponent implements OnInit {
  all: InvCase[] = [];
  loaded = false;
  error = signal('');
  text = signal('');
  copied = signal(false);
  busyId = signal('');

  constructor(private ai: AiApiService, private auth: AuthService) {}

  get canDraft() { return this.auth.hasMinRole(4); }

  ngOnInit() {
    this.ai.cases({ size: 100 }).subscribe({
      next: p => { this.all = p.items; this.loaded = true; },
      error: (e: ApiError) => { this.loaded = true; this.error.set(e.httpStatus === 403 ? 'Reports are visible to the Reviewer role (level 3) and above.' : e.userMessage); }
    });
  }

  candidates() {
    return this.all.filter(c => c.severity === 'high' || c.severity === 'critical' || c.status === 'escalated' || c.resolution === 'confirmed');
  }

  label(s: string) { return STATUS_LABEL[s] ?? s; }
  badge(s: string) { return SEVERITY_BADGE[s] ?? 'badge-gray'; }

  draft(c: InvCase) {
    this.busyId.set(c.caseId);
    this.error.set('');
    this.ai.sarDraft(c.caseId).subscribe({
      next: r => { this.busyId.set(''); this.text.set(r.draft); },
      error: (e: ApiError) => { this.busyId.set(''); this.error.set(e.userMessage); }
    });
  }

  copy() {
    navigator.clipboard?.writeText(this.text()).catch(() => undefined);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 1500);
  }
}
