import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthShellComponent } from '../shell/auth-shell.component';

/**
 * Step after sign-up (and after signing in to an account that was never verified). The emailed code works for 15 minutes; a new
 * one can be requested every 5 minutes, and the server enforces both, so the countdowns here only mirror what it will accept.
 */
@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, AuthShellComponent, OtpInputComponent],
  template: `
  <app-auth-shell headline="Confirm your email." sub="We only activate your workspace once we know the address is yours.">
    <h1 class="text-2xl font-bold text-ink-950 mb-1">Check your email</h1>
    <p class="muted mb-6">We sent a 6-digit code to <strong class="text-ink-800">{{ email }}</strong>.</p>

    <div *ngIf="notice()" class="mb-4 p-3 rounded-lg bg-brand-50 text-brand-800 text-sm" role="status">{{ notice() }}</div>
    <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

    <app-otp-input class="block mb-4" [disabled]="loading()" (codeChange)="code = $event; $event && error.set('')"></app-otp-input>

    <p class="text-sm mb-6" [class.text-ink-500]="expiresIn() > 0" [class.text-red-600]="expiresIn() === 0">
      <ng-container *ngIf="expiresIn() > 0">The code expires in <strong>{{ format(expiresIn()) }}</strong>.</ng-container>
      <ng-container *ngIf="expiresIn() === 0">This code has expired. Request a new one below.</ng-container>
    </p>

    <button class="btn-primary w-full py-3" [disabled]="loading() || !code || expiresIn() === 0" (click)="submit()">
      <span *ngIf="!loading()">Verify and continue</span>
      <span *ngIf="loading()">Verifying...</span>
    </button>

    <p class="text-center text-sm text-ink-500 mt-6">
      Did not get it? Check spam, or
      <button class="text-brand-600 font-medium hover:underline disabled:text-ink-400 disabled:no-underline disabled:cursor-not-allowed"
              [disabled]="resendIn() > 0 || resending()" (click)="resend()">
        {{ resending() ? 'sending...' : resendIn() > 0 ? 'resend in ' + format(resendIn()) : 'resend the code' }}
      </button>
    </p>
    <p class="text-center text-sm text-ink-500 mt-2">
      <a routerLink="/auth/login" class="text-brand-600 font-medium hover:underline inline-flex items-center gap-1">
        <app-icon name="arrow-left" [size]="14"></app-icon> Back to sign in
      </a>
    </p>
  </app-auth-shell>
  `
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  @ViewChild(OtpInputComponent) otp?: OtpInputComponent;
  email = '';
  code = '';
  loading = signal(false);
  resending = signal(false);
  error = signal('');
  notice = signal('');
  expiresIn = signal(0);
  resendIn = signal(0);
  private expiresAt = 0;
  private resendAt = 0;
  private timer?: ReturnType<typeof setInterval>;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const pending = this.auth.pendingVerification();
    if (!pending) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.email = pending.email;
    this.expiresAt = pending.expiresAt;
    this.resendAt = pending.resendAt;
    this.tick();
    this.timer = setInterval(() => this.tick(), 1000);
  }

  ngOnDestroy() {
    clearInterval(this.timer);
  }

  private tick() {
    const now = Date.now();
    this.expiresIn.set(Math.max(0, Math.ceil((this.expiresAt - now) / 1000)));
    this.resendIn.set(Math.max(0, Math.ceil((this.resendAt - now) / 1000)));
  }

  format(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  submit() {
    if (!this.code) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyEmail(this.email, this.code).subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (e: ApiError) => {
        this.loading.set(false);
        this.error.set(e.userMessage);
        this.otp?.clear();
      }
    });
  }

  resend() {
    this.resending.set(true);
    this.error.set('');
    this.notice.set('');
    this.auth.resendVerification(this.email).subscribe({
      next: c => {
        const state = this.auth.pendingVerification();
        if (state) {
          this.expiresAt = state.expiresAt;
          this.resendAt = state.resendAt;
        }
        this.tick();
        this.resending.set(false);
        this.notice.set(c.codeSent ? 'A new code is on its way. Any earlier code no longer works.' : 'A code was sent recently. Please use it, or wait for the timer.');
        this.otp?.clear();
      },
      error: (e: ApiError) => {
        this.resending.set(false);
        this.error.set(e.userMessage);
      }
    });
  }
}
