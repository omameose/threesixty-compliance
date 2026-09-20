import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { KycField } from './kyc-schema';

export interface Choice {
  value: string;
  label: string;
}

/** Turns SOME_ENUM_VALUE into "Some enum value" for choices the server sends as bare enum names. */
export function humanize(value: string): string {
  const s = value.replace(/^RANGE_/, '').replace(/_/g, ' ').toLowerCase();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** One labelled input. The wizard owns the values; this only renders a field and reports edits. */
@Component({
  selector: 'app-kyc-field',
  standalone: true,
  imports: [CommonModule],
  template: `
  <div [class.sm:col-span-2]="field.full">
    <label class="block text-sm font-medium text-ink-800 mb-1" [attr.for]="id">
      {{ field.label }}<span *ngIf="required" class="text-red-500"> *</span>
    </label>

    <ng-container [ngSwitch]="field.type">
      <textarea *ngSwitchCase="'textarea'" class="input min-h-[96px]" [id]="id" [value]="value ?? ''" [disabled]="disabled"
                [attr.maxlength]="field.max" (input)="emit($any($event.target).value)"></textarea>

      <select *ngSwitchCase="'select'" class="input" [id]="id" [disabled]="disabled" (change)="emit($any($event.target).value)">
        <option value="" [selected]="!value">Select...</option>
        <option *ngFor="let c of choices" [value]="c.value" [selected]="c.value === value">{{ c.label }}</option>
      </select>

      <select *ngSwitchCase="'country'" class="input" [id]="id" [disabled]="disabled" (change)="emit($any($event.target).value)">
        <option value="" [selected]="!value">Select...</option>
        <option *ngFor="let c of choices" [value]="c.value" [selected]="c.value === value">{{ c.label }}</option>
      </select>

      <div *ngSwitchCase="'yesno'" class="flex gap-2">
        <button type="button" *ngFor="let o of yesNo" class="px-4 py-1.5 rounded-lg border text-sm font-medium transition"
                [ngClass]="value === o.value ? (o.value === 'YES' ? 'bg-brand-600 text-white border-brand-600' : 'bg-ink-800 text-white border-ink-800') : 'bg-white text-ink-700 border-ink-200 hover:border-ink-400'"
                [disabled]="disabled" (click)="emit(o.value)">{{ o.label }}</button>
      </div>

      <div *ngSwitchCase="'bool'" class="flex gap-2">
        <button type="button" *ngFor="let o of yesNo" class="px-4 py-1.5 rounded-lg border text-sm font-medium transition"
                [ngClass]="value === (o.value === 'YES') ? (o.value === 'YES' ? 'bg-brand-600 text-white border-brand-600' : 'bg-ink-800 text-white border-ink-800') : 'bg-white text-ink-700 border-ink-200 hover:border-ink-400'"
                [disabled]="disabled" (click)="emit(o.value === 'YES')">{{ o.label }}</button>
      </div>

      <div *ngSwitchCase="'multi'" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label *ngFor="let c of choices" class="flex items-center gap-2 text-sm text-ink-700">
          <input type="checkbox" [checked]="isChecked(c.value)" [disabled]="disabled" (change)="toggle(c.value, $any($event.target).checked)" />
          {{ c.label }}
        </label>
      </div>

      <input *ngSwitchCase="'tags'" class="input" [id]="id" type="text" [value]="tagsText" [disabled]="disabled"
             (change)="emitTags($any($event.target).value)" />

      <input *ngSwitchCase="'number'" class="input" [id]="id" type="number" [attr.min]="field.min" [attr.max]="field.max" [value]="value ?? ''"
             [disabled]="disabled" (input)="emitNumber($any($event.target).value)" />

      <input *ngSwitchCase="'percent'" class="input" [id]="id" type="number" step="0.01" min="0" max="100" [value]="value ?? ''"
             [disabled]="disabled" (input)="emitNumber($any($event.target).value)" />

      <input *ngSwitchCase="'date'" class="input" [id]="id" type="date" [value]="value ?? ''" [disabled]="disabled"
             (input)="emit($any($event.target).value)" />

      <input *ngSwitchCase="'email'" class="input" [id]="id" type="email" autocomplete="off" [value]="value ?? ''" [disabled]="disabled"
             (input)="emit($any($event.target).value)" />

      <input *ngSwitchCase="'tel'" class="input" [id]="id" type="tel" autocomplete="off" [value]="value ?? ''" [disabled]="disabled"
             (input)="emit($any($event.target).value)" />

      <input *ngSwitchDefault class="input" [id]="id" type="text" [value]="value ?? ''" [disabled]="disabled"
             [attr.maxlength]="field.max" (input)="emit($any($event.target).value)" />
    </ng-container>

    <p *ngIf="error" class="text-xs text-red-600 mt-1" role="alert">{{ error }}</p>
    <p *ngIf="!error && field.hint" class="text-xs text-ink-500 mt-1">{{ field.hint }}</p>
  </div>
  `
})
export class KycFieldComponent {
  @Input({ required: true }) field!: KycField;
  @Input() value: any;
  @Input() choices: Choice[] = [];
  @Input() required = false;
  @Input() disabled = false;
  @Input() error = '';
  @Input() id = '';
  @Output() valueChange = new EventEmitter<any>();

  readonly yesNo: Choice[] = [{ value: 'YES', label: 'Yes' }, { value: 'NO', label: 'No' }];

  get tagsText(): string {
    return Array.isArray(this.value) ? this.value.join(', ') : '';
  }

  emit(v: unknown) {
    this.valueChange.emit(v === '' ? undefined : v);
  }

  emitNumber(raw: string) {
    this.valueChange.emit(raw === '' ? undefined : Number(raw));
  }

  emitTags(raw: string) {
    const items = raw.split(',').map(s => s.trim()).filter(Boolean);
    this.valueChange.emit(items.length ? items : undefined);
  }

  isChecked(v: string): boolean {
    return Array.isArray(this.value) && this.value.includes(v);
  }

  toggle(v: string, on: boolean) {
    const current: string[] = Array.isArray(this.value) ? [...this.value] : [];
    const next = on ? [...new Set([...current, v])] : current.filter(x => x !== v);
    this.valueChange.emit(next.length ? next : undefined);
  }
}
