import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { OverviewService, Snapshot } from '../../core/services/overview.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Tile { label: string; value: string | number; note?: string; bad?: boolean }

/** How exposed, how effective, and where: every figure is counted from the company's own customers, cases, checks and files. */
@Component({
  selector: 'app-board-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent],
  template: `
  <app-page-header title="Board Compliance Dashboard" subtitle="How exposed are we? How effective are we? Where are the risks? Counted from your own records."></app-page-header>

  <div *ngIf="snap()?.unavailable?.length" class="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm" role="note">
    Some figures are missing because your role cannot read them, or they could not be loaded: {{ snap()!.unavailable.join(', ') }}.
  </div>

  <ng-container *ngIf="snap() as s">
    <h3 class="font-semibold text-ink-900 mb-3">How exposed are we?</h3>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card p-4" *ngFor="let t of exposure(s)"><p class="muted">{{ t.label }}</p><p class="text-2xl font-bold" [class.text-red-600]="t.bad">{{ t.value }}</p><p class="text-xs text-ink-500" *ngIf="t.note">{{ t.note }}</p></div>
    </div>

    <h3 class="font-semibold text-ink-900 mb-3">How effective are we?</h3>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="card p-4" *ngFor="let t of effectiveness(s)"><p class="muted">{{ t.label }}</p><p class="text-2xl font-bold" [class.text-red-600]="t.bad">{{ t.value }}</p><p class="text-xs text-ink-500" *ngIf="t.note">{{ t.note }}</p></div>
    </div>

    <h3 class="font-semibold text-ink-900 mb-3">Where are the risks?</h3>
    <div class="card overflow-x-auto">
      <table class="table" aria-label="Exposure by country">
        <thead><tr><th>Country</th><th>Customers</th><th>High risk</th><th>Share high risk</th></tr></thead>
        <tbody>
          <tr *ngFor="let g of geography(s)">
            <td class="font-medium text-ink-900">{{ g.country }}</td><td>{{ g.customers }}</td>
            <td [class.text-red-600]="g.high > 0" [class.font-semibold]="g.high > 0">{{ g.high }}</td>
            <td><div class="flex items-center gap-2 w-40"><div class="flex-1 h-1.5 bg-ink-100 rounded-full overflow-hidden"><div class="h-full bg-brand-600" [style.width.%]="100 * g.high / g.customers"></div></div><span class="text-xs text-ink-500">{{ 100 * g.high / g.customers | number: '1.0-0' }}%</span></div></td>
          </tr>
        </tbody>
      </table>
      <p class="py-8 text-center text-sm text-ink-400" *ngIf="!geography(s).length">No customers yet.</p>
    </div>
    <p class="text-xs text-ink-400 mt-4">As of {{ s.loadedAt | date: 'medium' }}. Customer risk scores come from the rules in the customer risk engine; nothing here is estimated or sample data.</p>
  </ng-container>
  <p *ngIf="!snap()" class="py-16 text-center text-ink-400">Loading...</p>
  `
})
export class BoardDashboardComponent implements OnInit {
  snap = signal<Snapshot | null>(null);
  constructor(private overview: OverviewService) {}
  ngOnInit() { this.overview.load().subscribe(s => this.snap.set(s)); }

  exposure(s: Snapshot): Tile[] {
    const high = s.customers.filter(c => c.riskLevel === 'high').length;
    return [
      { label: 'High-risk customers', value: high, note: s.customers.length ? `${Math.round((100 * high) / s.customers.length)}% of ${s.customers.length}` : undefined, bad: high > 0 },
      { label: 'Possible PEPs', value: s.customers.filter(c => c.pepHit).length },
      { label: 'Possible sanctions matches', value: s.customers.filter(c => c.sanctionsHit).length, bad: s.customers.some(c => c.sanctionsHit) },
      { label: 'Things needing attention', value: this.overview.alerts(s).filter(a => a.severity === 'critical' || a.severity === 'high').length, note: 'critical or high alerts' }
    ];
  }

  effectiveness(s: Snapshot): Tile[] {
    const decided = s.customers.filter(c => c.status === 'approved' || c.status === 'rejected');
    const approved = decided.filter(c => c.status === 'approved').length;
    const st = s.caseStats;
    const inCycle = s.monitoring.filter(m => !m.overdue).length;
    const cddDone = s.dueDiligence.filter(d => d.kind === 'CDD' && d.status === 'COMPLETED').length;
    const eddOpen = s.dueDiligence.filter(d => d.kind === 'EDD' && d.status !== 'COMPLETED').length;
    return [
      { label: 'Open cases', value: st ? st.open : 'n/a', note: st ? `${st.overdue} overdue` : undefined, bad: !!st && st.overdue > 0 },
      { label: 'Average days to close a case', value: st?.averageDaysToClose != null ? st.averageDaysToClose.toFixed(1) : 'n/a', note: st?.averageDaysToClose == null ? 'no cases closed yet' : undefined },
      { label: 'Approval rate', value: decided.length ? Math.round((100 * approved) / decided.length) + '%' : 'n/a', note: `${decided.length} decided` },
      { label: 'Screened on schedule', value: s.monitoring.length ? Math.round((100 * inCycle) / s.monitoring.length) + '%' : 'n/a', note: `${s.monitoring.length - inCycle} overdue`, bad: s.monitoring.length > inCycle },
      { label: 'CDD files completed', value: cddDone },
      { label: 'EDD files still open', value: eddOpen, bad: eddOpen > 0 },
      { label: 'Overdue deadlines', value: s.obligations.filter(o => o.overdue).length, bad: s.obligations.some(o => o.overdue) },
      { label: 'Awaiting a decision', value: s.customers.filter(c => c.status === 'pending_review').length }
    ];
  }

  geography(s: Snapshot) {
    const m = new Map<string, { country: string; customers: number; high: number }>();
    for (const c of s.customers) {
      const k = c.country || 'Not given';
      const g = m.get(k) ?? { country: k, customers: 0, high: 0 };
      g.customers++;
      if (c.riskLevel === 'high') g.high++;
      m.set(k, g);
    }
    return [...m.values()].sort((a, b) => b.high - a.high || b.customers - a.customers);
  }
}
