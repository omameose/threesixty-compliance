import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '../../core/http/api.service';
import { AiApiService, ScreeningHit, ScreeningResult } from '../../core/services/ai-api.service';
import { AuthService } from '../../core/services/auth.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

type Kind = 'sanctions' | 'pep' | 'adverse-media';

const KINDS: Record<Kind, { title: string; subtitle: string; type: string }> = {
  sanctions: { title: 'Sanctions Screening', subtitle: 'Check a name against sanctions lists.', type: 'sanction' },
  pep: { title: 'PEP Screening', subtitle: 'Check whether a person is, or is close to, a politically exposed person.', type: 'pep' },
  'adverse-media': { title: 'Adverse Media Intelligence', subtitle: 'Check a name against adverse-media entries.', type: 'adverse_media' }
};

/**
 * Name screening against the loaded watchlist. IMPORTANT: unless a real list has been loaded on the server (WATCHLIST_FILE) the list is a
 * few fictional demonstration names, and the service says so in every answer; this page shows that warning before and after a check.
 * Results are not stored. A hit can be turned into an investigation case, which is where the decision is recorded.
 */
@Component({
  selector: 'app-screening-tool',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
  <app-page-header [title]="text.title" [subtitle]="text.subtitle"></app-page-header>

  <div *ngIf="sample()" class="mb-5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm" role="note">
    <strong>Demonstration list.</strong> No real sanctions, PEP or adverse-media list is loaded on this server yet, only a few fictional names. A "clear" result here does
    <strong>not</strong> mean a person is clear. Load your licensed list (server setting <code>WATCHLIST_FILE</code>) before relying on this.
  </div>
  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

  <div class="grid lg:grid-cols-[minmax(0,380px)_1fr] gap-5 items-start">
    <section class="card p-5">
      <h2 class="font-semibold text-ink-900 mb-3">Screen a name</h2>
      <p *ngIf="!canRun" class="text-sm text-ink-500 mb-3">Screening needs the Reviewer role (level 3) or higher.</p>
      <form (ngSubmit)="run()" class="space-y-3" novalidate>
        <div><label class="label" for="s-name">Full name or company name</label><input id="s-name" class="input" [(ngModel)]="name" name="name" maxlength="200" [disabled]="!canRun || busy()"/></div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label" for="s-dob">Date of birth</label><input id="s-dob" class="input" type="date" [(ngModel)]="dob" name="dob" [disabled]="!canRun || busy()"/></div>
          <div><label class="label" for="s-country">Country</label><input id="s-country" class="input" [(ngModel)]="country" name="country" maxlength="80" [disabled]="!canRun || busy()"/></div>
        </div>
        <div>
          <label class="label" for="s-th">Match sensitivity: {{ threshold | number: '1.2-2' }}</label>
          <input id="s-th" type="range" min="0.6" max="1" step="0.01" class="w-full" [(ngModel)]="threshold" name="threshold" [disabled]="!canRun || busy()"/>
          <p class="text-xs text-ink-500">Lower finds more possible matches (more to review); higher only close matches.</p>
        </div>
        <button class="btn-primary w-full" type="submit" [disabled]="!canRun || busy() || name.trim().length < 2">{{ busy() ? 'Screening...' : 'Screen' }}</button>
      </form>
    </section>

    <section class="card p-5" *ngIf="result() as r; else empty">
      <div class="flex items-center justify-between mb-3">
        <h2 class="font-semibold text-ink-900">Result for "{{ r.screenedName }}"</h2>
        <span [ngClass]="r.hitCount ? 'badge-red' : 'badge-green'">{{ r.hitCount ? r.hitCount + ' possible match' + (r.hitCount > 1 ? 'es' : '') : 'No match found' }}</span>
      </div>
      <p class="text-sm text-ink-600 mb-3">Checked {{ r.entriesChecked }} entries at sensitivity {{ r.threshold | number: '1.2-2' }}. Results are not saved: open a case to keep a record.</p>
      <table class="table" *ngIf="hits().length">
        <thead><tr><th>Listed name</th><th>Type</th><th>List</th><th>Confidence</th><th></th></tr></thead>
        <tbody><tr *ngFor="let h of hits()">
          <td><span class="font-medium text-ink-900">{{ h.listedName }}</span><div class="text-xs text-ink-400" *ngIf="h.matchedName !== h.listedName">matched as "{{ h.matchedName }}"</div>
            <div class="text-xs text-ink-500" *ngFor="let n of h.notes">{{ n }}</div></td>
          <td>{{ typeLabel(h.type) }}</td><td class="text-sm">{{ h.list }}</td>
          <td>{{ h.confidence * 100 | number: '1.0-0' }}%<div class="text-xs text-ink-400">name similarity {{ h.nameSimilarity * 100 | number: '1.0-0' }}%</div></td>
          <td class="text-right"><button *ngIf="canRun" class="btn-secondary btn-sm" [disabled]="busy()" (click)="openCase(h)">Open a case</button></td>
        </tr></tbody>
      </table>
      <p class="text-xs text-ink-400 mt-3" *ngIf="r.note">{{ r.note }}</p>
    </section>
    <ng-template #empty><section class="card p-8 text-center text-sm text-ink-400">Enter a name to screen it.</section></ng-template>
  </div>
  `
})
export class ScreeningToolComponent implements OnInit {
  @Input() kind: Kind = 'sanctions';

  name = ''; dob = ''; country = ''; threshold = 0.85;
  busy = signal(false);
  error = signal('');
  result = signal<ScreeningResult | null>(null);
  sample = signal(false);

  constructor(private ai: AiApiService, private auth: AuthService, private router: Router) {}

  get text() { return KINDS[this.kind]; }
  get canRun() { return this.auth.hasMinRole(3); }

  ngOnInit() {
    this.ai.riskConfig().subscribe({ next: c => this.sample.set(c.watchlistIsSample), error: () => this.sample.set(true) });
  }

  hits(): ScreeningHit[] { return this.result()?.hits ?? []; }
  typeLabel(t: string) { return t === 'sanction' ? 'Sanctions' : t === 'pep' ? 'PEP' : t === 'adverse_media' ? 'Adverse media' : t; }

  run() {
    this.busy.set(true);
    this.error.set('');
    this.ai.screen({ name: this.name.trim(), dateOfBirth: this.dob || undefined, country: this.country.trim() || undefined, threshold: Number(this.threshold), types: [this.text.type] }).subscribe({
      next: r => { this.busy.set(false); this.result.set(r); if (r.sampleData) this.sample.set(true); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  /** The decision about a hit belongs in a case file. */
  openCase(h: ScreeningHit) {
    this.busy.set(true);
    const subject = this.result()?.screenedName ?? this.name;
    this.ai.createCase({
      title: `${this.typeLabel(h.type)} match: ${subject}`, subjectType: 'individual', subjectName: subject,
      description: `Screening of "${subject}" returned a possible match with "${h.listedName}" (${h.list}).`,
      evidence: [{ type: 'screening_hit', code: h.type.toUpperCase(), severity: h.type === 'sanction' ? 'high' : 'medium', ref: h.entryId,
        description: `Possible match with ${h.listedName}, confidence ${Math.round(h.confidence * 100)}%.${this.result()?.sampleData ? ' (Demonstration list.)' : ''}` }]
    }).subscribe({
      next: c => { this.busy.set(false); this.router.navigate(['/app/cases', c.caseId]); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }
}
