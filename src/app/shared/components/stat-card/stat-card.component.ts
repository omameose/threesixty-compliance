import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="card p-5 flex flex-col gap-3">
      <div class="flex items-center justify-between">
        <span class="muted">{{ label }}</span>
        <div class="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 flex items-center justify-center">
          <app-icon [name]="icon" [size]="18"></app-icon>
        </div>
      </div>
      <div class="flex items-end justify-between">
        <span class="text-2xl font-bold text-ink-900">{{ value }}</span>
        <span class="text-xs font-semibold flex items-center gap-0.5"
              [class.text-brand-600]="delta >= 0" [class.text-red-500]="delta < 0">
          <app-icon [name]="delta >= 0 ? 'arrow-right' : 'arrow-right'" [size]="0" class="hidden"></app-icon>
          {{ delta >= 0 ? '+' : '' }}{{ delta }}%
        </span>
      </div>
    </div>
  `
})
export class StatCardComponent {
  @Input() label = '';
  @Input() value: string | number = '';
  @Input() delta = 0;
  @Input() icon = 'dashboard';
}
