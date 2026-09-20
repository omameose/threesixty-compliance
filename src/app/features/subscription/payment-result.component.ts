import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { Checkout, SubscriptionApiService } from '../../core/services/subscription-api.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

/**
 * Where a payment gateway sends the customer back to (/app/subscription/pay/<reference>). Nothing in the address or in what the
 * gateway appended is believed: this page asks our server, which asks the gateway, and shows what comes back. While the gateway
 * says "still processing" it asks again every few seconds, for up to two minutes, then tells the customer it will finish by itself.
 */
@Component({
  selector: 'app-payment-result',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
  <div class="max-w-xl mx-auto mt-10">
    <div class="card p-8 text-center" role="status">
      <ng-container *ngIf="state() === 'checking'">
        <div class="w-14 h-14 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto mb-5"></div>
        <h1 class="text-xl font-bold text-ink-950 mb-1">Confirming your payment</h1>
        <p class="muted">This usually takes a few seconds. Please do not close this page or pay again.</p>
      </ng-container>

      <ng-container *ngIf="state() === 'success'">
        <div class="w-14 h-14 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4"><app-icon name="check-circle" [size]="30"></app-icon></div>
        <h1 class="text-xl font-bold text-ink-950 mb-1">Payment received</h1>
        <p class="muted">Thank you. {{ checkout()?.description }} is now active on your account.</p>
        <p class="text-xs text-ink-400 mt-3">Reference <span class="font-mono">{{ reference }}</span> &middot; {{ checkout()?.amount | number: '1.2-2' }} {{ checkout()?.currency }}</p>
        <a routerLink="/app/subscription" class="btn-primary inline-block mt-6">Back to subscription</a>
      </ng-container>

      <ng-container *ngIf="state() === 'failed'">
        <div class="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4"><app-icon name="x" [size]="28"></app-icon></div>
        <h1 class="text-xl font-bold text-ink-950 mb-1">Payment not completed</h1>
        <p class="muted">{{ checkout()?.failureReason || 'The payment did not go through. You have not been charged, or any charge will be reversed by your bank.' }}</p>
        <p class="text-xs text-ink-400 mt-3">Reference <span class="font-mono">{{ reference }}</span></p>
        <a routerLink="/app/subscription" class="btn-primary inline-block mt-6">Try again</a>
      </ng-container>

      <ng-container *ngIf="state() === 'waiting'">
        <div class="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4"><app-icon name="clock" [size]="28"></app-icon></div>
        <h1 class="text-xl font-bold text-ink-950 mb-1">Still confirming</h1>
        <p class="muted">Your bank or the payment provider has not confirmed the payment yet. If you paid, your plan will update automatically as soon as it does; you do not need to pay again.</p>
        <p class="text-xs text-ink-400 mt-3">Reference <span class="font-mono">{{ reference }}</span></p>
        <div class="flex justify-center gap-3 mt-6">
          <button class="btn-secondary" (click)="restart()">Check again</button>
          <a routerLink="/app/subscription" class="btn-primary">Back to subscription</a>
        </div>
      </ng-container>

      <ng-container *ngIf="state() === 'error'">
        <h1 class="text-xl font-bold text-ink-950 mb-1">We could not check this payment</h1>
        <p class="text-red-700 text-sm" role="alert">{{ error() }}</p>
        <a routerLink="/app/subscription" class="btn-primary inline-block mt-6">Back to subscription</a>
      </ng-container>
    </div>
  </div>
  `
})
export class PaymentResultComponent implements OnInit, OnDestroy {
  /** Bound from the route parameter. */
  @Input() reference!: string;

  state = signal<'checking' | 'success' | 'failed' | 'waiting' | 'error'>('checking');
  checkout = signal<Checkout | null>(null);
  error = signal('');
  private timer?: ReturnType<typeof setTimeout>;
  private attempts = 0;
  private static readonly MAX_ATTEMPTS = 30;
  private static readonly INTERVAL_MS = 4000;

  constructor(private api: SubscriptionApiService) {}

  ngOnInit() {
    this.check();
  }

  ngOnDestroy() {
    clearTimeout(this.timer);
  }

  restart() {
    this.attempts = 0;
    this.state.set('checking');
    this.check();
  }

  private check() {
    this.api.verifyCheckout(this.reference).subscribe({
      next: c => {
        this.checkout.set(c);
        if (c.status === 'success') this.state.set('success');
        else if (c.status === 'failed' || c.status === 'abandoned') this.state.set('failed');
        else this.again();
      },
      error: (e: ApiError) => {
        // A dropped connection is not a failed payment: keep trying quietly, and only report a definite refusal.
        if (e.httpStatus === 0 || e.httpStatus >= 500) this.again();
        else {
          this.error.set(e.httpStatus === 404 ? 'This payment was not found on your account.' : e.userMessage);
          this.state.set('error');
        }
      }
    });
  }

  private again() {
    if (++this.attempts >= PaymentResultComponent.MAX_ATTEMPTS) {
      this.state.set('waiting');
      return;
    }
    this.timer = setTimeout(() => this.check(), PaymentResultComponent.INTERVAL_MS);
  }
}
