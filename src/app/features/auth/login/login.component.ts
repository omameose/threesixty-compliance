import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
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
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.error = '';
    this.auth.login(this.form.value.email!.trim(), this.form.value.password!).subscribe({
      next: res => {
        this.loading = false;
        switch (res.kind) {
          case '2fa':
            this.router.navigate(['/auth/verify-2fa']);
            break;
          case 'verify-email':
            // The account exists but its email was never confirmed: the server has sent a code (or one is still valid).
            this.router.navigate(['/auth/verify-email']);
            break;
          default:
            this.router.navigate(['/app/dashboard']);
        }
      },
      error: (e: ApiError) => {
        this.loading = false;
        this.error = e.httpStatus === 401 ? 'The email or password is not correct.' : e.userMessage;
      }
    });
  }
}
