import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { ComplianceApiService, LinkView, toForm } from '../../../core/services/compliance-api.service';
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
  generatedLink = signal<LinkView | null>(null);
  links: LinkView[] = [];
  linkLabel = '';
  error = signal('');
  creating = signal(false);
  copied = signal(false);

  constructor(private api: ComplianceApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.form(this.formId).subscribe({
      next: f => { this.form = { ...toForm(f.summary), sections: f.sections ?? [] }; this.links = f.links ?? []; },
      error: (e: ApiError) => { this.error.set(e.userMessage); this.loading = false; }
    });
    this.api.customers({ formId: this.formId }).subscribe({
      next: p => { this.customers = p.items; this.loading = false; },
      error: (e: ApiError) => { this.error.set(e.userMessage); this.loading = false; }
    });
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

  /** One link serves any number of customers: each starts on their own by giving a name and email and confirming a code. */
  generateLink() {
    this.creating.set(true);
    this.error.set('');
    this.api.createLink(this.formId, { label: this.linkLabel.trim() || undefined }).subscribe({
      next: l => { this.creating.set(false); this.generatedLink.set(l); this.links = [l, ...this.links]; },
      error: (e: ApiError) => { this.creating.set(false); this.error.set(e.userMessage); }
    });
  }

  toggleLink(l: LinkView) {
    this.api.updateLink(this.formId, l.linkCode, { enabled: !l.enabled }).subscribe({
      next: u => this.links = this.links.map(x => x.linkCode === u.linkCode ? u : x),
      error: (e: ApiError) => this.error.set(e.userMessage)
    });
  }

  copyLink() {
    const link = this.generatedLink();
    if (!link) return;
    navigator.clipboard?.writeText(link.url).catch(() => {});
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  closeLinkModal() {
    this.linkModalOpen.set(false);
    this.generatedLink.set(null);
    this.linkLabel = '';
  }
}
