import { CommonModule } from '@angular/common';
import { Component, Input, OnDestroy, OnInit, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { AuthService } from '../../core/services/auth.service';
import { AuthorizeForm, CardStep, Checkout, SubscriptionApiService } from '../../core/services/subscription-api.service';
import { CountryOption, UtilService } from '../../core/services/util.service';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { DIAL_CODES } from './dial-codes';

type Brand = 'visa' | 'mastercard' | 'amex' | 'verve' | 'discover' | 'card';

const BRANDS: { brand: Brand; label: string; test: RegExp; lengths: number[]; cvv: number }[] = [
  { brand: 'visa', label: 'VISA', test: /^4/, lengths: [13, 16, 19], cvv: 3 },
  { brand: 'verve', label: 'VERVE', test: /^(506(0(99|[1-9]\d)|1([0-8]\d|9[0-8]))|650(00[2-9]|01\d|02[0-7]))/, lengths: [16, 18, 19], cvv: 3 },
  { brand: 'mastercard', label: 'MASTERCARD', test: /^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/, lengths: [16], cvv: 3 },
  { brand: 'amex', label: 'AMEX', test: /^3[47]/, lengths: [15], cvv: 4 },
  { brand: 'discover', label: 'DISCOVER', test: /^(6011|65|64[4-9])/, lengths: [16, 19], cvv: 3 }
];

function luhn(digits: string): boolean {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = digits.charCodeAt(i) - 48;
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

/**
 * The card payment page for gateways that take the card on our own screen (GlobalPay). Everything typed here goes to our server over
 * the encrypted connection in one request; the server encrypts the card for the gateway and never stores it. This page keeps the card
 * only in the form fields, wipes them as soon as the request is sent, and never writes them to storage, the address bar or the console.
 * A card can be sent once per payment: if the bank refuses it, the customer starts a fresh payment (a new reference).
 */
@Component({
  selector: 'app-card-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, IconComponent],
  styles: [`
    .scene { perspective: 1200px; }
    .card3d { position: relative; transform-style: preserve-3d; transition: transform .7s cubic-bezier(.2,.8,.2,1); }
    .card3d.flipped { transform: rotateY(180deg); }
    .face { position: absolute; inset: 0; backface-visibility: hidden; -webkit-backface-visibility: hidden; border-radius: 1.1rem; overflow: hidden; }
    .back { transform: rotateY(180deg); }
    .sheen::after { content: ''; position: absolute; inset: 0; background: linear-gradient(115deg, transparent 30%, rgba(255,255,255,.18) 45%, transparent 60%); pointer-events: none; }
    .digit { transition: opacity .15s, transform .15s; }
    input.field-error, select.field-error { border-color: #ef4444; }
  `],
  template: `
  <div class="max-w-5xl mx-auto">
    <a routerLink="/app/subscription" class="inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-800 mb-4">
      <app-icon name="arrow-left" [size]="14"></app-icon> Back to plans
    </a>

    <div *ngIf="loadError()" class="card p-8 text-center" role="alert">
      <h1 class="text-xl font-bold text-ink-950 mb-1">We could not open this payment</h1>
      <p class="text-red-700 text-sm">{{ loadError() }}</p>
      <a routerLink="/app/subscription" class="btn-primary inline-block mt-5">Back to subscription</a>
    </div>

    <div class="grid lg:grid-cols-[1fr_1.25fr] gap-6" *ngIf="checkout() as co">

      <!-- ORDER SUMMARY -->
      <aside class="card p-6 lg:p-7 h-fit bg-gradient-to-b from-brand-50/60 to-white">
        <p class="text-xs font-semibold tracking-wide text-brand-700 uppercase mb-2">Order summary</p>
        <h1 class="text-xl font-bold text-ink-950">{{ co.description || 'Plan subscription' }}</h1>
        <p class="muted mt-1">Invoice {{ co.invoiceNumber }}</p>

        <div class="mt-6 pt-5 border-t border-ink-100 flex items-end justify-between">
          <span class="text-sm text-ink-600">Total due today</span>
          <span class="text-3xl font-extrabold text-ink-950">{{ co.amount | number: '1.2-2' }} <span class="text-base font-semibold text-ink-500">{{ co.currency }}</span></span>
        </div>

        <ul class="mt-6 space-y-3 text-sm text-ink-600">
          <li class="flex gap-2"><app-icon name="lock" [size]="16" class="text-brand-600 shrink-0 mt-0.5"></app-icon>
            <span>Your card is encrypted before it leaves our server and is <strong>never stored</strong>.</span></li>
          <li class="flex gap-2"><app-icon name="shield" [size]="16" class="text-brand-600 shrink-0 mt-0.5"></app-icon>
            <span>Payments are processed by {{ co.gatewayName }}. Your bank may ask you to confirm with a code.</span></li>
          <li class="flex gap-2"><app-icon name="check-circle" [size]="16" class="text-brand-600 shrink-0 mt-0.5"></app-icon>
            <span>Your plan updates as soon as the payment is confirmed.</span></li>
        </ul>
        <p class="text-xs text-ink-400 mt-6">Reference <span class="font-mono">{{ co.reference }}</span></p>
      </aside>

      <!-- PAYMENT -->
      <section class="card p-5 sm:p-7">

        <!-- final states -->
        <ng-container *ngIf="stage() === 'declined'">
          <div class="text-center py-6">
            <div class="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4"><app-icon name="x" [size]="28"></app-icon></div>
            <h2 class="text-xl font-bold text-ink-950 mb-1">Payment not completed</h2>
            <p class="muted" role="alert">{{ message() || checkout()?.failureReason }}</p>
            <p class="text-xs text-ink-400 mt-2">You have not been charged. Each attempt uses its own payment, so start again to try another card.</p>
            <a routerLink="/app/subscription" class="btn-primary inline-block mt-6">Start again</a>
          </div>
        </ng-container>

        <ng-container *ngIf="stage() === 'redirecting'">
          <div class="text-center py-10">
            <div class="w-14 h-14 rounded-full border-4 border-brand-200 border-t-brand-600 animate-spin mx-auto mb-5"></div>
            <h2 class="text-xl font-bold text-ink-950 mb-1">Taking you to your bank</h2>
            <p class="muted">Your bank will ask you to confirm this payment, then bring you back here.</p>
          </div>
        </ng-container>

        <!-- step 2: whatever the bank asks for -->
        <ng-container *ngIf="stage() === 'authorize'">
          <div class="flex items-center gap-3 mb-5">
            <div class="w-10 h-10 rounded-full bg-brand-50 text-brand-700 flex items-center justify-center"><app-icon name="shield" [size]="20"></app-icon></div>
            <div>
              <h2 class="text-lg font-bold text-ink-950">Confirm with your bank</h2>
              <p class="muted">Step 2 of 2 &middot; your card was accepted for checking</p>
            </div>
          </div>

          <div *ngIf="message()" class="mb-4 p-3 rounded-lg text-sm" [ngClass]="stepError() ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-800'" [attr.role]="stepError() ? 'alert' : 'status'">{{ message() }}</div>

          <div *ngIf="authType() === 'OTP'">
            <label class="label" for="otp">One-time code</label>
            <p class="text-xs text-ink-500 mb-2">Enter the code sent to your phone or email by your bank.</p>
            <input id="otp" class="input text-center text-2xl tracking-[.5em] font-semibold" inputmode="numeric" autocomplete="one-time-code" maxlength="10"
                   [value]="otp" (input)="otp = clean($event, 10)" placeholder="------" [disabled]="busy()"/>
          </div>

          <div *ngIf="authType() === 'PIN'">
            <label class="label" for="pin">Card PIN</label>
            <p class="text-xs text-ink-500 mb-2">Enter the 4-digit PIN of this card.</p>
            <input id="pin" class="input text-center text-2xl tracking-[.7em] font-semibold" type="password" inputmode="numeric" autocomplete="off" maxlength="4"
                   [value]="pin" (input)="pin = clean($event, 4)" placeholder="••••" [disabled]="busy()"/>
          </div>

          <div *ngIf="authType() === 'AVS'" class="grid sm:grid-cols-2 gap-3">
            <p class="sm:col-span-2 text-xs text-ink-500">Enter the billing address your bank has on file for this card.</p>
            <div class="sm:col-span-2"><label class="label" for="a-line1">Address</label><input id="a-line1" class="input" [(ngModel)]="avs.line1" autocomplete="address-line1"/></div>
            <div><label class="label" for="a-city">City</label><input id="a-city" class="input" [(ngModel)]="avs.city" autocomplete="address-level2"/></div>
            <div><label class="label" for="a-state">State</label><input id="a-state" class="input" [(ngModel)]="avs.state" autocomplete="address-level1"/></div>
            <div><label class="label" for="a-postal">Postal code</label><input id="a-postal" class="input" [(ngModel)]="avs.postalCode" autocomplete="postal-code"/></div>
            <div><label class="label" for="a-country">Country</label>
              <select id="a-country" class="input" [(ngModel)]="avs.country" (ngModelChange)="avs.countryName = countryName(avs.country)">
                <option *ngFor="let c of countries()" [value]="c.code">{{ c.name }}</option></select></div>
          </div>

          <button class="btn-primary w-full py-3 mt-5 text-base" [disabled]="busy() || !canAuthorize()" (click)="authorize()">
            <span *ngIf="!busy()">Confirm payment</span><span *ngIf="busy()">Confirming...</span>
          </button>
        </ng-container>

        <!-- step 1: the card -->
        <ng-container *ngIf="stage() === 'card'">
          <!-- live card preview -->
          <div class="scene mb-6 mx-auto" style="max-width: 360px;">
            <div class="card3d" [class.flipped]="flipped()" style="height: 210px;">
              <div class="face sheen text-white p-5 flex flex-col justify-between shadow-xl" [ngClass]="gradient()">
                <div class="flex items-start justify-between">
                  <!-- chip -->
                  <svg width="44" height="34" viewBox="0 0 44 34" aria-hidden="true"><rect width="44" height="34" rx="6" fill="#f5d77a"/><path d="M0 12h44M0 22h44M15 0v34M29 0v34" stroke="#c9a94a" stroke-width="1.2" fill="none"/></svg>
                  <span class="text-lg font-black italic tracking-wider drop-shadow">{{ brand().label }}</span>
                </div>
                <div class="font-mono text-[1.35rem] tracking-[.12em] drop-shadow">{{ previewNumber() }}</div>
                <div class="flex items-end justify-between text-xs uppercase">
                  <div class="min-w-0"><p class="opacity-70 text-[10px] tracking-widest">Card holder</p><p class="font-semibold text-sm truncate max-w-[210px]">{{ holder || 'Your name' }}</p></div>
                  <div class="text-right"><p class="opacity-70 text-[10px] tracking-widest">Expires</p><p class="font-semibold text-sm font-mono">{{ previewExpiry() }}</p></div>
                </div>
              </div>
              <div class="face back text-white shadow-xl" [ngClass]="gradient()">
                <div class="h-10 bg-black/70 mt-6"></div>
                <div class="px-5 mt-5"><div class="bg-white/90 rounded h-9 flex items-center justify-end px-3">
                  <span class="font-mono text-ink-900 text-base tracking-widest">{{ cvvMask() }}</span></div>
                  <p class="text-[10px] opacity-70 mt-2">Security code (CVV)</p></div>
              </div>
            </div>
          </div>

          <div *ngIf="message()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ message() }}</div>

          <form (ngSubmit)="pay()" novalidate autocomplete="on">
            <h2 class="section-title text-base mb-3">Card details</h2>
            <div class="grid grid-cols-2 gap-3 mb-6">
              <div class="col-span-2">
                <label class="label" for="cc-number">Card number</label>
                <div class="relative">
                  <input id="cc-number" name="cc-number" class="input pr-16 font-mono tracking-wide" [class.field-error]="showErr('number')" inputmode="numeric" autocomplete="cc-number"
                         spellcheck="false" autocapitalize="off" placeholder="1234 5678 9012 3456" [value]="numberText" (input)="onNumber($event)" (blur)="touch('number')" [disabled]="busy()"/>
                  <span class="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold tracking-wide text-ink-400">{{ brand().brand === 'card' ? '' : brand().label }}</span>
                </div>
                <p class="text-xs text-red-600 mt-1" *ngIf="showErr('number')">{{ errors().number }}</p>
              </div>
              <div class="col-span-2">
                <label class="label" for="cc-name">Name on card</label>
                <input id="cc-name" name="cc-name" class="input" [class.field-error]="showErr('holder')" autocomplete="cc-name" spellcheck="false" [(ngModel)]="holder" (ngModelChange)="onEdit()" (blur)="touch('holder')" [disabled]="busy()"/>
                <p class="text-xs text-red-600 mt-1" *ngIf="showErr('holder')">{{ errors().holder }}</p>
              </div>
              <div>
                <label class="label" for="cc-exp">Expiry (MM/YY)</label>
                <input id="cc-exp" name="cc-exp" class="input font-mono" [class.field-error]="showErr('expiry')" inputmode="numeric" autocomplete="cc-exp" placeholder="MM/YY" maxlength="5"
                       [value]="expiryText" (input)="onExpiry($event)" (blur)="touch('expiry')" [disabled]="busy()"/>
                <p class="text-xs text-red-600 mt-1" *ngIf="showErr('expiry')">{{ errors().expiry }}</p>
              </div>
              <div>
                <label class="label" for="cc-csc">Security code</label>
                <input id="cc-csc" name="cc-csc" class="input font-mono" [class.field-error]="showErr('cvv')" type="password" inputmode="numeric" autocomplete="cc-csc" [attr.maxlength]="brand().cvv"
                       placeholder="{{ brand().cvv === 4 ? '••••' : '•••' }}" [value]="cvv" (input)="cvv = clean($event, brand().cvv)" (focus)="flipped.set(true)" (blur)="flipped.set(false); touch('cvv')" [disabled]="busy()"/>
                <p class="text-xs text-red-600 mt-1" *ngIf="showErr('cvv')">{{ errors().cvv }}</p>
              </div>
            </div>

            <h2 class="section-title text-base mb-3">Billing details</h2>
            <div class="grid grid-cols-2 gap-3 mb-6">
              <div><label class="label" for="b-first">First name</label><input id="b-first" class="input" [class.field-error]="showErr('firstName')" autocomplete="given-name" [(ngModel)]="firstName" (ngModelChange)="onEdit()" name="b-first" (blur)="touch('firstName')" [disabled]="busy()"/></div>
              <div><label class="label" for="b-last">Last name</label><input id="b-last" class="input" [class.field-error]="showErr('lastName')" autocomplete="family-name" [(ngModel)]="lastName" (ngModelChange)="onEdit()" name="b-last" (blur)="touch('lastName')" [disabled]="busy()"/></div>
              <div class="col-span-2">
                <label class="label" for="b-phone">Phone</label>
                <div class="flex gap-2">
                  <select class="input !w-44 shrink-0" aria-label="Country code" [(ngModel)]="dial" name="b-dial" [disabled]="busy()">
                    <option *ngFor="let d of dialCodes" [value]="d.dial">{{ d.dial }} {{ d.country }}</option></select>
                  <input id="b-phone" class="input" [class.field-error]="showErr('phone')" inputmode="tel" autocomplete="tel-national" [(ngModel)]="phone" (ngModelChange)="onEdit()" name="b-phone" (blur)="touch('phone')" placeholder="8012345678" [disabled]="busy()"/>
                </div>
                <p class="text-xs text-red-600 mt-1" *ngIf="showErr('phone')">{{ errors().phone }}</p>
              </div>
              <div class="col-span-2"><label class="label" for="b-line1">Address</label><input id="b-line1" class="input" [class.field-error]="showErr('line1')" autocomplete="address-line1" [(ngModel)]="line1" (ngModelChange)="onEdit()" name="b-line1" (blur)="touch('line1')" [disabled]="busy()"/></div>
              <div class="col-span-2"><label class="label" for="b-line2">Address line 2 <span class="text-ink-400 font-normal">(optional)</span></label><input id="b-line2" class="input" autocomplete="address-line2" [(ngModel)]="line2" name="b-line2" [disabled]="busy()"/></div>
              <div><label class="label" for="b-city">City</label><input id="b-city" class="input" [class.field-error]="showErr('city')" autocomplete="address-level2" [(ngModel)]="city" (ngModelChange)="onEdit()" name="b-city" (blur)="touch('city')" [disabled]="busy()"/></div>
              <div><label class="label" for="b-state">State / region</label><input id="b-state" class="input" [class.field-error]="showErr('state')" autocomplete="address-level1" [(ngModel)]="state" (ngModelChange)="onEdit()" name="b-state" (blur)="touch('state')" [disabled]="busy()"/></div>
              <div><label class="label" for="b-postal">Postal code</label><input id="b-postal" class="input" [class.field-error]="showErr('postalCode')" autocomplete="postal-code" [(ngModel)]="postalCode" (ngModelChange)="onEdit()" name="b-postal" (blur)="touch('postalCode')" [disabled]="busy()"/></div>
              <div><label class="label" for="b-country">Country</label>
                <select id="b-country" class="input" [class.field-error]="showErr('country')" autocomplete="country" [(ngModel)]="country" (ngModelChange)="onEdit()" name="b-country" [disabled]="busy()">
                  <option value="">Select...</option><option *ngFor="let c of countries()" [value]="c.code">{{ c.name }}</option></select></div>
            </div>

            <button type="submit" class="btn-primary w-full py-3.5 text-base gap-2" [disabled]="busy()">
              <app-icon name="lock" [size]="17"></app-icon>
              <span *ngIf="!busy()">Pay {{ co.amount | number: '1.2-2' }} {{ co.currency }}</span>
              <span *ngIf="busy()">Processing securely...</span>
            </button>
            <p class="text-center text-xs text-ink-400 mt-3">By paying you agree to be charged {{ co.amount | number: '1.2-2' }} {{ co.currency }} for this plan.</p>
          </form>
        </ng-container>
      </section>
    </div>

    <div *ngIf="!checkout() && !loadError()" class="card p-10 text-center muted">Preparing your secure payment...</div>
  </div>
  `
})
export class CardCheckoutComponent implements OnInit, OnDestroy {
  /** Bound from the route parameter. */
  @Input() reference!: string;

  readonly dialCodes = DIAL_CODES;
  checkout = signal<Checkout | null>(null);
  loadError = signal('');
  stage = signal<'loading' | 'card' | 'authorize' | 'redirecting' | 'declined'>('loading');
  busy = signal(false);
  message = signal('');
  stepError = signal(false);
  flipped = signal(false);
  countries = signal<CountryOption[]>([]);
  authType = signal<'OTP' | 'PIN' | 'AVS' | null>(null);
  private touched = new Set<string>();

  // card (wiped after every submission)
  numberText = '';
  holder = '';
  expiryText = '';
  cvv = '';
  // billing (kept: it is not secret and helps a retry)
  firstName = '';
  lastName = '';
  dial = '+234';
  phone = '';
  country = 'NG';
  state = '';
  city = '';
  postalCode = '';
  line1 = '';
  line2 = '';
  // bank steps
  otp = '';
  pin = '';
  avs = { line1: '', city: '', state: '', postalCode: '', country: 'NG', countryName: 'Nigeria' };

  private digitsOnly = () => this.numberText.replace(/\D/g, '');
  brand = computed(() => this.brandOf(this.numberSig()));
  private numberSig = signal('');
  errors = signal<Record<string, string>>({});

  constructor(private api: SubscriptionApiService, private util: UtilService, private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.util.countries$.subscribe({ next: c => this.countries.set(c), error: () => undefined });
    const u = this.auth.currentUser();
    if (u) {
      this.firstName = u.firstName ?? '';
      this.lastName = u.lastName ?? '';
      this.holder = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    }
    this.api.getCheckout(this.reference).subscribe({
      next: c => this.enter(c),
      error: (e: ApiError) => this.loadError.set(e.httpStatus === 404 ? 'This payment was not found on your account.' : e.userMessage)
    });
  }

  ngOnDestroy() {
    this.wipeCard();
  }

  /** Decides what to show from where the payment stands, so a refresh or a return visit lands on the right step. */
  private enter(c: Checkout) {
    this.checkout.set(c);
    if (c.flow !== 'card') {
      this.router.navigate(['/app/subscription/pay', c.reference], { replaceUrl: true });
    } else if (c.status === 'success') {
      this.router.navigate(['/app/subscription/pay', c.reference], { replaceUrl: true });
    } else if (c.status === 'failed' || c.status === 'abandoned') {
      this.message.set(c.failureReason ?? 'The payment was not completed.');
      this.stage.set('declined');
    } else if (c.cardSubmitted) {
      this.continueFrom(c);
    } else {
      this.stage.set('card');
    }
  }

  private continueFrom(c: Checkout) {
    if (c.authorizationType === 'REDIRECT' && c.authorizationLink) {
      this.goToBank(c.authorizationLink);
    } else if (c.authorizationType === 'OTP' || c.authorizationType === 'PIN' || c.authorizationType === 'AVS') {
      this.authType.set(c.authorizationType);
      this.stage.set('authorize');
    } else {
      this.router.navigate(['/app/subscription/pay', c.reference], { replaceUrl: true });
    }
  }

  // ------------------------------------------------------------------ live preview and formatting

  private brandOf(digits: string) {
    return BRANDS.find(b => b.test.test(digits)) ?? { brand: 'card' as Brand, label: '', test: /./, lengths: [16], cvv: 3 };
  }

  gradient(): string {
    switch (this.brand().brand) {
      case 'visa': return 'bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-800';
      case 'mastercard': return 'bg-gradient-to-br from-orange-600 via-red-600 to-rose-800';
      case 'verve': return 'bg-gradient-to-br from-emerald-700 via-teal-600 to-cyan-800';
      case 'amex': return 'bg-gradient-to-br from-sky-600 via-cyan-600 to-slate-700';
      case 'discover': return 'bg-gradient-to-br from-amber-600 via-orange-500 to-amber-800';
      default: return 'bg-gradient-to-br from-ink-800 via-ink-700 to-ink-950';
    }
  }

  previewNumber(): string {
    const digits = this.digitsOnly();
    const amex = this.brand().brand === 'amex';
    const total = amex ? 15 : 16;
    const shown = (digits + '•'.repeat(total)).slice(0, total).split('');
    // The number is masked on the preview except for what has been typed, in the usual groups.
    const groups = amex ? [4, 6, 5] : [4, 4, 4, 4];
    let i = 0;
    return groups.map(n => { const g = shown.slice(i, i + n).join(''); i += n; return g; }).join(' ');
  }

  previewExpiry(): string {
    const t = this.expiryText;
    return (t + 'MM/YY'.slice(t.length)).slice(0, 5);
  }

  cvvMask(): string {
    return (this.cvv + '•'.repeat(this.brand().cvv)).slice(0, this.brand().cvv).replace(/\d/g, '•');
  }

  digits(v: string): string {
    return (v ?? '').replace(/\D/g, '');
  }

  /** Keeps only digits and writes the cleaned text back into the field itself (the model alone would not refresh it). */
  clean(ev: Event, max: number): string {
    const el = ev.target as HTMLInputElement;
    const v = this.digits(el.value).slice(0, max);
    el.value = v;
    return v;
  }

  onNumber(ev: Event) {
    const el = ev.target as HTMLInputElement;
    let digits = this.digits(el.value).slice(0, 19);
    const b = this.brandOf(digits);
    digits = digits.slice(0, Math.max(...b.lengths));
    this.numberSig.set(digits);
    const groups = b.brand === 'amex' ? [4, 6, 5] : [4, 4, 4, 4, 3];
    const parts: string[] = [];
    let i = 0;
    for (const n of groups) { if (i < digits.length) parts.push(digits.slice(i, i + n)); i += n; }
    this.numberText = parts.join(' ');
    el.value = this.numberText;
    if (this.touched.has('number')) this.validate();
  }

  onExpiry(ev: Event) {
    const el = ev.target as HTMLInputElement;
    let d = this.digits(el.value).slice(0, 4);
    if (d.length >= 1 && +d[0] > 1) d = '0' + d;          // 4 -> 04
    if (d.length >= 2 && +d.slice(0, 2) > 12) d = '12' + d.slice(2);
    this.expiryText = d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    el.value = this.expiryText;
    if (this.touched.has('expiry')) this.validate();
  }

  // ------------------------------------------------------------------ validation

  touch(field: string) {
    this.touched.add(field);
    this.validate();
  }

  showErr(field: string): boolean {
    return this.touched.has(field) && !!this.errors()[field];
  }

  /** Clears the red marks as soon as a field that was wrong is corrected, instead of waiting for the next blur. */
  onEdit() {
    if (this.touched.size) this.validate();
  }

  private validate(): Record<string, string> {
    const e: Record<string, string> = {};
    const digits = this.digitsOnly();
    const b = this.brand();
    if (!b.lengths.includes(digits.length) || !luhn(digits)) e['number'] = 'Enter a valid card number.';
    if (this.holder.trim().length < 2) e['holder'] = 'Enter the name shown on the card.';
    const m = /^(\d{2})\/(\d{2})$/.exec(this.expiryText);
    if (!m || +m[1] < 1 || +m[1] > 12) e['expiry'] = 'Use the format MM/YY.';
    else {
      const now = new Date();
      const endOfMonth = new Date(2000 + +m[2], +m[1], 0, 23, 59, 59);
      if (endOfMonth < now) e['expiry'] = 'This card has expired.';
    }
    if (this.cvv.length !== b.cvv) e['cvv'] = `Enter the ${b.cvv}-digit code.`;
    if (!this.firstName.trim()) e['firstName'] = 'Required';
    if (!this.lastName.trim()) e['lastName'] = 'Required';
    if (!/^\d{6,15}$/.test(this.phone.replace(/[\s()-]/g, '').replace(/^0/, ''))) e['phone'] = 'Enter a valid phone number.';
    if (!this.line1.trim()) e['line1'] = 'Required';
    if (!this.city.trim()) e['city'] = 'Required';
    if (!this.state.trim()) e['state'] = 'Required';
    if (!this.postalCode.trim()) e['postalCode'] = 'Required';
    if (!this.country) e['country'] = 'Required';
    this.errors.set(e);
    return e;
  }

  countryName(code: string): string {
    return this.countries().find(c => c.code === code)?.name ?? '';
  }

  // ------------------------------------------------------------------ paying

  pay() {
    if (this.busy()) return;
    ['number', 'holder', 'expiry', 'cvv', 'firstName', 'lastName', 'phone', 'line1', 'city', 'state', 'postalCode', 'country'].forEach(f => this.touched.add(f));
    if (Object.keys(this.validate()).length) {
      this.message.set('Please check the highlighted fields.');
      return;
    }
    const [mm, yy] = this.expiryText.split('/');
    const body = {
      cardHolderName: this.holder.trim(), cardNumber: this.digitsOnly(), expiryMonth: mm, expiryYear: yy, cvv: this.cvv,
      firstName: this.firstName.trim(), lastName: this.lastName.trim(), dialCode: this.dial, phone: this.phone,
      country: this.country, countryName: this.countryName(this.country), state: this.state.trim(), city: this.city.trim(),
      postalCode: this.postalCode.trim(), line1: this.line1.trim(), line2: this.line2.trim() || undefined
    };
    this.busy.set(true);
    this.message.set('');
    this.api.submitCard(this.reference, body).subscribe({
      next: step => { this.wipeCard(); this.busy.set(false); this.handle(step); },
      error: (e: ApiError) => {
        this.busy.set(false);
        if (e.httpStatus === 409) {
          // Already sent (a second tab, a double click): find out where it stands instead of showing a scary error.
          this.wipeCard();
          this.api.getCheckout(this.reference).subscribe({ next: c => this.enter(c), error: () => this.message.set(e.userMessage) });
        } else {
          // A refusal before anything was sent (bad card number, expired): the card stays in the form so it can be corrected.
          this.message.set(e.httpStatus === 400 ? e.userMessage : 'We could not send your card just now. Please try again.');
        }
      }
    });
  }

  canAuthorize(): boolean {
    switch (this.authType()) {
      case 'OTP': return /^\d{4,10}$/.test(this.otp);
      case 'PIN': return /^\d{4}$/.test(this.pin);
      case 'AVS': return !!(this.avs.line1.trim() && this.avs.city.trim() && this.avs.state.trim() && this.avs.postalCode.trim() && this.avs.country);
      default: return false;
    }
  }

  authorize() {
    const type = this.authType();
    if (!type || this.busy() || !this.canAuthorize()) return;
    const body: AuthorizeForm = { authorizationType: type };
    if (type === 'OTP') body.otp = this.otp;
    if (type === 'PIN') body.pin = this.pin;
    if (type === 'AVS') Object.assign(body, { country: this.avs.country, countryName: this.countryName(this.avs.country) || this.avs.countryName, state: this.avs.state, city: this.avs.city, postalCode: this.avs.postalCode, line1: this.avs.line1 });
    this.busy.set(true);
    this.message.set('');
    this.api.authorizeCard(this.reference, body).subscribe({
      next: step => {
        this.busy.set(false);
        this.otp = '';
        this.pin = '';
        this.handle(step);
      },
      error: (e: ApiError) => {
        this.busy.set(false);
        this.stepError.set(true);
        this.message.set(e.userMessage);
      }
    });
  }

  private handle(step: CardStep) {
    this.checkout.set(step.checkout);
    this.stepError.set(false);
    switch (step.outcome) {
      case 'declined':
        this.message.set(step.message || step.checkout.failureReason || 'The payment was not completed.');
        this.stage.set('declined');
        break;
      case 'needs_authorization':
        this.authType.set(step.checkout.authorizationType === 'PIN' || step.checkout.authorizationType === 'AVS' ? step.checkout.authorizationType : 'OTP');
        this.message.set(step.message);
        this.stage.set('authorize');
        break;
      case 'retry':
        this.stepError.set(true);
        this.message.set(step.message || 'That was not accepted. Please try again.');
        this.stage.set('authorize');
        break;
      case 'redirect':
        if (step.checkout.authorizationLink) this.goToBank(step.checkout.authorizationLink);
        else this.router.navigate(['/app/subscription/pay', this.reference]);
        break;
      default:
        // submitted (or unknown): the result page asks the gateway and waits for the answer.
        this.router.navigate(['/app/subscription/pay', this.reference]);
    }
  }

  private goToBank(link: string) {
    this.stage.set('redirecting');
    setTimeout(() => (window.location.href = link), 900);
  }

  /** The card leaves memory as soon as the request has been sent. */
  private wipeCard() {
    this.numberText = '';
    this.numberSig.set('');
    this.expiryText = '';
    this.cvv = '';
    this.flipped.set(false);
  }
}
