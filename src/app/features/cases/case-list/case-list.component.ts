import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { ComplianceCase, CaseStatus } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, IconComponent, AvatarComponent, EmptyStateComponent],
  templateUrl: './case-list.component.html'
})
export class CaseListComponent {
  cases: ComplianceCase[] = [];
  loading = true;
  statusFilter: 'all' | CaseStatus = 'all';

  constructor(private data: DataService) {
    this.data.getCases().subscribe(c => { this.cases = c; this.loading = false; });
  }

  filtered() {
    return this.statusFilter === 'all' ? this.cases : this.cases.filter(c => c.status === this.statusFilter);
  }

  statusBadge(s: CaseStatus) {
    return s === 'closed' ? 'badge-green' : s === 'escalated' ? 'badge-red' : s === 'investigating' || s === 'pending_info' ? 'badge-blue' : s === 'decision' ? 'badge-yellow' : 'badge-gray';
  }

  priorityBadge(p: ComplianceCase['priority']) {
    return p === 'critical' || p === 'high' ? 'badge-red' : p === 'medium' ? 'badge-yellow' : 'badge-gray';
  }
}
