import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/services/data.service';
import { StrSarFiling } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-str-sar-list',
  standalone: true,
  imports: [CommonModule, RouterLink, PageHeaderComponent, IconComponent],
  templateUrl: './str-sar-list.component.html'
})
export class StrSarListComponent {
  filings: StrSarFiling[] = [];
  loading = true;

  constructor(private data: DataService) {
    this.data.getStrSarFilings().subscribe(f => { this.filings = f; this.loading = false; });
  }

  statusBadge(s: StrSarFiling['status']) {
    return s === 'confirmed' ? 'badge-green' : s === 'filed' ? 'badge-blue' : s === 'pending_approval' ? 'badge-yellow' : 'badge-gray';
  }

  daysToDeadline(deadline: string) {
    const diff = Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff;
  }

  countByStatus(s: StrSarFiling['status']) {
    return this.filings.filter(f => f.status === s).length;
  }
}
