import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { DocumentVerificationRecord, VerificationOutcome } from '../../../core/models/models';
import { DOCUMENT_TYPES } from '../../../core/mock/verification-details.mock';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotesPanelComponent } from '../../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-document-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './document-verification.component.html'
})
export class DocumentVerificationComponent {
  records: DocumentVerificationRecord[] = [];
  loading = true;
  query = '';
  outcomeFilter: 'all' | VerificationOutcome = 'all';
  selected = signal<DocumentVerificationRecord | null>(null);
  toast = signal('');

  documentTypes = DOCUMENT_TYPES;

  uploadModalOpen = signal(false);
  processing = signal(false);
  newCustomerName = '';
  newDocumentType = '';

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getDocumentVerifications().subscribe(r => { this.records = r; this.loading = false; });
  }

  filtered() {
    return this.records.filter(r => {
      const matchesQuery = !this.query.trim() || r.customerName.toLowerCase().includes(this.query.toLowerCase());
      const matchesOutcome = this.outcomeFilter === 'all' || r.outcome === this.outcomeFilter;
      return matchesQuery && matchesOutcome;
    });
  }

  countByOutcome(o: VerificationOutcome) {
    return this.records.filter(r => r.outcome === o).length;
  }

  select(r: DocumentVerificationRecord) { this.selected.set(r); }

  outcomeBadge(o: VerificationOutcome) {
    return o === 'VERIFIED' ? 'badge-green' : o === 'FAILED' ? 'badge-red' : o === 'REVIEW_REQUIRED' ? 'badge-yellow' : 'badge-gray';
  }

  setOutcome(outcome: VerificationOutcome) {
    const r = this.selected();
    if (!r) return;
    this.data.updateDocumentVerificationOutcome(r.id, outcome).subscribe(() => {
      this.data.getDocumentVerification(r.id).subscribe(updated => { if (updated) this.selected.set(updated); this.load(); });
      this.flash('Document outcome updated.');
    });
  }

  addNote(text: string) {
    const r = this.selected();
    if (!r) return;
    this.data.addDocumentVerificationNote(r.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getDocumentVerification(r.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  runUpload() {
    if (!this.newCustomerName.trim() || !this.newDocumentType) return;
    this.processing.set(true);
    setTimeout(() => {
      const score = Math.floor(40 + Math.random() * 60);
      const outcome: VerificationOutcome = score > 88 ? 'VERIFIED' : score > 60 ? 'REVIEW_REQUIRED' : 'FAILED';
      const record: DocumentVerificationRecord = {
        id: 'doc-' + Date.now(), customerName: this.newCustomerName.trim(), documentType: this.newDocumentType, issuingCountry: 'Nigeria',
        documentNumber: 'N/A', outcome, authenticityScore: score,
        tamperIndicators: outcome === 'FAILED' ? ['Font inconsistency detected', 'Metadata suggests image editing software was used'] : outcome === 'REVIEW_REQUIRED' ? ['Minor compression artefacts near security seal — inconclusive'] : [],
        extractedFields: [{ label: 'Name', value: this.newCustomerName.trim(), matchesSubmitted: true }],
        anomalies: outcome !== 'VERIFIED' ? ['Recommend requesting a clearer, unedited copy of the document'] : [],
        provider: 'Smile ID', checkedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), notes: []
      };
      this.records = [record, ...this.records];
      this.processing.set(false);
      this.uploadModalOpen.set(false);
      this.select(record);
      this.flash('Document processed.');
    }, 1300);
  }

  private flash(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 2500);
  }
}
