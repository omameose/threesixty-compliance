import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { Alert, ComplianceCase, Customer, StrSarFiling } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

@Component({
  selector: 'app-board-dashboard',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, IconComponent, StatCardComponent],
  templateUrl: './board-dashboard.component.html'
})
export class BoardDashboardComponent {
  customers: Customer[] = [];
  alerts: Alert[] = [];
  cases: ComplianceCase[] = [];
  filings: StrSarFiling[] = [];
  loading = true;

  geographyExposure = [
    { region: 'Lagos', customers: 312, highRisk: 18 },
    { region: 'Abuja (FCT)', customers: 154, highRisk: 9 },
    { region: 'Port Harcourt', customers: 88, highRisk: 6 },
    { region: 'Kano', customers: 61, highRisk: 4 },
    { region: 'Cross-border (Ghana, Kenya)', customers: 44, highRisk: 7 }
  ];

  constructor(private data: DataService) {
    this.data.getCustomers().subscribe(c => this.customers = c);
    this.data.getAlerts().subscribe(a => this.alerts = a);
    this.data.getCases().subscribe(c => this.cases = c);
    this.data.getStrSarFilings().subscribe(f => { this.filings = f; this.loading = false; });
  }

  highRiskCustomers() {
    return this.customers.filter(c => c.riskLevel === 'high');
  }

  pepCount() {
    return this.customers.filter(c => c.pepHit).length;
  }

  sanctionsCount() {
    return this.customers.filter(c => c.sanctionsHit).length;
  }

  openAlerts() {
    return this.alerts.filter(a => a.status !== 'closed');
  }

  openInvestigations() {
    return this.cases.filter(c => c.status !== 'closed');
  }

  strsFiled() {
    return this.filings.filter(f => f.status === 'filed' || f.status === 'confirmed').length;
  }

  falsePositiveRate() {
    const total = this.alerts.length || 1;
    const closedClean = this.alerts.filter(a => a.status === 'closed').length;
    return Math.round((closedClean / total) * 100);
  }

  strConversionRate() {
    const total = this.cases.length || 1;
    return Math.round((this.filings.length / total) * 100);
  }
}
