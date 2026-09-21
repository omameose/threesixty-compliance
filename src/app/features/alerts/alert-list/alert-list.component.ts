import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert, AlertSeverity, OverviewService, Snapshot } from '../../../core/services/overview.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const BADGE: Record<AlertSeverity, string> = { critical: 'badge-red', high: 'badge-red', medium: 'badge-yellow', low: 'badge-gray' };

/**
 * Things that need attention, worked out from the company's own records: open cases, screening changes and overdue re-screening,
 * customers waiting for a decision, due diligence waiting for approval, and calendar deadlines. There is nothing to acknowledge here:
 * an alert goes away when the cause is dealt with, and the link takes you to where that is done.
 */
@Component({
  selector: 'app-alert-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent],
  template: `
  <app-page-header title="Alerts" subtitle="What needs attention right now. Each alert clears itself when the cause is dealt with."></app-page-header>

  <div *ngIf="snapshot()?.unavailable?.length" class="mb-4 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm" role="note">
    Not included because your role cannot read them, or they could not be loaded: {{ snapshot()!.unavailable.join(', ') }}.
  </div>

  <div class="flex flex-wrap items-center gap-1 bg-ink-100 rounded-lg p-1 w-fit mb-5">
    <button *ngFor="let f of filters" class="px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap" [class.bg-white]="filter() === f.key" [class.shadow-sm]="filter() === f.key" (click)="filter.set(f.key)">
      {{ f.label }} <span class="text-ink-400">{{ countOf(f.key) }}</span>
    </button>
  </div>

  <div class="card overflow-x-auto" *ngIf="!loading() && visible().length">
    <table class="table" aria-label="Alerts">
      <thead><tr><th>Severity</th><th>Source</th><th>What</th><th></th></tr></thead>
      <tbody>
        <tr *ngFor="let a of visible()">
          <td><span [ngClass]="badge(a.severity)">{{ a.severity }}</span></td>
          <td><span class="badge-blue">{{ a.source }}</span></td>
          <td><p class="font-medium text-ink-900">{{ a.title }}</p><p class="text-sm text-ink-500">{{ a.detail }}</p></td>
          <td class="text-right"><a class="btn-secondary btn-sm" [routerLink]="a.link">Open</a></td>
        </tr>
      </tbody>
    </table>
  </div>
  <div class="card p-10 text-center text-sm text-ink-500" *ngIf="!loading() && !visible().length">Nothing needs attention{{ filter() === 'all' ? '' : ' in this view' }}.</div>
  <p *ngIf="loading()" class="py-16 text-center text-ink-400">Loading...</p>
  `
})
export class AlertListComponent implements OnInit {
  snapshot = signal<Snapshot | null>(null);
  all = signal<Alert[]>([]);
  loading = signal(true);
  filter = signal<'all' | AlertSeverity>('all');
  filters: { key: 'all' | AlertSeverity; label: string }[] = [
    { key: 'all', label: 'All' }, { key: 'critical', label: 'Critical' }, { key: 'high', label: 'High' }, { key: 'medium', label: 'Medium' }, { key: 'low', label: 'Low' }
  ];

  constructor(private overview: OverviewService) {}

  ngOnInit() {
    this.overview.load().subscribe(s => { this.snapshot.set(s); this.all.set(this.overview.alerts(s)); this.loading.set(false); });
  }

  badge(s: AlertSeverity) { return BADGE[s]; }
  visible() { return this.filter() === 'all' ? this.all() : this.all().filter(a => a.severity === this.filter()); }
  countOf(k: 'all' | AlertSeverity) { return k === 'all' ? this.all().length : this.all().filter(a => a.severity === k).length; }
}
