import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="flex flex-col items-center justify-center text-center py-14 px-6">
      <div class="w-14 h-14 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
        <app-icon [name]="icon" [size]="26"></app-icon>
      </div>
      <h3 class="font-semibold text-ink-900 mb-1">{{ title }}</h3>
      <p class="muted max-w-sm">{{ subtitle }}</p>
      <div class="mt-5"><ng-content></ng-content></div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = 'info';
  @Input() title = '';
  @Input() subtitle = '';
}
