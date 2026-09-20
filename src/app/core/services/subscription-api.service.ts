import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from '../http/api.service';
import { Invoice, Plan, Subscription } from '../models/models';

/** Sandbox gateway tokens. Real card details are entered in the payment provider's own form, never here. */
export type SandboxCard = 'approved' | 'declined' | 'insufficient';

export interface ChangePlanRequest {
  planId: string;
  billingCycle?: 'month' | 'year';
  paymentToken?: string;
}

/** `flow`: hosted = the customer is sent to the gateway's own page; card = the customer types the card on our checkout page. */
export interface GatewayOption { key: string; name: string; flow: 'hosted' | 'card'; }

/** A payment on a gateway's own page. `checkoutUrl` is only present while it can still be paid. */
export interface Checkout {
  reference: string; gateway: string; gatewayName: string; status: 'initiated' | 'pending' | 'success' | 'failed' | 'abandoned';
  checkoutUrl?: string; amount: number; currency: string; invoiceNumber: string; description?: string; failureReason?: string;
  planUpdated: boolean; createdAt: string;
  flow: 'hosted' | 'card';
  /** Card payments only: the step the bank is waiting for. */
  authorizationType?: 'OTP' | 'PIN' | 'AVS' | 'REDIRECT' | null;
  authorizationLink?: string | null;
  /** True once a card has been sent for this payment (it can only be sent once). */
  cardSubmitted: boolean;
}

/** What the customer typed on the card page. Sent once over the encrypted connection; the server encrypts it for the gateway. */
export interface CardForm {
  cardHolderName: string; cardNumber: string; expiryMonth: string; expiryYear: string; cvv: string;
  firstName: string; middleName?: string; lastName: string; dialCode: string; phone: string;
  country: string; countryName: string; state: string; city: string; postalCode: string; line1: string; line2?: string;
}

export interface AuthorizeForm {
  authorizationType: 'OTP' | 'PIN' | 'AVS';
  otp?: string; pin?: string;
  country?: string; countryName?: string; state?: string; city?: string; postalCode?: string; line1?: string; line2?: string;
}

/** `outcome`: needs_authorization, redirect, submitted, retry, declined or unknown. */
export interface CardStep {
  checkout: Checkout;
  outcome: 'needs_authorization' | 'redirect' | 'submitted' | 'retry' | 'declined' | 'unknown';
  message: string;
}

interface PlanDto {
  id: string; name: string; price: number; annualPrice?: number | null; billingCycle: 'month' | 'year'; currency: string;
  description: string; verificationsIncluded: number; overagePrice: number; features: string[]; highlighted: boolean;
  customPricing: boolean; trialDays: number;
}

interface SubscriptionDto {
  planId: string; status: Subscription['status']; billingCycle: 'month' | 'year'; renewsAt: string | null; trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean; pendingPlanId: string | null; seats: number; usage: { used: number; included: number };
  currency: string; paymentMethod: Subscription['paymentMethod']; failedAttempts: number; nextRetryAt: string | null;
  nextChargeAmount: number | null;
}

interface InvoiceDto {
  id: string; date: string; amount: number; status: Invoice['status']; plan: string; invoiceUrl: string;
}

/**
 * The company's subscription and billing (subscription-service). Anything that moves money carries an Idempotency-Key: the caller
 * creates ONE key when the user opens the confirmation and reuses it for every retry of that same action, so a double click, a
 * slow network or a retry can never charge twice. Use a NEW key for a new decision.
 */
@Injectable({ providedIn: 'root' })
export class SubscriptionApiService {
  constructor(private api: ApiService) {}

  static newIdempotencyKey(): string {
    return crypto.randomUUID();
  }

  /** A sandbox token for the chosen test card (the backend's sandbox gateway understands these). */
  static sandboxToken(card: SandboxCard): string {
    const random = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    return card === 'declined' ? `tok_visa_decline${random}` : card === 'insufficient' ? `tok_visa_funds${random}` : `tok_visa_good${random}`;
  }

  getPlans(): Observable<Plan[]> {
    return this.api.get<PlanDto[]>('/subscription/plans').pipe(map(list => list.map(p => ({ ...p, price: Number(p.price), overagePrice: Number(p.overagePrice) }))));
  }

  getSubscription(): Observable<Subscription> {
    return this.api.get<SubscriptionDto>('/subscription').pipe(
      map(s => ({
        planId: s.planId,
        status: s.status,
        renewsAt: s.renewsAt ? s.renewsAt.slice(0, 10) : '',
        trialEndsAt: s.trialEndsAt ? s.trialEndsAt.slice(0, 10) : undefined,
        seats: s.seats,
        usage: { used: s.usage.used, included: s.usage.included },
        billingCycle: s.billingCycle,
        cancelAtPeriodEnd: s.cancelAtPeriodEnd,
        pendingPlanId: s.pendingPlanId,
        paymentMethod: s.paymentMethod,
        failedAttempts: s.failedAttempts,
        nextRetryAt: s.nextRetryAt,
        nextChargeAmount: s.nextChargeAmount,
        currency: s.currency
      }))
    );
  }

  /** Company admins only (level 6+). */
  getInvoices(): Observable<Invoice[]> {
    return this.api.get<{ items: InvoiceDto[] }>('/subscription/invoices', { params: { size: 50 } }).pipe(
      map(page => page.items.map(i => ({ id: i.id, date: i.date, amount: Number(i.amount), status: i.status, plan: i.plan, invoiceUrl: '#' })))
    );
  }

  /** Upgrades charge now, downgrades wait for the period end. The idempotencyKey MUST be reused when retrying the same action. */
  changePlan(request: ChangePlanRequest, idempotencyKey: string): Observable<Subscription> {
    return this.api.post<SubscriptionDto>('/subscription/change-plan', request, { headers: { 'Idempotency-Key': idempotencyKey } }).pipe(
      map(() => undefined as unknown as Subscription)
    );
  }

  /** The ways to pay on a gateway's page that are switched on for this environment. */
  getGateways(): Observable<GatewayOption[]> {
    return this.api.get('/subscription/gateways');
  }

  /** Starts a payment on a gateway's page. Reuse the same key when retrying the same action. */
  startCheckout(request: { planId: string; billingCycle: 'month' | 'year'; gateway: string }, idempotencyKey: string): Observable<Checkout> {
    return this.api.post<Checkout>('/subscription/checkout', request, { headers: { 'Idempotency-Key': idempotencyKey } });
  }

  /** Asks the gateway (through our server) how the payment went. Safe to call repeatedly. */
  verifyCheckout(reference: string): Observable<Checkout> {
    return this.api.post<Checkout>(`/subscription/checkout/${encodeURIComponent(reference)}/verify`, {});
  }

  /** Stored state of a payment, no call to the gateway. */
  getCheckout(reference: string): Observable<Checkout> {
    return this.api.get<Checkout>(`/subscription/checkout/${encodeURIComponent(reference)}`);
  }

  /** Card gateways: sends the card. Allowed once per payment. */
  submitCard(reference: string, card: CardForm): Observable<CardStep> {
    return this.api.post<CardStep>(`/subscription/checkout/${encodeURIComponent(reference)}/card`, card);
  }

  /** Card gateways: the OTP, PIN or address the bank asked for. */
  authorizeCard(reference: string, step: AuthorizeForm): Observable<CardStep> {
    return this.api.post<CardStep>(`/subscription/checkout/${encodeURIComponent(reference)}/authorize`, step);
  }

  cancelCheckout(reference: string): Observable<Checkout> {
    return this.api.post<Checkout>(`/subscription/checkout/${encodeURIComponent(reference)}/cancel`, {});
  }

  cancel(idempotencyKey: string): Observable<void> {
    return this.api.post<void>('/subscription/cancel', {}, { headers: { 'Idempotency-Key': idempotencyKey } });
  }

  resume(idempotencyKey: string): Observable<void> {
    return this.api.post<void>('/subscription/resume', {}, { headers: { 'Idempotency-Key': idempotencyKey } });
  }
}
