import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { MerchantRiskProfile } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-merchant-risk',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  templateUrl: './merchant-risk.component.html'
})
export class MerchantRiskComponent {
  merchants: MerchantRiskProfile[] = [];
  loading = true;
  query = '';

  constructor(private data: DataService) {
    this.data.getMerchants().subscribe(m => { this.merchants = m; this.loading = false; });
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.merchants;
    return this.merchants.filter(m => m.merchantName.toLowerCase().includes(q) || m.mcc.toLowerCase().includes(q));
  }

  countByStatus(s: MerchantRiskProfile['status']) {
    return this.merchants.filter(m => m.status === s).length;
  }

  riskBadge(l: MerchantRiskProfile['riskLevel']) {
    return l === 'high' ? 'badge-red' : l === 'medium' ? 'badge-yellow' : 'badge-green';
  }

  statusBadge(s: MerchantRiskProfile['status']) {
    return s === 'suspended' ? 'badge-red' : s === 'under_review' ? 'badge-yellow' : 'badge-green';
  }

  volumeRatio(m: MerchantRiskProfile) {
    return Math.round((m.actualMonthlyVolume / m.expectedMonthlyVolume) * 100);
  }
}
