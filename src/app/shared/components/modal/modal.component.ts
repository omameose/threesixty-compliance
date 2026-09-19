import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4" *ngIf="open">
      <div class="absolute inset-0 bg-ink-950/50 backdrop-blur-[2px]" (click)="close.emit()"></div>
      <div class="relative bg-white rounded-2xl shadow-xl w-full fade-in overflow-hidden flex flex-col max-h-[90vh]"
           [ngClass]="widthClass">
        <div class="flex items-start justify-between px-6 pt-6 pb-4 border-b border-ink-100" *ngIf="title">
          <div>
            <h3 class="text-lg font-semibold text-ink-900">{{ title }}</h3>
            <p class="muted mt-0.5" *ngIf="subtitle">{{ subtitle }}</p>
          </div>
          <button class="text-ink-400 hover:text-ink-700 p-1" (click)="close.emit()">
            <app-icon name="x" [size]="20"></app-icon>
          </button>
        </div>
        <div class="overflow-y-auto px-6 py-5">
          <ng-content></ng-content>
        </div>
        <div class="px-6 py-4 border-t border-ink-100 flex justify-end gap-3" *ngIf="showFooter">
          <ng-content select="[modal-footer]"></ng-content>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showFooter = true;
  @Input() widthClass = 'max-w-lg';
  @Output() close = new EventEmitter<void>();
}
