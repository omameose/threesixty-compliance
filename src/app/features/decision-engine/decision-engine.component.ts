import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { RiskAppetiteTier, RiskTierThreshold } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

const APPROVERS = ['Automated / Standard Approval', 'Compliance Officer', 'Chief Compliance Officer', 'Executive Risk Committee', 'System (auto-block)'];

@Component({
  selector: 'app-decision-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  templateUrl: './decision-engine.component.html'
})
export class DecisionEngineComponent {
  matrix: RiskAppetiteTier[] = [];
  thresholds: RiskTierThreshold[] = [];
  loading = true;
  approvers = APPROVERS;
  saved = signal(false);

  // Simulator
  simScore = 50;
  simSanctionsConfirmed = false;
  simInvestigationPending = false;

  constructor(private data: DataService) {
    this.data.getRiskAppetiteMatrix().subscribe(m => { this.matrix = m.map(t => ({ ...t })); this.loading = false; });
    this.data.getRiskTierThresholds().subscribe(t => this.thresholds = t);
  }

  levelBadge(level: RiskAppetiteTier['riskLevel']) {
    if (level === 'Low') return 'badge-green';
    if (level === 'Medium') return 'badge-yellow';
    if (level === 'High' || level === 'Very High') return 'badge-red';
    return 'badge-gray';
  }

  save(tier: RiskAppetiteTier) {
    this.data.updateRiskAppetiteTier(tier).subscribe(() => {
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    });
  }

  // ===== Simulator =====

  simulatedTierLabel(): RiskAppetiteTier['riskLevel'] {
    if (this.simSanctionsConfirmed) return 'Prohibited / Sanctions-Confirmed';
    const match = this.thresholds.find(t => this.simScore >= t.minScore && this.simScore <= t.maxScore);
    return (match?.tier as RiskAppetiteTier['riskLevel']) || 'Very High';
  }

  simulatedRoute(): RiskAppetiteTier | undefined {
    if (this.simInvestigationPending && !this.simSanctionsConfirmed) {
      return { riskLevel: this.simulatedTierLabel(), approver: 'Case held pending investigation', action: 'Hold — no approval routed until investigation concludes', slaHours: 0 };
    }
    return this.matrix.find(t => t.riskLevel === this.simulatedTierLabel());
  }
}
