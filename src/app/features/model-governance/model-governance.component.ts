import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { ModelGovernanceEntry } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-model-governance',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, IconComponent],
  templateUrl: './model-governance.component.html'
})
export class ModelGovernanceComponent {
  models: ModelGovernanceEntry[] = [];
  loading = true;
  expandedIds = signal<Set<string>>(new Set());

  constructor(private data: DataService) {
    this.data.getModels().subscribe(m => { this.models = m; this.loading = false; });
  }

  statusBadge(s: ModelGovernanceEntry['status']) {
    return s === 'approved' ? 'badge-green' : s === 'in_review' ? 'badge-yellow' : 'badge-gray';
  }

  pct(v: number) {
    return Math.round(v * 100) + '%';
  }

  isExpanded(id: string) { return this.expandedIds().has(id); }
  toggleExpand(id: string) {
    this.expandedIds.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  incidentBadge(s: 'low' | 'medium' | 'high') {
    return s === 'high' ? 'badge-red' : s === 'medium' ? 'badge-yellow' : 'badge-gray';
  }
}
