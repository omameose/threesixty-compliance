import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthShellComponent } from '../shell/auth-shell.component';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent, AuthShellComponent],
  template: `
  <app-auth-shell headline="Forgot your password?" sub="No worries, we'll send you reset instructions.">
    <div *ngIf="!sent">
      <h1 class="text-2xl font-bold text-ink-950 mb-1">Reset password</h1>
      <p class="muted mb-7">Enter your email and we'll send a reset link.</p>
      <div *ngIf="error" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error }}</div>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
        <div>
          <label class="label" for="email">Work email</label>
          <input id="email" class="input" type="email" formControlName="email" placeholder="you@company.com"/>
          <p class="text-xs text-red-600 mt-1" *ngIf="form.controls.email.touched && form.controls.email.invalid">Enter a valid email address.</p>
        </div>
        <button type="submit" class="btn-primary w-full py-3" [disabled]="loading">{{ loading ? 'Sending...' : 'Send reset link' }}</button>
      </form>
    </div>
    <div *ngIf="sent" class="text-center py-4">
      <div class="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
        <app-icon name="mail" [size]="26"></app-icon>
      </div>
      <h2 class="font-semibold text-ink-900 mb-1">Check your inbox</h2>
      <p class="muted">If an account exists for {{ form.value.email }}, we've sent password reset instructions. The link works for 30 minutes.</p>
    </div>
    <p class="text-center text-sm text-ink-500 mt-6">
      <a routerLink="/auth/login" class="text-brand-600 font-medium hover:underline inline-flex items-center gap-1">
        <app-icon name="arrow-left" [size]="14"></app-icon> Back to sign in
      </a>
    </p>
  </app-auth-shell>
  `
})
export class ForgotPasswordComponent {
  sent = false;
  loading = false;
  error = '';
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  constructor(private fb: FormBuilder, private auth: AuthService) {}

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    // The server answers the same way whether or not the address is registered, so nothing is revealed here either.
    this.auth.forgotPassword(this.form.value.email!.trim()).subscribe({
      next: () => { this.loading = false; this.sent = true; },
      error: (e: ApiError) => { this.loading = false; this.error = e.userMessage; }
    });
  }
}
