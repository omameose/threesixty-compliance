import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { DetectionHitStatus, FraudCaseHit, FraudDecision } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-fraud-detection',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent, ModalComponent, EmptyStateComponent],
  templateUrl: './fraud-detection.component.html'
})
export class FraudDetectionComponent {
  hits: FraudCaseHit[] = [];
  loading = true;
  query = '';
  statusFilter: 'all' | DetectionHitStatus = 'all';
  selected = signal<FraudCaseHit | null>(null);
  toast = signal('');

  overrideModalOpen = signal(false);
  overrideDecision: FraudDecision = 'ALLOW';
  overrideReason = '';

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.data.getFraudHits().subscribe(h => { this.hits = h; this.loading = false; });
  }

  typologies() {
    const map = new Map<string, number>();
    for (const h of this.hits) map.set(h.typology, (map.get(h.typology) || 0) + 1);
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }

  filtered() {
    return this.hits.filter(h => {
      const matchesQuery = !this.query.trim() || h.customerName.toLowerCase().includes(this.query.toLowerCase()) || h.typology.toLowerCase().includes(this.query.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || h.status === this.statusFilter;
      return matchesQuery && matchesStatus;
    });
  }

  select(h: FraudCaseHit) { this.selected.set(h); }

  statusBadge(s: DetectionHitStatus) {
    return s === 'escalated' ? 'badge-red' : s === 'reviewing' ? 'badge-blue' : s === 'cleared' ? 'badge-green' : 'badge-gray';
  }

  decisionBadge(d: FraudDecision) {
    return d === 'BLOCK' ? 'badge-red' : d === 'CHALLENGE' ? 'badge-yellow' : d === 'REVIEW' ? 'badge-blue' : 'badge-green';
  }

  effectiveDecision(h: FraudCaseHit) {
    return h.overrideDecision || h.decision;
  }

  setStatus(hit: FraudCaseHit, status: DetectionHitStatus) {
    this.data.updateFraudHitStatus(hit.id, status).subscribe(() => {
      this.hits = this.hits.map(h => h.id === hit.id ? { ...h, status } : h);
      if (this.selected()?.id === hit.id) this.selected.set({ ...hit, status });
      this.flash(`Marked as ${status}.`);
    });
  }

  openOverride() {
    const h = this.selected();
    if (!h) return;
    this.overrideDecision = this.effectiveDecision(h);
    this.overrideReason = '';
    this.overrideModalOpen.set(true);
  }

  confirmOverride() {
    const h = this.selected();
    if (!h || !this.overrideReason.trim()) return;
    this.data.overrideFraudDecision(h.id, this.overrideDecision, this.overrideReason.trim(), 'Rukayat Yaro').subscribe(() => {
      this.data.getFraudHits().subscribe(hits => {
        this.hits = hits;
        const updated = hits.find(x => x.id === h.id);
        if (updated) this.selected.set(updated);
      });
      this.overrideModalOpen.set(false);
      this.flash('Decision override recorded.');
    });
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
