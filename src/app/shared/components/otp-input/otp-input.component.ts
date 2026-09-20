import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, QueryList, ViewChildren } from '@angular/core';

/** Six boxes for a one-time code. Handles typing, backspace, arrow keys and pasting the whole code. */
@Component({
  selector: 'app-otp-input',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex gap-2 sm:gap-3" (paste)="onPaste($event)">
      <input *ngFor="let d of digits; let i = index; trackBy: byIndex" #box
             class="input text-center text-xl font-bold w-12 h-14 sm:w-14"
             maxlength="1" inputmode="numeric" autocomplete="one-time-code"
             [attr.aria-label]="'Digit ' + (i + 1)"
             [disabled]="disabled"
             [value]="digits[i]"
             (input)="onInput($event, i)"
             (keydown)="onKeydown($event, i)"
             (focus)="select($event)"/>
    </div>
  `
})
export class OtpInputComponent {
  @Input() length = 6;
  @Input() disabled = false;
  /** Emits the code whenever it changes ('' until every box is filled). */
  @Output() codeChange = new EventEmitter<string>();
  @ViewChildren('box') boxes!: QueryList<ElementRef<HTMLInputElement>>;
  digits: string[] = Array(6).fill('');

  ngOnInit() {
    this.digits = Array(this.length).fill('');
  }

  /** Track boxes by position: tracking by value would rebuild a box (and lose focus) every time its digit changes. */
  byIndex = (index: number) => index;

  clear() {
    this.digits = Array(this.length).fill('');
    this.emit();
    setTimeout(() => this.boxes.first?.nativeElement.focus());
  }

  onInput(e: Event, i: number) {
    const el = e.target as HTMLInputElement;
    const val = el.value.replace(/\D/g, '').slice(-1);
    el.value = val;
    this.digits[i] = val;
    if (val && i < this.length - 1) this.focus(i + 1);
    this.emit();
  }

  onKeydown(e: KeyboardEvent, i: number) {
    if (e.key === 'Backspace' && !this.digits[i] && i > 0) this.focus(i - 1);
    if (e.key === 'ArrowLeft' && i > 0) this.focus(i - 1);
    if (e.key === 'ArrowRight' && i < this.length - 1) this.focus(i + 1);
  }

  onPaste(e: ClipboardEvent) {
    const text = (e.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, this.length);
    if (!text) return;
    e.preventDefault();
    this.digits = Array.from({ length: this.length }, (_, i) => text[i] ?? '');
    this.emit();
    this.focus(Math.min(text.length, this.length - 1));
  }

  select(e: Event) {
    (e.target as HTMLInputElement).select();
  }

  private focus(i: number) {
    this.boxes.toArray()[i]?.nativeElement.focus();
  }

  private emit() {
    const code = this.digits.join('');
    this.codeChange.emit(code.length === this.length ? code : '');
  }
}
