import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ComplianceRule, RuleCondition } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

const OPERATORS: RuleCondition['operator'][] = ['>', '>=', '<', '<=', '=', '!=', 'contains', 'in'];

@Component({
  selector: 'app-rules-studio',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent],
  templateUrl: './rules-studio.component.html'
})
export class RulesStudioComponent {
  rules: ComplianceRule[] = [];
  loading = true;
  moduleFilter = 'all';
  saved = signal(false);
  operators = OPERATORS;

  builderOpen = signal(false);
  editingRuleId = '';
  builderConditions: RuleCondition[] = [];
  builderAction = '';
  builderSeverity: ComplianceRule['severity'] = 'medium';
  builderSummary = '';
  showVersionHistory = signal(false);

  simValues: Record<number, string> = {};
  simResult = signal<{ passed: boolean; breakdown: { text: string; passed: boolean }[] } | null>(null);

  constructor(private data: DataService) {
    this.data.getRules().subscribe(r => { this.rules = r; this.loading = false; });
  }

  modules() {
    return ['all', ...Array.from(new Set(this.rules.map(r => r.module)))];
  }

  filtered() {
    return this.moduleFilter === 'all' ? this.rules : this.rules.filter(r => r.module === this.moduleFilter);
  }

  severityBadge(s: ComplianceRule['severity']) {
    return s === 'critical' ? 'badge-red' : s === 'high' ? 'badge-red' : s === 'medium' ? 'badge-yellow' : 'badge-gray';
  }

  toggle(rule: ComplianceRule) {
    this.data.toggleRule(rule.id).subscribe(() => {
      this.rules = this.rules.map(r => r.id === rule.id ? { ...r, enabled: !r.enabled } : r);
      this.flash();
    });
  }

  updateWeight(rule: ComplianceRule, value: number) {
    this.data.updateRuleWeight(rule.id, value).subscribe(() => this.flash());
  }

  // ===== WHEN → AND/OR → THEN → ACTION builder =====

  openBuilder(rule: ComplianceRule) {
    this.editingRuleId = rule.id;
    this.builderConditions = rule.conditions.map(c => ({ ...c }));
    this.builderAction = rule.action;
    this.builderSeverity = rule.severity;
    this.builderSummary = '';
    this.simValues = {};
    this.simResult.set(null);
    this.showVersionHistory.set(false);
    this.builderOpen.set(true);
  }

  editingRule() {
    return this.rules.find(r => r.id === this.editingRuleId);
  }

  addCondition() {
    this.builderConditions.push({ field: '', operator: '=', value: '', logic: 'AND' });
  }

  removeCondition(index: number) {
    this.builderConditions.splice(index, 1);
  }

  runSimulation() {
    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';
    const breakdown: { text: string; passed: boolean }[] = [];

    this.builderConditions.forEach((cond, i) => {
      const testValue = this.simValues[i] ?? '';
      const passed = this.evaluateCondition(cond, testValue);
      breakdown.push({ text: `${cond.field || '(field)'} ${cond.operator} ${cond.value}  —  tested with "${testValue}"`, passed });
      if (i === 0) result = passed;
      else result = currentLogic === 'AND' ? (result && passed) : (result || passed);
      if (cond.logic) currentLogic = cond.logic;
    });

    this.simResult.set({ passed: result, breakdown });
  }

  private evaluateCondition(cond: RuleCondition, testValue: string): boolean {
    const numTest = parseFloat(testValue);
    const numRule = parseFloat(cond.value);
    switch (cond.operator) {
      case '>': return numTest > numRule;
      case '>=': return numTest >= numRule;
      case '<': return numTest < numRule;
      case '<=': return numTest <= numRule;
      case '=': return testValue.trim().toLowerCase() === cond.value.trim().toLowerCase();
      case '!=': return testValue.trim().toLowerCase() !== cond.value.trim().toLowerCase();
      case 'contains': return testValue.toLowerCase().includes(cond.value.toLowerCase());
      case 'in': return cond.value.toLowerCase().split(',').map(v => v.trim()).includes(testValue.trim().toLowerCase());
      default: return false;
    }
  }

  publish() {
    if (!this.builderSummary.trim()) return;
    this.data.publishRule(this.editingRuleId, this.builderConditions, this.builderAction, this.builderSeverity, this.builderSummary.trim(), 'Rukayat Yaro').subscribe(() => {
      this.data.getRules().subscribe(r => { this.rules = r; });
      this.builderOpen.set(false);
      this.flash();
    });
  }

  private flash() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 1800);
  }
}
