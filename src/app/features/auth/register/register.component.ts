import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../shell/auth-shell.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent, AuthShellComponent],
  templateUrl: './register.component.html'
})
export class RegisterComponent {
  loading = false;
  step: 1 | 2 = 1;

  form = this.fb.group({
    companyName: ['', Validators.required],
    industry: ['Payment Gateway', Validators.required],
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    agree: [false, Validators.requiredTrue]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  nextStep() {
    if (this.step === 1) {
      if (!this.form.get('companyName')?.value || !this.form.get('industry')?.value) {
        this.form.get('companyName')?.markAsTouched();
        return;
      }
      this.step = 2;
    }
  }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.auth.register({
      companyName: this.form.value.companyName!,
      email: this.form.value.email!,
      password: this.form.value.password!
    }).subscribe(() => {
      this.loading = false;
      this.auth.completeLogin();
      this.router.navigate(['/app/dashboard']);
    });
  }
}
