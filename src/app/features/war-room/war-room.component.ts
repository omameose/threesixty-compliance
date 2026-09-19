import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { Alert, ComplianceCase, Customer, RegulatoryObligation, StrSarFiling } from '../../core/models/models';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-war-room',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './war-room.component.html'
})
export class WarRoomComponent {
  customers: Customer[] = [];
  alerts: Alert[] = [];
  cases: ComplianceCase[] = [];
  filings: StrSarFiling[] = [];
  obligations: RegulatoryObligation[] = [];
  loading = true;
  now = signal(new Date());

  constructor(private data: DataService) {
    this.data.getCustomers().subscribe(c => this.customers = c);
    this.data.getAlerts().subscribe(a => this.alerts = a);
    this.data.getCases().subscribe(c => this.cases = c);
    this.data.getStrSarFilings().subscribe(f => this.filings = f);
    this.data.getObligations().subscribe(o => { this.obligations = o; this.loading = false; });
    setInterval(() => this.now.set(new Date()), 30000);
  }

  overallRiskScore() {
    if (!this.customers.length) return 0;
    return Math.round(this.customers.reduce((s, c) => s + c.riskScore, 0) / this.customers.length);
  }

  criticalAlerts() {
    return this.alerts.filter(a => (a.severity === 'critical' || a.severity === 'high') && a.status !== 'closed');
  }

  highRiskCustomers() {
    return this.customers.filter(c => c.riskLevel === 'high');
  }

  pepCount() {
    return this.customers.filter(c => c.pepHit).length;
  }

  sanctionsHits() {
    return this.customers.filter(c => c.sanctionsHit).length;
  }

  activeInvestigations() {
    return this.cases.filter(c => c.status !== 'closed');
  }

  pendingStrs() {
    return this.filings.filter(f => f.status === 'drafting' || f.status === 'pending_approval');
  }

  overdueObligations() {
    return this.obligations.filter(o => o.status === 'overdue' || o.status === 'due_this_week');
  }
}
