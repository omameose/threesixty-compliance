import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../../core/http/api.service';
import { ComplianceApiService } from '../../../core/services/compliance-api.service';
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
  error = signal('');
  acting = signal(false);

  intelligence: IntelligenceEntry[] = [];
  intelligenceLoading = true;
  runningScan = signal<ScanType | null>(null);

  constructor(private data: DataService, private api: ComplianceApiService, private location: Location) {}

  ngOnInit() {
    this.api.customer(this.customerId).subscribe({
      next: c => {
        this.customer = c;
        this.loading = false;
        this.loadIntelligence(c);
      },
      error: (e: ApiError) => { this.loading = false; this.error.set(e.userMessage); }
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

  /** Runs a decision call, then reloads the customer so status, timeline and reason come from the server. */
  private decide(call: () => import('rxjs').Observable<unknown>, success: string, after?: () => void) {
    if (!this.customer || this.acting()) return;
    this.acting.set(true);
    this.error.set('');
    call().subscribe({
      next: () => {
        this.acting.set(false);
        after?.();
        this.actionSuccess.set(success);
        setTimeout(() => this.actionSuccess.set(null), 4000);
        this.api.customer(this.customerId).subscribe({ next: c => this.customer = { ...c }, error: () => undefined });
      },
      error: (e: ApiError) => {
        this.acting.set(false);
        after?.();
        this.error.set(e.userMessage);
      }
    });
  }

  approve() {
    this.decide(() => this.api.approveCustomer(this.customer!.id), 'Customer approved. Your webhook endpoint (if set) has been notified.');
  }

  confirmReject() {
    const reason = this.rejectReason.trim();
    if (!reason) { this.error.set('Please give a reason for rejecting.'); return; }
    this.decide(() => this.api.rejectCustomer(this.customer!.id, reason), 'Customer rejected. Your webhook endpoint (if set) has been notified.', () => this.rejectModalOpen.set(false));
  }

  confirmRequestInfo() {
    const message = this.requestInfoNote.trim();
    if (!message) { this.error.set('Tell the customer what you need.'); return; }
    this.decide(() => this.api.requestCustomerInfo(this.customer!.id, message), 'An email has been sent to ' + this.customer!.email + ' asking for more information.', () => this.requestInfoModalOpen.set(false));
  }

  downloadAnswer(a: { fileId?: string; fileName?: string }) {
    if (!this.customer || !a.fileId) return;
    this.api.downloadCustomerFile(this.customer.id, a.fileId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = a.fileName || 'file';
        link.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('The file could not be downloaded.')
    });
  }
}
