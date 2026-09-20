import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
import { AuthService } from '../../core/services/auth.service';
import { GatewayOption, SandboxCard, SubscriptionApiService } from '../../core/services/subscription-api.service';
import { Invoice, Plan, Subscription } from '../../core/models/models';
import { environment } from '../../../environments/environment';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent],
  templateUrl: './subscription.component.html'
})
export class SubscriptionComponent implements OnInit {
  plans: Plan[] = [];
  subscription?: Subscription;
  invoices: Invoice[] = [];
  loading = true;
  loadError = '';
  changeModalOpen = signal(false);
  cancelModalOpen = signal(false);
  targetPlan?: Plan;
  billingCycle: 'month' | 'year' = 'month';
  sandboxCard: SandboxCard = 'approved';
  useNewCard = false;
  gateways: GatewayOption[] = [];
  /** 'card' (saved or test card) or the key of a gateway whose own page takes the payment. */
  payWith = 'card';
  /** Test cards only exist outside production. */
  readonly testCardsAvailable = !environment.production;

  /** True while a payment request is in flight: every button that could send another one is disabled. */
  submitting = signal(false);
  actionError = signal('');
  notice = signal('');
  /** One key per user decision. It is created when the confirmation opens and reused if the request has to be retried. */
  private idempotencyKey = '';

  constructor(private api: SubscriptionApiService, public auth: AuthService) {}

  get canManage(): boolean {
    return this.auth.hasMinRole(6);
  }

  ngOnInit() {
    this.api.getGateways().subscribe({ next: g => (this.gateways = g), error: () => (this.gateways = []) });
    this.reload();
  }

  reload() {
    this.loading = true;
    this.api.getPlans().subscribe({ next: p => (this.plans = p), error: (e: ApiError) => (this.loadError = e.userMessage) });
    this.api.getSubscription().subscribe({
      next: s => {
        this.subscription = s;
        this.loading = false;
      },
      error: (e: ApiError) => {
        this.loadError = e.userMessage;
        this.loading = false;
      }
    });
    if (this.canManage) {
      this.api.getInvoices().subscribe({ next: i => (this.invoices = i), error: () => (this.invoices = []) });
    }
  }

  currentPlan() {
    return this.plans.find(p => p.id === this.subscription?.planId);
  }

  usagePercent() {
    const u = this.subscription?.usage;
    if (!u || u.included <= 0) return 0;
    return Math.min(100, Math.round((u.used / u.included) * 100));
  }

  priceLabel(plan: Plan): string {
    const price = this.billingCycle === 'year' && plan.annualPrice ? plan.annualPrice : plan.price;
    return `$${price}`;
  }

  openChange(plan: Plan) {
    if (plan.customPricing) {
      window.location.href = 'mailto:sales@360compliance.io?subject=' + encodeURIComponent('Enterprise plan enquiry');
      return;
    }
    this.targetPlan = plan;
    this.billingCycle = this.subscription?.billingCycle ?? 'month';
    this.useNewCard = !this.subscription?.paymentMethod;
    this.sandboxCard = 'approved';
    this.payWith = this.gateways.length ? this.gateways[0].key : 'card';
    this.actionError.set('');
    this.idempotencyKey = SubscriptionApiService.newIdempotencyKey();
    this.changeModalOpen.set(true);
  }

  /** Moving to a cheaper plan is scheduled for the end of the period and needs no payment now. */
  isDowngrade(): boolean {
    const cur = this.currentPlan();
    if (!cur || !this.targetPlan || cur.id === 'free') return false;
    const price = (p: Plan) => (this.billingCycle === 'year' && p.annualPrice ? p.annualPrice / 12 : p.price);
    return price(this.targetPlan) < price(cur);
  }

  usesGateway(): boolean {
    return this.payWith !== 'card' && !this.isDowngrade();
  }

  confirmChange() {
    if (!this.targetPlan || this.submitting()) return;
    if (this.usesGateway()) {
      this.payOnGateway();
      return;
    }
    this.submitting.set(true);
    this.actionError.set('');
    const paymentToken = this.useNewCard || !this.subscription?.paymentMethod ? SubscriptionApiService.sandboxToken(this.sandboxCard) : undefined;
    this.api.changePlan({ planId: this.targetPlan.id, billingCycle: this.billingCycle, paymentToken }, this.idempotencyKey).subscribe({
      next: () => {
        this.submitting.set(false);
        this.changeModalOpen.set(false);
        this.notice.set(`Your plan request for ${this.targetPlan?.name} was processed.`);
        this.reload();
      },
      error: (e: ApiError) => {
        this.submitting.set(false);
        this.actionError.set(this.describe(e));
        // A definite refusal (declined card, plan unavailable) needs a NEW key for the next attempt; a 409 or a network error
        // means the outcome may not be known yet, so the same key stays and a retry can only ever replay or complete it.
        if (e.httpStatus === 402 || e.httpStatus === 400) this.idempotencyKey = SubscriptionApiService.newIdempotencyKey();
      }
    });
  }

  /** Sends the customer to the gateway's own page. Nothing changes here: the plan only changes once the gateway confirms the payment. */
  private payOnGateway() {
    this.submitting.set(true);
    this.actionError.set('');
    this.api.startCheckout({ planId: this.targetPlan!.id, billingCycle: this.billingCycle, gateway: this.payWith }, this.idempotencyKey).subscribe({
      next: c => {
        if (c.checkoutUrl) {
          window.location.href = c.checkoutUrl;
        } else {
          this.submitting.set(false);
          this.changeModalOpen.set(false);
          this.notice.set(c.status === 'success' ? 'That payment was already completed.' : 'That payment attempt has ended. Please start again.');
          this.reload();
        }
      },
      error: (e: ApiError) => {
        this.submitting.set(false);
        this.actionError.set(this.describe(e));
        if (e.httpStatus === 400 || e.httpStatus === 402 || e.httpStatus === 503) this.idempotencyKey = SubscriptionApiService.newIdempotencyKey();
      }
    });
  }

  openCancel() {
    this.actionError.set('');
    this.idempotencyKey = SubscriptionApiService.newIdempotencyKey();
    this.cancelModalOpen.set(true);
  }

  confirmCancel() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.api.cancel(this.idempotencyKey).subscribe({
      next: () => {
        this.submitting.set(false);
        this.cancelModalOpen.set(false);
        this.notice.set('Your plan will end when the current period does.');
        this.reload();
      },
      error: (e: ApiError) => {
        this.submitting.set(false);
        this.actionError.set(this.describe(e));
      }
    });
  }

  resume() {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.api.resume(SubscriptionApiService.newIdempotencyKey()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notice.set('Your plan will continue as normal.');
        this.reload();
      },
      error: (e: ApiError) => {
        this.submitting.set(false);
        this.notice.set('');
        this.loadError = this.describe(e);
      }
    });
  }

  private describe(e: ApiError): string {
    if (e.httpStatus === 409) return 'A payment for your account is already being processed. Please wait a moment and check your billing history before trying again.';
    if (e.httpStatus === 402) return e.userMessage;
    if (e.httpStatus === 403) return 'Only company admins can change the plan or billing details.';
    return e.userMessage;
  }
}
