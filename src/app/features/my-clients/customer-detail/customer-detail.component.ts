import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DataService } from '../../../core/services/data.service';
import { Customer } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';

type ScanType = 'sanctions' | 'pep' | 'adverse-media';

interface IntelligenceEntry {
  type: 'Sanctions' | 'PEP' | 'Adverse Media';
  verdict: string;
  score: number;
  date: string;
  caseId: string;
  route: string;
}

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent, AvatarComponent, ModalComponent],
  templateUrl: './customer-detail.component.html'
})
export class CustomerDetailComponent implements OnInit {
  @Input() customerId!: string;
  customer?: Customer;
  loading = true;

  requestInfoModalOpen = signal(false);
  rejectModalOpen = signal(false);
  requestInfoNote = '';
  rejectReason = '';
  actionSuccess = signal<string | null>(null);

  intelligence: IntelligenceEntry[] = [];
  intelligenceLoading = true;
  runningScan = signal<ScanType | null>(null);

  constructor(private data: DataService, private location: Location) {}

  ngOnInit() {
    this.data.getCustomer(this.customerId).subscribe(c => {
      this.customer = c;
      this.loading = false;
      if (c) this.loadIntelligence(c);
    });
  }

  private dobFromAnswers(): string | undefined {
    return this.customer?.answers.find(a => a.label === 'Date of Birth')?.value;
  }

  loadIntelligence(customer: Customer) {
    this.intelligenceLoading = true;
    forkJoin({
      sanctions: this.data.getSanctionsCasesForCustomer(customer),
      pep: this.data.getPepCasesForCustomer(customer),
      adverseMedia: this.data.getAdverseMediaCasesForCustomer(customer)
    }).subscribe(({ sanctions, pep, adverseMedia }) => {
      const entries: IntelligenceEntry[] = [
        ...sanctions.map(c => ({ type: 'Sanctions' as const, verdict: c.verdict, score: c.matchScore, date: c.screenedAt, caseId: c.id, route: '/app/screening/sanctions' })),
        ...pep.map(c => ({ type: 'PEP' as const, verdict: c.verdict, score: c.confidenceScore, date: c.screenedAt, caseId: c.id, route: '/app/screening/pep' })),
        ...adverseMedia.map(c => ({ type: 'Adverse Media' as const, verdict: c.verdict, score: c.riskScore, date: c.screenedAt, caseId: c.id, route: '/app/screening/adverse-media' }))
      ];
      entries.sort((a, b) => b.date.localeCompare(a.date));
      this.intelligence = entries;
      this.intelligenceLoading = false;
    });
  }

  verdictBadge(verdict: string) {
    if (verdict === 'MATCH' || verdict === 'PEP_MATCH') return 'badge-red';
    if (verdict === 'POTENTIAL_MATCH' || verdict === 'POTENTIAL_PEP' || verdict === 'POTENTIAL_RISK') return 'badge-yellow';
    return 'badge-green';
  }

  runScan(type: ScanType) {
    if (!this.customer || this.runningScan()) return;
    this.runningScan.set(type);
    const c = this.customer;

    if (type === 'sanctions') {
      this.data.runSanctionsScreening({
        subjectName: c.fullName, subjectType: 'Individual', dob: this.dobFromAnswers(),
        nationality: c.country, country: c.country, identifiers: [c.complianceId], customerId: c.id
      }).subscribe(result => this.finishScan('Sanctions Screening', result.verdict));
    } else if (type === 'pep') {
      this.data.runPepScreening({ subjectName: c.fullName, customerId: c.id })
        .subscribe(result => this.finishScan('PEP Screening', result.verdict));
    } else {
      this.data.runAdverseMediaScreening({ subjectName: c.fullName, customerId: c.id })
        .subscribe(result => this.finishScan('Adverse Media Screening', result.verdict));
    }
  }

  private finishScan(label: string, verdict: string) {
    this.runningScan.set(null);
    if (this.customer) this.loadIntelligence(this.customer);
    this.actionSuccess.set(`${label} complete — result: ${verdict.replace('_', ' ')}.`);
    setTimeout(() => this.actionSuccess.set(null), 4000);
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

  goBack() { this.location.back(); }

  approve() {
    if (!this.customer) return;
    this.data.updateCustomerStatus(this.customer.id, 'approved').subscribe(() => {
      this.customer!.status = 'approved';
      this.actionSuccess.set('Customer approved. A webhook notification has been sent to your configured endpoint.');
      setTimeout(() => this.actionSuccess.set(null), 4000);
    });
  }

  confirmReject() {
    if (!this.customer) return;
    this.data.updateCustomerStatus(this.customer.id, 'rejected').subscribe(() => {
      this.customer!.status = 'rejected';
      this.rejectModalOpen.set(false);
      this.actionSuccess.set('Customer rejected. A webhook notification has been sent to your configured endpoint.');
      setTimeout(() => this.actionSuccess.set(null), 4000);
    });
  }

  confirmRequestInfo() {
    if (!this.customer) return;
    this.data.updateCustomerStatus(this.customer.id, 'more_info_required').subscribe(() => {
      this.customer!.status = 'more_info_required';
      this.requestInfoModalOpen.set(false);
      this.actionSuccess.set('An email has been sent to ' + this.customer!.email + ' requesting more information.');
      setTimeout(() => this.actionSuccess.set(null), 4000);
    });
  }

  downloadAnswer(fileName?: string) {
    if (!fileName) return;
    // Simulated download in this demo build.
    alert('Downloading ' + fileName + ' (simulated — connect your backend endpoint to enable real downloads).');
  }
}
