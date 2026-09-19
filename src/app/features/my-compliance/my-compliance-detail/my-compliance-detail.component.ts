import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../../core/services/data.service';
import { ComplianceForm, Customer } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-my-compliance-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent, IconComponent, AvatarComponent, EmptyStateComponent, ModalComponent],
  templateUrl: './my-compliance-detail.component.html'
})
export class MyComplianceDetailComponent implements OnInit {
  @Input() formId!: string;
  form?: ComplianceForm;
  customers: Customer[] = [];
  loading = true;
  statusFilter = 'all';
  query = '';
  linkModalOpen = signal(false);
  generatedLink = signal<{ complianceId: string; link: string } | null>(null);
  newCustomerName = '';
  newCustomerEmail = '';
  copied = signal(false);

  constructor(private data: DataService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getForm(this.formId).subscribe(f => this.form = f);
    this.data.getCustomersByForm(this.formId).subscribe(c => { this.customers = c; this.loading = false; });
  }

  filtered() {
    return this.customers.filter(c => {
      const matchesStatus = this.statusFilter === 'all' || c.status === this.statusFilter;
      const matchesQuery = !this.query.trim() || c.fullName.toLowerCase().includes(this.query.toLowerCase()) || c.complianceId.toLowerCase().includes(this.query.toLowerCase());
      return matchesStatus && matchesQuery;
    });
  }

  statusLabel(s: Customer['status']) {
    return { not_started: 'Not Started', in_progress: 'In Progress', pending_review: 'Pending Review', more_info_required: 'More Info Required', approved: 'Approved', rejected: 'Rejected' }[s];
  }

  statusBadgeClass(s: Customer['status']) {
    return {
      not_started: 'badge-gray', in_progress: 'badge-blue', pending_review: 'badge-yellow',
      more_info_required: 'badge-yellow', approved: 'badge-green', rejected: 'badge-red'
    }[s];
  }

  generateLink() {
    if (!this.newCustomerName.trim()) return;
    this.data.generateComplianceLink(this.newCustomerName, this.formId).subscribe(res => {
      this.generatedLink.set(res);
    });
  }

  copyLink() {
    const link = this.generatedLink();
    if (!link) return;
    navigator.clipboard?.writeText(link.link).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  closeLinkModal() {
    this.linkModalOpen.set(false);
    this.generatedLink.set(null);
    this.newCustomerName = '';
    this.newCustomerEmail = '';
  }
}
