import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../shell/auth-shell.component';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, AuthShellComponent, OtpInputComponent],
  template: `
  <app-auth-shell headline="One more step." sub="Two-factor authentication keeps your compliance data secure.">
    <h1 class="text-2xl font-bold text-ink-950 mb-1">Enter verification code</h1>
    <p class="muted mb-6">We've sent a 6-digit code to <strong class="text-ink-800">{{ destination }}</strong></p>

    <div *ngIf="notice()" class="mb-4 p-3 rounded-lg bg-brand-50 text-brand-800 text-sm" role="status">{{ notice() }}</div>
    <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

    <app-otp-input class="block mb-6" [disabled]="loading()" (codeChange)="code = $event; $event && error.set('')"></app-otp-input>

    <button class="btn-primary w-full py-3" [disabled]="loading() || !code" (click)="submit()">
      <span *ngIf="!loading()">Verify & continue</span>
      <span *ngIf="loading()">Verifying...</span>
    </button>

    <p class="text-center text-sm text-ink-500 mt-6">
      Didn't get a code? <button class="text-brand-600 font-medium hover:underline" [disabled]="resending()" (click)="resend()">Resend</button>
    </p>
    <p class="text-center text-sm text-ink-500 mt-2">
      <a routerLink="/auth/login" class="text-brand-600 font-medium hover:underline inline-flex items-center gap-1">
        <app-icon name="arrow-left" [size]="14"></app-icon> Back to sign in
      </a>
    </p>
  </app-auth-shell>
  `
})
export class Verify2faComponent implements OnInit {
  @ViewChild(OtpInputComponent) otp?: OtpInputComponent;
  sessionId = '';
  destination = 'your email';
  code = '';
  loading = signal(false);
  resending = signal(false);
  error = signal('');
  notice = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    const pending = this.auth.pending2fa();
    if (!pending) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.sessionId = pending.sessionId;
    this.destination = pending.destination || pending.email;
  }

  submit() {
    this.loading.set(true);
    this.error.set('');
    this.auth.verify2fa(this.sessionId, this.code).subscribe({
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
    this.notice.set('');
    this.error.set('');
    this.auth.resend2fa(this.sessionId).subscribe({
      next: () => {
        this.resending.set(false);
        this.notice.set('A new code has been sent.');
        this.otp?.clear();
      },
      error: (e: ApiError) => {
        this.resending.set(false);
        this.error.set(e.httpStatus === 429 ? 'Please wait a moment before asking for another code.' : e.userMessage);
      }
    });
  }
}
