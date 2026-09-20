import { AbstractControl, ValidationErrors } from '@angular/forms';

/** Same rule as the backend: 8+ characters with an upper-case letter, a lower-case letter, a digit and a special character. */
export const PASSWORD_RULES: { key: string; label: string; test: (v: string) => boolean }[] = [
  { key: 'length', label: 'At least 8 characters', test: v => v.length >= 8 },
  { key: 'upper', label: 'An upper-case letter', test: v => /[A-Z]/.test(v) },
  { key: 'lower', label: 'A lower-case letter', test: v => /[a-z]/.test(v) },
  { key: 'digit', label: 'A number', test: v => /\d/.test(v) },
  { key: 'special', label: 'A special character', test: v => /[^A-Za-z0-9]/.test(v) }
];

export function passwordPolicy(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '') as string;
  if (!value) return null;
  const failed = PASSWORD_RULES.filter(r => !r.test(value)).map(r => r.key);
  return failed.length ? { passwordPolicy: failed } : null;
}

export function matchesField(other: string) {
  return (control: AbstractControl): ValidationErrors | null => {
    const parent = control.parent;
    if (!parent) return null;
    return control.value === parent.get(other)?.value ? null : { mismatch: true };
  };
}
