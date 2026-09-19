import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { KybCompany } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { NotesPanelComponent } from '../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-kyb-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './kyb-verification.component.html'
})
export class KybVerificationComponent {
  companies: KybCompany[] = [];
  loading = true;
  query = '';
  selected = signal<KybCompany | null>(null);
  toast = signal('');

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getKybCompanies().subscribe(c => { this.companies = c; this.loading = false; });
  }

  filtered() {
    const q = this.query.trim().toLowerCase();
    if (!q) return this.companies;
    return this.companies.filter(c => c.legalName.toLowerCase().includes(q) || c.registrationNumber.toLowerCase().includes(q));
  }

  countByStatus(status: KybCompany['verificationStatus']) {
    return this.companies.filter(c => c.verificationStatus === status).length;
  }

  flaggedCount() {
    return this.companies.filter(c => c.riskFlags.length > 0).length;
  }

  select(c: KybCompany) { this.selected.set(c); }

  statusBadge(s: KybCompany['verificationStatus']) {
    return s === 'verified' ? 'badge-green' : s === 'review_required' ? 'badge-yellow' : s === 'rejected' ? 'badge-red' : 'badge-gray';
  }

  flagBadge(flag?: string) {
    if (flag === 'offshore') return 'badge-yellow';
    if (flag === 'nominee' || flag === 'complex') return 'badge-red';
    return '';
  }

  setStatus(status: KybCompany['verificationStatus']) {
    const c = this.selected();
    if (!c) return;
    this.data.updateKybVerificationStatus(c.id, status, 'Rukayat Yaro').subscribe(() => {
      this.data.getKybCompany(c.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.toastMsg('Verification status updated.');
    });
  }

  addNote(text: string) {
    const c = this.selected();
    if (!c) return;
    this.data.addKybNote(c.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getKybCompany(c.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  private toastMsg(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
