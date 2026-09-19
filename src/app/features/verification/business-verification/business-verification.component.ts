import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { BusinessVerificationRecord, VerificationOutcome } from '../../../core/models/models';
import { BUSINESS_VERIFICATION_TYPES, VERIFICATION_COUNTRIES } from '../../../core/mock/verification-details.mock';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotesPanelComponent } from '../../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-business-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './business-verification.component.html'
})
export class BusinessVerificationComponent {
  records: BusinessVerificationRecord[] = [];
  loading = true;
  query = '';
  outcomeFilter: 'all' | VerificationOutcome = 'all';
  selected = signal<BusinessVerificationRecord | null>(null);
  toast = signal('');

  verificationTypes = BUSINESS_VERIFICATION_TYPES;
  countries = VERIFICATION_COUNTRIES;

  runModalOpen = signal(false);
  running = signal(false);
  newBizName = '';
  newVerificationType = '';
  newCountry = '';
  newRefNumber = '';

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getBusinessVerifications().subscribe(r => { this.records = r; this.loading = false; });
  }

  filtered() {
    return this.records.filter(r => {
      const matchesQuery = !this.query.trim() || r.businessName.toLowerCase().includes(this.query.toLowerCase());
      const matchesOutcome = this.outcomeFilter === 'all' || r.outcome === this.outcomeFilter;
      return matchesQuery && matchesOutcome;
    });
  }

  countByOutcome(o: VerificationOutcome) {
    return this.records.filter(r => r.outcome === o).length;
  }

  select(r: BusinessVerificationRecord) { this.selected.set(r); }

  outcomeBadge(o: VerificationOutcome) {
    return o === 'VERIFIED' ? 'badge-green' : o === 'FAILED' ? 'badge-red' : o === 'REVIEW_REQUIRED' ? 'badge-yellow' : 'badge-gray';
  }

  setOutcome(outcome: VerificationOutcome) {
    const r = this.selected();
    if (!r) return;
    this.data.updateBusinessVerificationOutcome(r.id, outcome).subscribe(() => {
      this.data.getBusinessVerification(r.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.flash('Verification outcome updated.');
    });
  }

  addNote(text: string) {
    const r = this.selected();
    if (!r) return;
    this.data.addBusinessVerificationNote(r.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getBusinessVerification(r.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  runVerification() {
    if (!this.newBizName.trim() || !this.newRefNumber.trim()) return;
    this.running.set(true);
    setTimeout(() => {
      const score = Math.floor(50 + Math.random() * 50);
      const outcome: VerificationOutcome = score > 85 ? 'VERIFIED' : score > 65 ? 'REVIEW_REQUIRED' : 'FAILED';
      const record: BusinessVerificationRecord = {
        id: 'biz-' + Date.now(), businessName: this.newBizName.trim(), verificationType: this.newVerificationType || this.verificationTypes[0],
        referenceNumber: this.newRefNumber.trim(), country: this.newCountry || 'Nigeria',
        status: outcome === 'VERIFIED' ? 'approved' : outcome === 'FAILED' ? 'rejected' : 'pending_review',
        checkedAt: new Date().toISOString().slice(0, 10), outcome, legalName: this.newBizName.trim(),
        incorporationStatus: outcome === 'FAILED' ? 'Dissolved' : 'Active', directors: [], shareholders: [],
        discrepancies: outcome === 'FAILED' ? ['Registry lookup returned no active match for this reference number'] : outcome === 'REVIEW_REQUIRED' ? ['Minor address mismatch between submitted and registry records'] : [],
        confidenceScore: score, dataSources: ['CAC Registry'], notes: []
      };
      this.records = [record, ...this.records];
      this.running.set(false);
      this.runModalOpen.set(false);
      this.select(record);
      this.flash('Verification complete.');
    }, 1200);
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
