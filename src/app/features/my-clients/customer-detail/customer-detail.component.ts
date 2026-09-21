import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ApiError } from '../../../core/http/api.service';
import { ComplianceApiService } from '../../../core/services/compliance-api.service';
import { AiApiService, ProfileAnalysis, ScreeningResult } from '../../../core/services/ai-api.service';
import { Customer } from '../../../core/models/models';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';


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

  profile = signal<ProfileAnalysis | null>(null);
  profileError = signal('');
  screening = signal(false);
  screenResult = signal<ScreeningResult | null>(null);
  screenError = signal('');

  constructor(private ai: AiApiService, private api: ComplianceApiService, private location: Location, public auth: AuthService) {}

  ngOnInit() {
    this.api.customer(this.customerId).subscribe({
      next: c => {
        this.customer = c;
        this.loading = false;
        this.loadProfile(c);
      },
      error: (e: ApiError) => { this.loading = false; this.error.set(e.userMessage); }
    });
  }

  /** The customer's data quality, identity consistency and document coverage, worked out from what they submitted and the checks run on them. */
  private loadProfile(c: Customer) {
    if (!this.auth.hasMinRole(2)) return;
    this.ai.profile({
      customer: { id: c.id, fullName: c.fullName, email: c.email, phone: c.phone || undefined, country: c.country || undefined, formName: c.formName },
      verifications: (c.verifications ?? []).map(v => ({ type: v.type, status: v.status, matchScore: v.matchScore ?? undefined })),
      documents: c.answers.filter(a => a.fileName).map(a => ({ type: a.label, name: a.fileName, status: 'submitted' })),
      requiredDocuments: [],
      history: { previousSubmissions: 0, previousRejections: 0 }
    }).subscribe({ next: p => this.profile.set(p), error: (e: ApiError) => this.profileError.set(e.userMessage) });
  }

  /** Screens this customer's name against the loaded watchlist (a demonstration list unless a real one is configured on the server). */
  screenCustomer() {
    const c = this.customer;
    if (!c || this.screening()) return;
    this.screening.set(true);
    this.screenError.set('');
    this.ai.screen({ name: c.fullName, country: c.country || undefined, threshold: 0.85 }).subscribe({
      next: r => { this.screening.set(false); this.screenResult.set(r); },
      error: (e: ApiError) => { this.screening.set(false); this.screenError.set(e.userMessage); }
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
