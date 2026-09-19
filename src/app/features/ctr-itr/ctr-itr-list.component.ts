import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { DataService } from '../../core/services/data.service';
import { CtrItrReport } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-ctr-itr-list',
  standalone: true,
  imports: [CommonModule, PageHeaderComponent, IconComponent],
  templateUrl: './ctr-itr-list.component.html'
})
export class CtrItrListComponent {
  reports: CtrItrReport[] = [];
  loading = true;
  typeFilter: 'all' | 'CTR' | 'ITR' = 'all';

  constructor(private data: DataService) {
    this.data.getCtrItrReports().subscribe(r => { this.reports = r; this.loading = false; });
  }

  filtered() {
    return this.typeFilter === 'all' ? this.reports : this.reports.filter(r => r.reportType === this.typeFilter);
  }

  statusBadge(s: CtrItrReport['status']) {
    return s === 'confirmed' ? 'badge-green' : s === 'submitted' ? 'badge-blue' : s === 'ready' ? 'badge-green' : s === 'exception' ? 'badge-red' : 'badge-yellow';
  }

  formatAmount(r: CtrItrReport) {
    return r.currency + ' ' + r.amount.toLocaleString();
  }

  countByStatus(s: CtrItrReport['status']) {
    return this.reports.filter(r => r.status === s).length;
  }
}
