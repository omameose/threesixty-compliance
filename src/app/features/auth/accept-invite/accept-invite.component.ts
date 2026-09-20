import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AuthService, InvitationPreview } from '../../../core/services/auth.service';
import { matchesField, passwordPolicy, PASSWORD_RULES } from '../../../core/validators/password.validator';
import { AuthShellComponent } from '../shell/auth-shell.component';

/** Opened from a team invitation email: /auth/accept-invite?token=... The person sets a password and is signed in. */
@Component({
  selector: 'app-accept-invite',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthShellComponent],
  template: `
  <app-auth-shell headline="You've been invited." sub="Set a password to join your team on 360Compliance.">
    <div *ngIf="state === 'loading'" class="muted">Checking your invitation...</div>

    <div *ngIf="state === 'invalid'" class="p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">
      {{ error || 'This invitation is not valid.' }} Ask the person who invited you to send a new one.
    </div>

    <ng-container *ngIf="state === 'ready' && preview">
      <h1 class="text-2xl font-bold text-ink-950 mb-1">Join {{ preview.companyName || 'the team' }}</h1>
      <p class="muted mb-6">You are joining as <strong>{{ preview.roleName }}</strong> with <strong>{{ preview.email }}</strong>.</p>
      <div *ngIf="error" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error }}</div>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4" novalidate>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label" for="firstName">First name</label><input id="firstName" class="input" formControlName="firstName"/></div>
          <div><label class="label" for="lastName">Last name</label><input id="lastName" class="input" formControlName="lastName"/></div>
        </div>
        <div>
          <label class="label" for="password">Password</label>
          <input id="password" class="input" type="password" formControlName="password" autocomplete="new-password"/>
          <ul class="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <li *ngFor="let r of rules" [class.text-brand-600]="met(r.key)" [class.text-ink-400]="!met(r.key)">{{ met(r.key) ? '✓' : '○' }} {{ r.label }}</li>
          </ul>
        </div>
        <div>
          <label class="label" for="confirm">Confirm password</label>
          <input id="confirm" class="input" type="password" formControlName="confirm" autocomplete="new-password"/>
          <p class="text-xs text-red-600 mt-1" *ngIf="form.controls.confirm.touched && form.controls.confirm.errors?.['mismatch']">The passwords do not match.</p>
        </div>
        <button type="submit" class="btn-primary w-full py-3" [disabled]="loading">{{ loading ? 'Setting up...' : 'Accept invitation' }}</button>
      </form>
    </ng-container>
    <p class="text-center text-sm text-ink-500 mt-6"><a routerLink="/auth/login" class="text-brand-600 font-medium hover:underline">Back to sign in</a></p>
  </app-auth-shell>
  `
})
export class AcceptInviteComponent implements OnInit {
  @Input() token = '';
  state: 'loading' | 'ready' | 'invalid' = 'loading';
  preview?: InvitationPreview;
  rules = PASSWORD_RULES;
  loading = false;
  error = '';
  form = this.fb.group({
    firstName: [''],
    lastName: [''],
    password: ['', [Validators.required, passwordPolicy]],
    confirm: ['', [Validators.required, matchesField('password')]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {
    this.form.controls.password.valueChanges.subscribe(() => this.form.controls.confirm.updateValueAndValidity());
  }

  ngOnInit() {
    if (!this.token) { this.state = 'invalid'; return; }
    this.auth.previewInvitation(this.token).subscribe({
      next: p => {
        this.preview = p;
        this.form.patchValue({ firstName: p.firstName ?? '', lastName: p.lastName ?? '' });
        this.state = 'ready';
      },
      error: (e: ApiError) => { this.error = e.userMessage; this.state = 'invalid'; }
    });
  }

  met(key: string) {
    return !!this.rules.find(r => r.key === key)?.test(this.form.controls.password.value ?? '');
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.loading = true;
    this.error = '';
    this.auth.completeInvitation(this.token, v.password!, v.firstName ?? '', v.lastName ?? '').subscribe({
      next: () => this.router.navigate(['/app/dashboard']),
      error: (e: ApiError) => { this.loading = false; this.error = e.userMessage; }
    });
  }
}
