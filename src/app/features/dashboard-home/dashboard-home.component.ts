import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { ApiError } from '../../core/http/api.service';
import { ComplianceApiService } from '../../core/services/compliance-api.service';
import { AiApiService, CaseStats, PortfolioInsights } from '../../core/services/ai-api.service';
import { DashboardStats } from '../../core/models/models';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ChartComponent } from '../../shared/components/chart/chart.component';

@Component({
  selector: 'app-dashboard-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ChartComponent, StatCardComponent, PageHeaderComponent, IconComponent, AvatarComponent],
  templateUrl: './dashboard-home.component.html'
})
export class DashboardHomeComponent implements OnInit {
  stats?: DashboardStats;
  loading = true;

  verificationsChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  verificationsChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 12 } } } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f0f2f4' } }
    }
  };

  statusChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  statusChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: { legend: { display: false } }
  };

  riskChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  riskChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { color: '#f0f2f4' } }, y: { grid: { display: false } } }
  };

  // ===== Compliance & Risk Intelligence (real cases and customers) =====
  intelLoading = true;
  cases: CaseStats | null = null;
  portfolio: PortfolioInsights | null = null;

  alertSeverityChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  alertSeverityChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { color: '#f0f2f4' }, beginAtZero: true }, y: { grid: { display: false } } }
  };

  statsError = '';

  constructor(private api: ComplianceApiService, private ai: AiApiService) {}

  ngOnInit() {
    this.loadIntelligence();
    this.api.dashboard().subscribe({ error: (e: ApiError) => { this.statsError = e.userMessage; this.loading = false; }, next: stats => {
      this.stats = stats;
      this.loading = false;

      this.verificationsChartData = {
        labels: stats.monthlyVerifications.map(m => m.month),
        datasets: [
          { data: stats.monthlyVerifications.map(m => m.kyc), label: 'KYC', backgroundColor: '#1fae62', borderRadius: 6, maxBarThickness: 18 },
          { data: stats.monthlyVerifications.map(m => m.kyb), label: 'KYB', backgroundColor: '#7bdda1', borderRadius: 6, maxBarThickness: 18 },
          { data: stats.monthlyVerifications.map(m => m.aml), label: 'AML', backgroundColor: '#0f6f40', borderRadius: 6, maxBarThickness: 18 }
        ]
      };

      this.statusChartData = {
        labels: stats.statusBreakdown.map(s => s.status),
        datasets: [{ data: stats.statusBreakdown.map(s => s.value), backgroundColor: stats.statusBreakdown.map(s => s.color), borderWidth: 0 }]
      };

      this.riskChartData = {
        labels: stats.riskBreakdown.map(r => r.level),
        datasets: [{ data: stats.riskBreakdown.map(r => r.value), backgroundColor: stats.riskBreakdown.map(r => r.color), borderRadius: 6, maxBarThickness: 22 }]
      };
    } });
  }

  topCountries(): string {
    return (this.portfolio?.topCountries ?? []).slice(0, 4).map(c => `${c.country} (${c.count})`).join(', ');
  }

  /** Cases and a portfolio summary. Each is skipped quietly when the person's role does not allow it. */
  private loadIntelligence() {
    forkJoin({
      cases: this.ai.caseStats().pipe(catchError(() => of(null))),
      portfolio: this.api.customers({ size: 200 }).pipe(
        switchMap(p => p.items.length ? this.ai.portfolio(p.items.map(c => ({
          status: c.status, riskLevel: c.riskLevel, country: c.country || undefined, formName: c.formName,
          reviewDays: c.completedAt ? Math.max(0, (Date.parse(c.completedAt) - Date.parse(c.startedAt)) / 86_400_000) : undefined
        }))) : of(null)),
        catchError(() => of(null)))
    }).subscribe(({ cases, portfolio }) => {
      this.cases = cases;
      this.portfolio = portfolio;
      if (cases) {
        const s = cases.bySeverity;
        this.alertSeverityChartData = {
          labels: ['Critical', 'High', 'Medium', 'Low'],
          datasets: [{ data: [s['critical'] || 0, s['high'] || 0, s['medium'] || 0, s['low'] || 0], backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#1fae62'], borderRadius: 6, maxBarThickness: 20 }]
        };
      }
      this.intelLoading = false;
    });
  }
}
