import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { UtilService } from '../../../core/services/util.service';
import { matchesField, passwordPolicy, PASSWORD_RULES } from '../../../core/validators/password.validator';
import { AuthShellComponent } from '../shell/auth-shell.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AuthShellComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  loading = false;
  step: 1 | 2 = 1;
  error = '';
  existingAccount = false;
  rules = PASSWORD_RULES;

  industries$ = this.util.industries$;
  countries$ = this.util.countries$;

  form = this.fb.group({
    companyName: ['', [Validators.required, Validators.maxLength(200)]],
    industry: ['', Validators.required],
    country: [''],
    firstName: ['', [Validators.required, Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.maxLength(100)]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.maxLength(32)],
    password: ['', [Validators.required, passwordPolicy]],
    confirmPassword: ['', [Validators.required, matchesField('password')]],
    agree: [false, Validators.requiredTrue]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private util: UtilService, private router: Router) {
    this.form.controls.password.valueChanges.subscribe(() => this.form.controls.confirmPassword.updateValueAndValidity());
  }

  ruleMet(key: string): boolean {
    const rule = this.rules.find(r => r.key === key);
    return !!rule && rule.test(this.form.controls.password.value ?? '');
  }

  nextStep() {
    const step1 = [this.form.controls.companyName, this.form.controls.industry];
    step1.forEach(c => c.markAsTouched());
    if (step1.every(c => c.valid)) this.step = 2;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.loading = true;
    this.error = '';
    this.existingAccount = false;
    this.auth
      .register({
        companyName: v.companyName!, industry: v.industry!, country: v.country ?? '',
        firstName: v.firstName!, lastName: v.lastName!, email: v.email!, phone: v.phone ?? '', password: v.password!
      })
      .subscribe({
        // A code has been emailed: the account is not usable until it is entered.
        next: () => this.router.navigate(['/auth/verify-email']),
        error: (e: ApiError) => {
          this.loading = false;
          this.existingAccount = e.httpStatus === 409;
          this.error = e.userMessage;
        }
      });
  }
}
