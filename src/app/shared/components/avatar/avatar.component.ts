import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden"
         [ngStyle]="{ width: size + 'px', height: size + 'px', background: bg, color: '#fff', fontSize: (size/2.4) + 'px' }">
      <img *ngIf="src" [src]="src" class="w-full h-full object-cover" [alt]="name"/>
      <span *ngIf="!src">{{ initials }}</span>
    </div>
  `
})
export class AvatarComponent {
  @Input() name = '';
  @Input() src = '';
  @Input() size = 36;

  get initials() {
    const parts = this.name.trim().split(' ').filter(Boolean);
    if (!parts.length) return '?';
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  }

  get bg() {
    const colors = ['#128a4d', '#0f6f40', '#1fae62', '#0d4a2e', '#45c87e', '#3b82f6', '#8b5cf6', '#f59e0b'];
    let hash = 0;
    for (const c of this.name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }
}
