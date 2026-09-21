import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { AuthService } from '../../core/services/auth.service';
import { MonitoringItem, OperationsApiService } from '../../core/services/operations-api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

/**
 * Approved customers and when each is next due for re-screening against the watchlist. How often depends on the customer's risk
 * level (high 30 days, medium 90, low 180 unless the server is configured otherwise). Checks run when someone asks for them
 * ("Check now", "Run due checks"); nothing runs in the background yet.
 */
@Component({
  selector: 'app-continuous-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent],
  template: `
  <app-page-header title="Continuous Monitoring" subtitle="Approved customers are re-screened against the watchlist on a schedule set by their risk level.">
    <button *ngIf="auth.hasMinRole(3)" class="btn-primary" [disabled]="running() || !overdueCount()" (click)="runDue()">
      {{ running() ? 'Checking...' : 'Run due checks (' + overdueCount() + ')' }}
    </button>
  </app-page-header>

  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>
  <div *ngIf="notice()" class="mb-4 p-3 rounded-lg bg-brand-50 text-brand-800 text-sm" role="status">{{ notice() }}</div>

  <div class="mb-5 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm" role="note" *ngIf="anySample()">
    Screening uses a demonstration list of fictional names, not a real sanctions or PEP list. Load your licensed list before relying on these results.
  </div>

  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
    <div class="card p-4"><p class="muted">Customers monitored</p><p class="text-2xl font-bold text-ink-950">{{ items().length }}</p></div>
    <div class="card p-4"><p class="muted">Due now</p><p class="text-2xl font-bold" [class.text-red-600]="overdueCount() > 0">{{ overdueCount() }}</p></div>
    <div class="card p-4"><p class="muted">With possible matches</p><p class="text-2xl font-bold text-ink-950">{{ withHits() }}</p></div>
    <div class="card p-4"><p class="muted">Changed since last check</p><p class="text-2xl font-bold" [class.text-red-600]="changed() > 0">{{ changed() }}</p></div>
  </div>

  <input class="input max-w-sm mb-4" aria-label="Search customers" placeholder="Search by name or email" [(ngModel)]="query"/>

  <div class="card overflow-x-auto">
    <table class="table" aria-label="Monitoring schedule">
      <thead><tr><th>Customer</th><th>Risk</th><th>Cycle</th><th>Last checked</th><th>Next due</th><th>Last result</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let m of filtered()">
          <td><a class="font-medium text-ink-900 hover:text-brand-600" [routerLink]="['/app/my-clients', m.submissionId]">{{ m.customerName }}</a><p class="text-xs text-ink-500">{{ m.email }}</p></td>
          <td><span [ngClass]="riskBadge(m.riskLevel)">{{ m.riskLevel || 'unrated' }}</span></td>
          <td class="text-sm text-ink-600">every {{ m.frequencyDays }} days</td>
          <td class="text-sm text-ink-500 whitespace-nowrap">{{ m.lastCheckedAt ? (m.lastCheckedAt | date: 'mediumDate') : 'Never' }}<span class="text-xs block" *ngIf="m.checkCount">{{ m.checkCount }} check{{ m.checkCount > 1 ? 's' : '' }}</span></td>
          <td class="text-sm whitespace-nowrap" [class.text-red-600]="m.overdue" [class.font-medium]="m.overdue">{{ m.nextDueAt | date: 'mediumDate' }}<span class="text-xs block" *ngIf="m.overdue">due now</span></td>
          <td class="text-sm">
            <ng-container *ngIf="m.lastHitCount !== null && m.lastHitCount !== undefined; else never">
              <span [ngClass]="m.lastHitCount ? 'badge-red' : 'badge-green'">{{ m.lastHitCount ? m.lastHitCount + ' possible match' + (m.lastHitCount > 1 ? 'es' : '') : 'No match' }}</span>
              <span class="badge-yellow ml-1" *ngIf="m.changed">changed</span>
              <ul class="text-xs text-ink-600 mt-1"><li *ngFor="let h of m.hits.slice(0, 3)">{{ h.listedName }} ({{ h.type.replace('_', ' ') }}, {{ h.confidence * 100 | number: '1.0-0' }}%)</li></ul>
            </ng-container>
            <ng-template #never><span class="text-ink-400">Not checked yet</span></ng-template>
          </td>
          <td class="text-right"><button *ngIf="auth.hasMinRole(3)" class="btn-secondary btn-sm" [disabled]="checking() === m.customerId" (click)="check(m)">{{ checking() === m.customerId ? 'Checking...' : 'Check now' }}</button></td>
        </tr>
      </tbody>
    </table>
    <p *ngIf="!loading() && !filtered().length" class="py-10 text-center text-sm text-ink-400">{{ items().length ? 'No customers match your search.' : 'No approved customers yet. Customers appear here once you approve them.' }}</p>
    <p *ngIf="loading()" class="py-10 text-center text-sm text-ink-400">Loading...</p>
  </div>
  `
})
export class ContinuousMonitoringComponent implements OnInit {
  items = signal<MonitoringItem[]>([]);
  loading = signal(true);
  running = signal(false);
  checking = signal<string | null>(null);
  error = signal('');
  notice = signal('');
  query = '';

  constructor(public auth: AuthService, private ops: OperationsApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.ops.monitoring().subscribe({
      next: l => { this.items.set(l); this.loading.set(false); },
      error: (e: ApiError) => { this.loading.set(false); this.error.set(e.userMessage); }
    });
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    return this.items().filter(m => !q || m.customerName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
  }

  overdueCount() { return this.items().filter(m => m.overdue).length; }
  withHits() { return this.items().filter(m => (m.lastHitCount ?? 0) > 0).length; }
  changed() { return this.items().filter(m => m.changed).length; }
  anySample() { return this.items().some(m => m.lastSampleData); }
  riskBadge(l?: string | null) { return l === 'high' ? 'badge-red' : l === 'medium' ? 'badge-yellow' : 'badge-green'; }

  check(m: MonitoringItem) {
    this.checking.set(m.customerId);
    this.error.set('');
    this.ops.checkCustomer(m.customerId).subscribe({
      next: u => { this.checking.set(null); this.items.update(l => l.map(x => (x.customerId === u.customerId ? u : x))); },
      error: (e: ApiError) => { this.checking.set(null); this.error.set(e.userMessage); }
    });
  }

  runDue() {
    this.running.set(true);
    this.error.set('');
    this.notice.set('');
    this.ops.runDueChecks().subscribe({
      next: r => {
        this.running.set(false);
        this.notice.set(`${r.checked} customer${r.checked === 1 ? '' : 's'} checked${r.failed ? `, ${r.failed} could not be checked` : ''}${r.stillDue ? `, ${r.stillDue} still due (run again)` : ''}.`);
        this.load();
      },
      error: (e: ApiError) => { this.running.set(false); this.error.set(e.userMessage); }
    });
  }
}
