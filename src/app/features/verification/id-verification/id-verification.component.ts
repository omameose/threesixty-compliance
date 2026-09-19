import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../core/services/data.service';
import { IdVerificationRecord, VerificationOutcome } from '../../../core/models/models';
import { ID_TYPES, VERIFICATION_COUNTRIES, ID_PROVIDERS } from '../../../core/mock/verification-details.mock';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { NotesPanelComponent } from '../../../shared/components/notes-panel/notes-panel.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-id-verification',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, AvatarComponent, ModalComponent, NotesPanelComponent, EmptyStateComponent],
  templateUrl: './id-verification.component.html'
})
export class IdVerificationComponent {
  records: IdVerificationRecord[] = [];
  loading = true;
  query = '';
  outcomeFilter: 'all' | VerificationOutcome = 'all';
  selected = signal<IdVerificationRecord | null>(null);
  toast = signal('');

  idTypes = ID_TYPES;
  countries = VERIFICATION_COUNTRIES;

  wizardOpen = signal(false);
  wizardStep = signal<1 | 2 | 3>(1);
  wCustomerName = '';
  wIdType = '';
  wIdCountry = '';
  wUploaded = signal(false);
  wUploading = signal(false);
  wLivenessRunning = signal(false);
  wLivenessDone = signal(false);
  wResult: IdVerificationRecord | null = null;

  constructor(private data: DataService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.data.getIdVerifications().subscribe(r => { this.records = r; this.loading = false; });
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

  avgOcrConfidence() {
    const done = this.records.filter(r => r.ocrConfidence > 0);
    if (!done.length) return 0;
    return Math.round(done.reduce((s, r) => s + r.ocrConfidence, 0) / done.length);
  }

  select(r: IdVerificationRecord) { this.selected.set(r); }

  outcomeBadge(o: VerificationOutcome) {
    return o === 'VERIFIED' ? 'badge-green' : o === 'FAILED' ? 'badge-red' : o === 'REVIEW_REQUIRED' ? 'badge-yellow' : 'badge-gray';
  }

  addNote(text: string) {
    const r = this.selected();
    if (!r) return;
    this.data.addIdVerificationNote(r.id, { id: 'n-' + Date.now(), author: 'Rukayat Yaro', date: new Date().toISOString().slice(0, 16).replace('T', ' '), text }).subscribe(() => {
      this.data.getIdVerification(r.id).subscribe(updated => { if (updated) this.selected.set(updated); });
    });
  }

  // ===== Guided wizard =====
  openWizard() {
    this.wizardStep.set(1);
    this.wCustomerName = '';
    this.wIdType = '';
    this.wIdCountry = '';
    this.wUploaded.set(false);
    this.wLivenessDone.set(false);
    this.wResult = null;
    this.wizardOpen.set(true);
  }

  simulateUpload() {
    this.wUploading.set(true);
    setTimeout(() => {
      this.wUploading.set(false);
      this.wUploaded.set(true);
    }, 1000);
  }

  goToLiveness() {
    this.wizardStep.set(2);
  }

  runLivenessCheck() {
    this.wLivenessRunning.set(true);
    setTimeout(() => {
      this.wLivenessRunning.set(false);
      this.wLivenessDone.set(true);
    }, 1400);
  }

  finishWizard() {
    const ocr = Math.floor(70 + Math.random() * 30);
    const face = Math.floor(60 + Math.random() * 40);
    const liveness: 'pass' | 'fail' = Math.random() > 0.15 ? 'pass' : 'fail';
    let outcome: VerificationOutcome = 'VERIFIED';
    const failureReasons: string[] = [];
    if (liveness === 'fail') { outcome = 'FAILED'; failureReasons.push('Liveness check failed'); }
    else if (face < 80 || ocr < 85) { outcome = 'REVIEW_REQUIRED'; if (face < 80) failureReasons.push('Face match below 80% confidence threshold'); if (ocr < 85) failureReasons.push('OCR confidence below 85% — manual field verification recommended'); }

    const record: IdVerificationRecord = {
      id: 'idv-' + Date.now(), customerName: this.wCustomerName.trim() || 'New Applicant', idType: this.wIdType, idCountry: this.wIdCountry,
      formName: 'Manual Verification', status: outcome === 'VERIFIED' ? 'approved' : outcome === 'FAILED' ? 'rejected' : 'more_info_required',
      checkedAt: new Date().toISOString().slice(0, 10), outcome, ocrConfidence: ocr, livenessResult: liveness, faceMatchScore: face,
      failureReasons, provider: ID_PROVIDERS[Math.floor(Math.random() * ID_PROVIDERS.length)], notes: []
    };
    this.wResult = record;
    this.records = [record, ...this.records];
    this.wizardStep.set(3);
  }

  closeWizard() {
    this.wizardOpen.set(false);
    if (this.wResult) this.select(this.wResult);
  }
}
