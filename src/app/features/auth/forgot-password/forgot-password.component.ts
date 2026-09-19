import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
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
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="label">Work email</label>
          <input class="input" type="email" [formControl]="form.controls.email" placeholder="you@company.com"/>
        </div>
        <button type="submit" class="btn-primary w-full py-3">Send reset link</button>
      </form>
    </div>
    <div *ngIf="sent" class="text-center py-4">
      <div class="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-4">
        <app-icon name="mail" [size]="26"></app-icon>
      </div>
      <h2 class="font-semibold text-ink-900 mb-1">Check your inbox</h2>
      <p class="muted">We've sent password reset instructions to {{ form.value.email }}.</p>
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
  form = this.fb.group({ email: ['', [Validators.required, Validators.email]] });
  constructor(private fb: FormBuilder) {}
  submit() {
    if (this.form.invalid) return;
    this.sent = true;
  }
}
