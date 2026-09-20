import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { matchesField, passwordPolicy, PASSWORD_RULES } from '../../../core/validators/password.validator';
import { AuthShellComponent } from '../shell/auth-shell.component';

/** Opened from the link in the reset email: /auth/reset-password?token=... */
@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthShellComponent],
  template: `
  <app-auth-shell headline="Choose a new password." sub="Use something you have not used before.">
    <h1 class="text-2xl font-bold text-ink-950 mb-1">Set a new password</h1>
    <p class="muted mb-6">You will be signed out everywhere and asked to sign in again.</p>

    <div *ngIf="!token" class="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4" role="alert">
      This reset link is incomplete. Please use the link from the email, or <a routerLink="/auth/forgot-password" class="underline">request a new one</a>.
    </div>
    <div *ngIf="error" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
      {{ error }} <a routerLink="/auth/forgot-password" class="underline ml-1">Request a new link</a>
    </div>

    <form *ngIf="token && !done" [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
      <div>
        <label class="label" for="password">New password</label>
        <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password"/>
        <ul class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
          <li *ngFor="let r of rules" [class.text-brand-600]="met(r.key)" [class.text-ink-400]="!met(r.key)">{{ met(r.key) ? '✓' : '○' }} {{ r.label }}</li>
        </ul>
      </div>
      <div>
        <label class="label" for="confirm">Confirm new password</label>
        <input id="confirm" class="input" type="password" formControlName="confirm" autocomplete="new-password"/>
        <p class="text-xs text-red-600 mt-1" *ngIf="form.controls.confirm.touched && form.controls.confirm.errors?.['mismatch']">The passwords do not match.</p>
      </div>
      <button type="submit" class="btn-primary w-full py-3" [disabled]="loading">{{ loading ? 'Saving...' : 'Reset password' }}</button>
    </form>

    <div *ngIf="done" class="text-center py-4">
      <h2 class="font-semibold text-ink-900 mb-1">Password updated</h2>
      <p class="muted mb-4">You can now sign in with your new password.</p>
      <a routerLink="/auth/login" class="btn-primary inline-flex">Go to sign in</a>
    </div>
  </app-auth-shell>
  `
})
export class ResetPasswordComponent {
  /** Bound from the ?token= query parameter (withComponentInputBinding). */
  @Input() token = '';
  rules = PASSWORD_RULES;
  loading = false;
  done = false;
  error = '';
  form = this.fb.group({
    password: ['', [Validators.required, passwordPolicy]],
    confirm: ['', [Validators.required, matchesField('password')]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form.controls.password.valueChanges.subscribe(() => this.form.controls.confirm.updateValueAndValidity());
  }

  met(key: string) {
    return !!this.rules.find(r => r.key === key)?.test(this.form.controls.password.value ?? '');
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.auth.resetPassword(this.token, this.form.value.password!).subscribe({
      next: () => { this.loading = false; this.done = true; },
      error: (e: ApiError) => { this.loading = false; this.error = e.userMessage; }
    });
  }
}
