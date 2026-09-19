import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { AuthShellComponent } from '../shell/auth-shell.component';

@Component({
  selector: 'app-verify-2fa',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, AuthShellComponent],
  template: `
  <app-auth-shell headline="One more step." sub="Two-factor authentication keeps your compliance data secure.">
    <h1 class="text-2xl font-bold text-ink-950 mb-1">Enter verification code</h1>
    <p class="muted mb-7">We've sent a 6-digit code to <strong class="text-ink-800">{{ email }}</strong></p>

    <div class="flex gap-2 sm:gap-3 mb-6">
      <input *ngFor="let d of digits; let i = index" #box
             class="input text-center text-xl font-bold w-12 h-14 sm:w-14"
             maxlength="1" inputmode="numeric"
             [value]="digits[i]"
             (input)="onInput($event, i)"
             (keydown)="onKeydown($event, i)"/>
    </div>

    <button class="btn-primary w-full py-3" [disabled]="loading || !isComplete()" (click)="submit()">
      <span *ngIf="!loading">Verify & continue</span>
      <span *ngIf="loading">Verifying...</span>
    </button>

    <p class="text-center text-sm text-ink-500 mt-6">
      Didn't get a code? <button class="text-brand-600 font-medium hover:underline">Resend</button>
    </p>
    <p class="text-center text-sm text-ink-500 mt-2">
      <a routerLink="/auth/login" class="text-brand-600 font-medium hover:underline inline-flex items-center gap-1">
        <app-icon name="arrow-left" [size]="14"></app-icon> Back to sign in
      </a>
    </p>
  </app-auth-shell>
  `
})
export class Verify2faComponent {
  digits = ['', '', '', '', '', ''];
  loading = false;
  email = sessionStorage.getItem('pending_2fa_email') || 'you@company.com';
  @ViewChildren('box') boxes!: QueryList<ElementRef<HTMLInputElement>>;

  constructor(private auth: AuthService, private router: Router) {}

  onInput(e: Event, i: number) {
    const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(-1);
    this.digits[i] = val;
    if (val && i < 5) {
      this.boxes.toArray()[i + 1].nativeElement.focus();
    }
  }

  onKeydown(e: KeyboardEvent, i: number) {
    if (e.key === 'Backspace' && !this.digits[i] && i > 0) {
      this.boxes.toArray()[i - 1].nativeElement.focus();
    }
  }

  isComplete() { return this.digits.every(d => d.length === 1); }

  submit() {
    if (!this.isComplete()) return;
    this.loading = true;
    this.auth.verify2fa(this.digits.join('')).subscribe(() => {
      this.loading = false;
      sessionStorage.removeItem('pending_2fa_email');
      this.router.navigate(['/app/dashboard']);
    });
  }
}
