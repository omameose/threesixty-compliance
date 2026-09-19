import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { DetectionHitStatus, TmsScenarioHit } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-transaction-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent],
  templateUrl: './transaction-monitoring.component.html'
})
export class TransactionMonitoringComponent {
  hits: TmsScenarioHit[] = [];
  loading = true;
  query = '';
  statusFilter: 'all' | DetectionHitStatus = 'all';
  toast = signal('');

  constructor(private data: DataService) {
    this.data.getTmsHits().subscribe(h => { this.hits = h; this.loading = false; });
  }

  scenarios() {
    const map = new Map<string, number>();
    for (const h of this.hits) map.set(h.scenario, (map.get(h.scenario) || 0) + 1);
    return Array.from(map.entries()).map(([label, count]) => ({ label, count }));
  }

  filtered() {
    return this.hits.filter(h => {
      const matchesQuery = !this.query.trim() || h.customerName.toLowerCase().includes(this.query.toLowerCase()) || h.scenario.toLowerCase().includes(this.query.toLowerCase());
      const matchesStatus = this.statusFilter === 'all' || h.status === this.statusFilter;
      return matchesQuery && matchesStatus;
    });
  }

  statusBadge(s: DetectionHitStatus) {
    return s === 'escalated' ? 'badge-red' : s === 'reviewing' ? 'badge-blue' : s === 'cleared' ? 'badge-green' : 'badge-gray';
  }

  setStatus(hit: TmsScenarioHit, status: DetectionHitStatus) {
    this.data.updateTmsHitStatus(hit.id, status).subscribe(() => {
      this.hits = this.hits.map(h => h.id === hit.id ? { ...h, status } : h);
      this.flash(`Marked as ${status}.`);
    });
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2000);
  }
}
