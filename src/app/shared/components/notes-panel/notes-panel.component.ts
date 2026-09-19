import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CaseNote } from '../../../core/models/models';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-notes-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div>
      <h3 class="font-semibold text-ink-900 mb-3">Analyst Notes</h3>
      <div class="space-y-3 mb-4 max-h-64 overflow-y-auto" *ngIf="notes.length">
        <div class="bg-ink-50 rounded-lg p-3" *ngFor="let n of notes">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-ink-900">{{ n.author }}</span>
            <span class="text-xs text-ink-400">{{ n.date }}</span>
          </div>
          <p class="text-sm text-ink-600">{{ n.text }}</p>
        </div>
      </div>
      <p class="text-sm text-ink-400 mb-4" *ngIf="!notes.length">No notes yet.</p>
      <div class="flex gap-2">
        <input class="input" [(ngModel)]="draft" placeholder="Add a note..." (keyup.enter)="submit()"/>
        <button class="btn-secondary shrink-0" [disabled]="!draft.trim()" (click)="submit()">
          <app-icon name="send" [size]="15"></app-icon>
        </button>
      </div>
    </div>
  `
})
export class NotesPanelComponent {
  @Input() notes: CaseNote[] = [];
  @Output() addNote = new EventEmitter<string>();
  draft = '';

  submit() {
    if (!this.draft.trim()) return;
    this.addNote.emit(this.draft.trim());
    this.draft = '';
  }
}
