import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-auth-shell',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
  <div class="min-h-screen grid lg:grid-cols-2 bg-white">
    <div class="hidden lg:flex flex-col justify-between bg-gradient-to-br from-brand-700 to-brand-900 text-white p-12 relative overflow-hidden">
      <div class="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-white/5"></div>
      <div class="absolute -left-16 bottom-0 w-72 h-72 rounded-full bg-white/5"></div>
      <a routerLink="/" class="flex items-center gap-2 font-extrabold text-xl relative z-10">
        <span class="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center"><app-icon name="shield" [size]="20"></app-icon></span>
        360<span class="text-brand-200">Compliance</span>
      </a>
      <div class="relative z-10 max-w-md">
        <h2 class="text-3xl font-bold leading-snug mb-4">{{ headline }}</h2>
        <p class="text-brand-100">{{ sub }}</p>
        <div class="mt-8 flex items-center gap-3">
          <div class="flex -space-x-2">
            <div class="w-8 h-8 rounded-full bg-white/20 border-2 border-brand-700"></div>
            <div class="w-8 h-8 rounded-full bg-white/30 border-2 border-brand-700"></div>
            <div class="w-8 h-8 rounded-full bg-white/40 border-2 border-brand-700"></div>
          </div>
          <p class="text-sm text-brand-100">Trusted by 400+ compliance teams</p>
        </div>
      </div>
      <p class="relative z-10 text-xs text-brand-200">&copy; 2026 360Compliance. All rights reserved.</p>
    </div>

    <div class="flex items-center justify-center p-6 sm:p-12">
      <div class="w-full max-w-sm fade-in">
        <a routerLink="/" class="lg:hidden flex items-center gap-2 font-extrabold text-lg mb-8">
          <span class="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center"><app-icon name="shield" [size]="18"></app-icon></span>
          360<span class="text-brand-600">Compliance</span>
        </a>
        <ng-content></ng-content>
      </div>
    </div>
  </div>
  `
})
export class AuthShellComponent {
  @Input() headline = 'Compliance made simple.';
  @Input() sub = 'One platform for KYC, KYB, AML and beyond.';
}
