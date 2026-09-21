import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
import { AuditEntry, OperationsApiService } from '../../core/services/operations-api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

/** The company's audit trail: who did what, when. Entries are written by the server with the change itself and cannot be edited here. */
@Component({
  selector: 'app-audit-trail',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
  <app-page-header title="Audit Trail" subtitle="Who did what, and when. Entries are written by the system alongside the change and cannot be edited or removed here.">
    <button class="btn-secondary" [disabled]="!entries().length" (click)="exportCsv()">Export CSV</button>
  </app-page-header>

  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

  <div class="flex gap-2 max-w-md mb-4">
    <input class="input" aria-label="Search the audit trail" placeholder="Search by person, action, record or detail" [(ngModel)]="query" (keyup.enter)="search()"/>
    <button class="btn-secondary" (click)="search()">Search</button>
  </div>

  <div class="card overflow-x-auto">
    <table class="table" aria-label="Audit trail">
      <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th>Change</th><th>Detail</th><th>Address</th></tr></thead>
      <tbody>
        <tr *ngFor="let e of entries()">
          <td class="text-sm text-ink-500 whitespace-nowrap">{{ e.timestamp | date: 'medium' }}</td>
          <td class="font-medium text-ink-900">{{ e.actor }}</td>
          <td class="text-sm text-ink-700">{{ e.action }}</td>
          <td class="text-sm"><span class="badge-gray">{{ e.entityType }}</span> <span class="font-mono text-xs text-ink-500">{{ e.entityId }}</span></td>
          <td class="text-xs"><span *ngIf="e.oldValue || e.newValue"><span class="text-red-600">{{ e.oldValue || '—' }}</span> → <span class="text-brand-700">{{ e.newValue || '—' }}</span></span></td>
          <td class="text-sm text-ink-600 max-w-sm">{{ e.detail }}</td>
          <td class="text-xs text-ink-400 font-mono" title="As reported by the network in front of the service; treat it as a lead, not proof.">{{ e.ipAddress }}</td>
        </tr>
      </tbody>
    </table>
    <p *ngIf="!loading() && !entries().length" class="py-10 text-center text-sm text-ink-400">Nothing recorded yet{{ query ? ' for that search' : '' }}.</p>
    <p *ngIf="loading()" class="py-10 text-center text-sm text-ink-400">Loading...</p>
    <div class="flex items-center justify-between p-3 border-t border-ink-100 text-sm text-ink-500" *ngIf="total() > entries().length">
      <span>Showing {{ entries().length }} of {{ total() }}</span>
      <button class="btn-secondary btn-sm" [disabled]="loading()" (click)="more()">Load more</button>
    </div>
  </div>
  `
})
export class AuditTrailComponent implements OnInit {
  entries = signal<AuditEntry[]>([]);
  total = signal(0);
  loading = signal(true);
  error = signal('');
  query = '';
  private page = 0;

  constructor(private ops: OperationsApiService) {}

  ngOnInit() { this.search(); }

  search() {
    this.page = 0;
    this.entries.set([]);
    this.fetch();
  }

  more() {
    this.page++;
    this.fetch();
  }

  private fetch() {
    this.loading.set(true);
    this.ops.audit(this.query.trim(), this.page).subscribe({
      next: p => { this.entries.update(l => [...l, ...p.items]); this.total.set(p.totalItems); this.loading.set(false); this.error.set(''); },
      error: (e: ApiError) => { this.loading.set(false); this.error.set(e.httpStatus === 403 ? 'The audit trail is for Compliance Officers and above.' : e.userMessage); }
    });
  }

  exportCsv() {
    const esc = (v: string | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    // A leading = + - @ would make a spreadsheet run the cell as a formula; prefix such cells with an apostrophe.
    const safe = (v: string | null | undefined) => esc(/^[=+\-@]/.test(v ?? '') ? "'" + v : v);
    const lines = [
      ['Time', 'Who', 'Action', 'Record type', 'Record', 'Before', 'After', 'Detail', 'Address'].join(','),
      ...this.entries().map(e => [e.timestamp, e.actor, e.action, e.entityType, e.entityId, e.oldValue, e.newValue, e.detail, e.ipAddress].map(safe).join(','))
    ];
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
