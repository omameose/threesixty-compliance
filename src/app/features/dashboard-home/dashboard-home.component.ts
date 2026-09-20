import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../core/http/api.service';
import { ComplianceApiService } from '../../core/services/compliance-api.service';
import { DataService } from '../../core/services/data.service';
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

  // ===== Compliance & Risk Intelligence =====
  intelLoading = true;
  openAlertsCount = 0;
  criticalAlertsCount = 0;
  activeInvestigations = 0;
  sanctionsMatches = 0;
  pepMatches = 0;
  adverseMediaFlags = 0;
  tmsEscalated = 0;
  fraudEscalated = 0;
  modelsInReview = 0;
  avgModelPrecision = 0;

  alertSeverityChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  alertSeverityChartOptions: ChartConfiguration<'bar'>['options'] = {
    indexAxis: 'y', responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { grid: { color: '#f0f2f4' }, beginAtZero: true }, y: { grid: { display: false } } }
  };

  screeningChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  screeningChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } } },
    scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f0f2f4' } } }
  };

  statsError = '';

  constructor(private data: DataService, private api: ComplianceApiService) {}

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

  private loadIntelligence() {
    forkJoin({
      alerts: this.data.getAlerts(),
      cases: this.data.getCases(),
      sanctions: this.data.getSanctionsCases(),
      pep: this.data.getPepCases(),
      adverseMedia: this.data.getAdverseMediaCases(),
      tms: this.data.getTmsHits(),
      fraud: this.data.getFraudHits(),
      models: this.data.getModels()
    }).subscribe(({ alerts, cases, sanctions, pep, adverseMedia, tms, fraud, models }) => {
      this.openAlertsCount = alerts.filter(a => a.status !== 'closed').length;
      this.criticalAlertsCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
      this.activeInvestigations = cases.filter(c => c.status !== 'closed').length;
      this.sanctionsMatches = sanctions.filter(s => s.verdict === 'MATCH').length;
      this.pepMatches = pep.filter(p => p.verdict === 'PEP_MATCH').length;
      this.adverseMediaFlags = adverseMedia.filter(a => a.verdict === 'POTENTIAL_RISK').length;
      this.tmsEscalated = tms.filter(t => t.status === 'escalated').length;
      this.fraudEscalated = fraud.filter(f => f.status === 'escalated').length;
      this.modelsInReview = models.filter(m => m.status === 'in_review').length;
      this.avgModelPrecision = models.length ? Math.round((models.reduce((s, m) => s + m.precision, 0) / models.length) * 100) : 0;

      const bySeverity = { low: 0, medium: 0, high: 0, critical: 0 };
      for (const a of alerts) bySeverity[a.severity]++;
      this.alertSeverityChartData = {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{ data: [bySeverity.critical, bySeverity.high, bySeverity.medium, bySeverity.low], backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#1fae62'], borderRadius: 6, maxBarThickness: 20 }]
      };

      this.screeningChartData = {
        labels: ['Sanctions', 'PEP', 'Adverse Media'],
        datasets: [
          { data: [sanctions.filter(s => s.verdict === 'CLEAR').length, pep.filter(p => p.verdict === 'CLEAR').length, adverseMedia.filter(a => a.verdict === 'CLEAR').length], label: 'Clear', backgroundColor: '#1fae62', borderRadius: 6, maxBarThickness: 22 },
          { data: [sanctions.filter(s => s.verdict === 'POTENTIAL_MATCH').length, pep.filter(p => p.verdict === 'POTENTIAL_PEP').length, adverseMedia.filter(a => a.verdict === 'POTENTIAL_RISK').length], label: 'Potential', backgroundColor: '#f59e0b', borderRadius: 6, maxBarThickness: 22 },
          { data: [sanctions.filter(s => s.verdict === 'MATCH').length, pep.filter(p => p.verdict === 'PEP_MATCH').length, 0], label: 'Match', backgroundColor: '#ef4444', borderRadius: 6, maxBarThickness: 22 }
        ]
      };

      this.intelLoading = false;
    });
  }
}
