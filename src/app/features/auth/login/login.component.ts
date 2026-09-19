import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../shell/auth-shell.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, IconComponent, AuthShellComponent],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  loading = false;
  showPassword = false;
  error = '';

  form = this.fb.group({
    email: ['rukayat.yaro@payflux.com', [Validators.required, Validators.email]],
    password: ['••••••••', [Validators.required, Validators.minLength(6)]],
    remember: [true]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value.email!, this.form.value.password!).subscribe(res => {
      this.loading = false;
      if (res.requires2fa) {
        sessionStorage.setItem('pending_2fa_email', res.email);
        this.router.navigate(['/auth/verify-2fa']);
      } else {
        this.auth.completeLogin();
        this.router.navigate(['/app/dashboard']);
      }
    });
  }
}
