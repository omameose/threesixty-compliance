import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { Customer, CustomerRiskBreakdown, RiskFactorWeight, RiskTierThreshold } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-customer-risk-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, AvatarComponent, EmptyStateComponent],
  templateUrl: './customer-risk-engine.component.html'
})
export class CustomerRiskEngineComponent {
  tab = signal<'profiles' | 'configure'>('profiles');

  customers: Customer[] = [];
  loading = true;
  query = '';
  levelFilter: 'all' | Customer['riskLevel'] = 'all';
  selected = signal<Customer | null>(null);

  weights: RiskFactorWeight[] = [];
  thresholds: RiskTierThreshold[] = [];
  toast = signal('');

  // Quick simulator inputs (0-100 per inherent factor, plus overall control effectiveness)
  simInherentInputs: Record<string, number> = {};
  simControlScore = 60;

  constructor(private data: DataService) {
    this.data.getCustomers().subscribe(c => { this.customers = c; this.loading = false; });
    this.data.getRiskFactorWeights().subscribe(w => {
      this.weights = w;
      for (const factor of w.filter(x => x.category === 'Inherent')) this.simInherentInputs[factor.id] = 50;
    });
    this.data.getRiskTierThresholds().subscribe(t => this.thresholds = t);
  }

  filtered() {
    return this.customers.filter(c => {
      const matchesQuery = !this.query.trim() || c.fullName.toLowerCase().includes(this.query.toLowerCase());
      const matchesLevel = this.levelFilter === 'all' || c.riskLevel === this.levelFilter;
      return matchesQuery && matchesLevel;
    });
  }

  select(c: Customer) { this.selected.set(c); }

  levelBadge(l: Customer['riskLevel']) {
    return l === 'high' ? 'badge-red' : l === 'medium' ? 'badge-yellow' : 'badge-green';
  }

  countByLevel(l: Customer['riskLevel']) {
    return this.customers.filter(c => c.riskLevel === l).length;
  }

  inherentWeights() { return this.weights.filter(w => w.category === 'Inherent'); }
  controlWeights() { return this.weights.filter(w => w.category === 'Control'); }

  weightSum(category: 'Inherent' | 'Control') {
    return this.weights.filter(w => w.category === category).reduce((s, w) => s + w.weight, 0);
  }

  tierForScore(score: number): RiskTierThreshold['tier'] {
    const match = this.thresholds.find(t => score >= t.minScore && score <= t.maxScore);
    return match ? match.tier : 'Very High';
  }

  tierBadge(tier: string) {
    return tier === 'Low' ? 'badge-green' : tier === 'Medium' ? 'badge-yellow' : 'badge-red';
  }

  // Derives a customer's inherent/control/residual breakdown live from the CURRENT weight configuration,
  // so editing weights in the "Configure" tab immediately changes every customer's computed breakdown.
  breakdown(c: Customer): CustomerRiskBreakdown {
    const baseSignal = Math.min(100, Math.round(c.riskScore * 1.15));
    const rawComponents: Record<string, number> = {
      'Industry / Product Risk': Math.round(baseSignal * 0.9),
      'Geography Risk': Math.round(baseSignal * (c.country === 'Nigeria' ? 0.6 : 0.9)),
      'PEP / Sanctions / Adverse Media': (c.pepHit || c.sanctionsHit) ? 90 : 15,
      'Transaction Volume & Velocity': Math.round(baseSignal * 0.75),
      'Channel & Delivery Risk': Math.round(baseSignal * 0.5)
    };
    const inherentFactors = this.inherentWeights();
    const totalInherentWeight = inherentFactors.reduce((s, w) => s + w.weight, 0) || 1;
    const components = inherentFactors.map(w => ({ label: w.label, score: Math.min(100, rawComponents[w.label] ?? baseSignal), weight: w.weight }));
    const inherent = Math.round(components.reduce((s, comp) => s + comp.score * (comp.weight / totalInherentWeight), 0));

    const controlFactors = this.controlWeights();
    const totalControlWeight = controlFactors.reduce((s, w) => s + w.weight, 0) || 1;
    const controlRaw: Record<string, number> = {
      'KYC / Ownership Verification': c.sanctionsHit || c.pepHit ? 55 : 85,
      'Transaction Monitoring Coverage': 80,
      'Sanctions Screening QA': 88,
      'EDD Completion Rate': c.riskLevel === 'high' ? 60 : 92
    };
    const controlEffectiveness = Math.round(controlFactors.reduce((s, w) => s + (controlRaw[w.label] ?? 75) * (w.weight / totalControlWeight), 0));
    const residual = Math.round(inherent * (1 - controlEffectiveness / 150));

    return { customerId: c.id, inherentRisk: inherent, controlEffectiveness, residualRisk: Math.max(0, Math.min(100, residual)), components };
  }

  // ===== Configure weights & thresholds =====

  updateWeight(w: RiskFactorWeight, value: number) {
    this.data.updateRiskFactorWeight(w.id, value).subscribe(() => this.flash('Weight updated — customer breakdowns recalculated.'));
  }

  updateThreshold(t: RiskTierThreshold) {
    this.data.updateRiskTierThreshold(t).subscribe(() => this.flash('Tier threshold updated.'));
  }

  // ===== Quick simulator =====

  simulatedInherent() {
    const factors = this.inherentWeights();
    const total = factors.reduce((s, w) => s + w.weight, 0) || 1;
    return Math.round(factors.reduce((s, w) => s + (this.simInherentInputs[w.id] ?? 50) * (w.weight / total), 0));
  }

  simulatedResidual() {
    const inherent = this.simulatedInherent();
    return Math.max(0, Math.min(100, Math.round(inherent * (1 - this.simControlScore / 150))));
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2000);
  }
}
