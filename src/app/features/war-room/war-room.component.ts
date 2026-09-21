import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Alert, OverviewService, Snapshot } from '../../core/services/overview.service';

/** A dark, one-screen view for executives: the same real figures as the board dashboard, refreshed every minute while the page is open. */
@Component({
  selector: 'app-war-room',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
  <div class="-m-4 sm:-m-6 min-h-[calc(100vh-4rem)] bg-ink-950 text-white p-4 sm:p-6">
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-xl sm:text-2xl font-bold">Executive War Room</h1>
        <p class="text-ink-400 text-sm mt-1">Where the company stands right now. Refreshes every minute.</p>
      </div>
      <span class="text-xs text-ink-400" *ngIf="snap() as s">Updated {{ s.loadedAt | date: 'mediumTime' }}</span>
    </div>

    <p *ngIf="snap()?.unavailable?.length" class="mb-4 text-sm text-amber-300">Missing (not readable by your role, or not loaded): {{ snap()!.unavailable.join(', ') }}.</p>

    <ng-container *ngIf="snap() as s">
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
          <p class="text-ink-400 text-xs uppercase tracking-wide mb-2">Average customer risk</p>
          <p class="text-4xl font-extrabold" [ngClass]="averageRisk(s) > 60 ? 'text-red-400' : averageRisk(s) > 35 ? 'text-amber-400' : 'text-brand-400'">{{ s.customers.length ? averageRisk(s) : 'n/a' }}</p>
          <p class="text-xs text-ink-500 mt-1">0 to 100, over {{ s.customers.length }} customers</p>
        </div>
        <a routerLink="/app/alerts" class="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition">
          <p class="text-ink-400 text-xs uppercase tracking-wide mb-2">Critical or high alerts</p><p class="text-4xl font-extrabold text-red-400">{{ urgent().length }}</p>
        </a>
        <a routerLink="/app/my-clients" class="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition">
          <p class="text-ink-400 text-xs uppercase tracking-wide mb-2">High-risk customers</p><p class="text-4xl font-extrabold text-amber-400">{{ count(s, 'high') }}</p>
        </a>
        <a routerLink="/app/cases" class="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition">
          <p class="text-ink-400 text-xs uppercase tracking-wide mb-2">Open cases</p><p class="text-4xl font-extrabold text-blue-400">{{ s.caseStats ? s.caseStats.open : 'n/a' }}</p>
          <p class="text-xs text-ink-500 mt-1" *ngIf="s.caseStats">{{ s.caseStats.overdue }} overdue</p>
        </a>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div class="rounded-2xl bg-white/5 border border-white/10 p-5"><p class="text-ink-400 text-xs uppercase tracking-wide mb-2">Possible PEPs</p><p class="text-3xl font-bold">{{ pep(s) }}</p></div>
        <div class="rounded-2xl bg-white/5 border border-white/10 p-5"><p class="text-ink-400 text-xs uppercase tracking-wide mb-2">Possible sanctions matches</p><p class="text-3xl font-bold">{{ sanctions(s) }}</p></div>
        <a routerLink="/app/str-sar" class="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition"><p class="text-ink-400 text-xs uppercase tracking-wide mb-2">Cases that may need an STR</p><p class="text-3xl font-bold">{{ strCandidates(s) }}</p></a>
        <a routerLink="/app/regulatory-calendar" class="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition"><p class="text-ink-400 text-xs uppercase tracking-wide mb-2">Deadlines overdue or within 7 days</p><p class="text-3xl font-bold text-amber-400">{{ deadlines(s) }}</p></a>
      </div>

      <div class="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div class="px-5 py-4 border-b border-white/10 font-semibold">Watch list</div>
        <div class="divide-y divide-white/5">
          <a *ngFor="let a of urgent().slice(0, 10)" [routerLink]="a.link" class="flex items-center justify-between gap-3 px-5 py-3 hover:bg-white/5 transition">
            <div><p class="text-sm font-medium">{{ a.title }}</p><p class="text-xs text-ink-400">{{ a.source }}: {{ a.detail }}</p></div>
            <span class="badge-red">{{ a.severity }}</span>
          </a>
          <p class="px-5 py-6 text-sm text-ink-500" *ngIf="!urgent().length">Nothing critical or high right now.</p>
        </div>
      </div>
    </ng-container>
    <p *ngIf="!snap()" class="py-16 text-center text-ink-400">Loading...</p>
  </div>
  `
})
export class WarRoomComponent implements OnInit, OnDestroy {
  snap = signal<Snapshot | null>(null);
  urgent = signal<Alert[]>([]);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private overview: OverviewService) {}

  ngOnInit() {
    this.refresh();
    this.timer = setInterval(() => this.refresh(), 60000);
  }

  ngOnDestroy() { if (this.timer) clearInterval(this.timer); }

  private refresh() {
    this.overview.load().subscribe(s => {
      this.snap.set(s);
      this.urgent.set(this.overview.alerts(s).filter(a => a.severity === 'critical' || a.severity === 'high'));
    });
  }

  averageRisk(s: Snapshot) { return s.customers.length ? Math.round(s.customers.reduce((t, c) => t + c.riskScore, 0) / s.customers.length) : 0; }
  count(s: Snapshot, level: string) { return s.customers.filter(c => c.riskLevel === level).length; }
  pep(s: Snapshot) { return s.customers.filter(c => c.pepHit).length; }
  sanctions(s: Snapshot) { return s.customers.filter(c => c.sanctionsHit).length; }
  strCandidates(s: Snapshot) { return s.cases.filter(c => !['closed'].includes(c.status) && (c.severity === 'high' || c.severity === 'critical' || c.status === 'escalated')).length; }
  deadlines(s: Snapshot) { return s.obligations.filter(o => o.status === 'OPEN' && o.daysLeft <= 7).length; }
}
