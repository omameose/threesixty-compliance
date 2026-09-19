import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { CompliancePolicy, TrainingRecord, ControlAssessment } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { StatCardComponent } from '../../shared/components/stat-card/stat-card.component';

type Tab = 'programme' | 'training' | 'csa';

@Component({
  selector: 'app-compliance-programme',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, IconComponent, StatCardComponent],
  templateUrl: './compliance-programme.component.html'
})
export class ComplianceProgrammeComponent {
  tab = signal<Tab>('programme');
  policies: CompliancePolicy[] = [];
  training: TrainingRecord[] = [];
  controls: ControlAssessment[] = [];
  loading = true;

  constructor(private data: DataService) {
    this.data.getPolicies().subscribe(p => this.policies = p);
    this.data.getTrainingRecords().subscribe(t => this.training = t);
    this.data.getControlAssessments().subscribe(c => { this.controls = c; this.loading = false; });
  }

  policyBadge(s: CompliancePolicy['status']) {
    return s === 'current' ? 'badge-green' : s === 'due_for_review' ? 'badge-yellow' : 'badge-red';
  }

  trainingBadge(s: TrainingRecord['status']) {
    return s === 'completed' ? 'badge-green' : s === 'overdue' ? 'badge-red' : 'badge-yellow';
  }

  controlBadge(r: ControlAssessment['rating']) {
    return r === 'strong' ? 'badge-green' : r === 'satisfactory' ? 'badge-yellow' : 'badge-red';
  }

  trainingCompletionRate() {
    if (!this.training.length) return 0;
    return Math.round((this.training.filter(t => t.status === 'completed').length / this.training.length) * 100);
  }

  overdueTrainingCount() {
    return this.training.filter(t => t.status === 'overdue').length;
  }

  overallControlScore() {
    if (!this.controls.length) return 0;
    return Math.round(this.controls.reduce((s, c) => s + c.effectivenessScore, 0) / this.controls.length);
  }

  totalRemediationTasks() {
    return this.controls.reduce((s, c) => s + c.remediationTasks, 0);
  }
}
