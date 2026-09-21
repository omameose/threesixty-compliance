import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AiApiService, RiskScore, RiskScoreRequest } from '../../../core/services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ComplianceApiService } from '../../../core/services/compliance-api.service';
import { Customer } from '../../../core/models/models';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const LEVEL_BADGE: Record<string, string> = { low: 'badge-green', medium: 'badge-yellow', high: 'badge-red', critical: 'badge-red' };

/**
 * Customer risk assessment. The score, factors, due-diligence level and review frequency are computed by fixed, explainable rules from what
 * you enter (the country list is a built-in starting point that your compliance team should review); a language model, if configured, only
 * words the explanation. Below it: how your real customers scored when they were onboarded.
 */
@Component({
  selector: 'app-customer-risk-engine',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PageHeaderComponent],
  template: `
  <app-page-header title="Customer Risk Engine" subtitle="Score a customer's risk and see exactly which factors drove it."></app-page-header>
  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>
  <p *ngIf="!canRun" class="mb-4 text-sm text-ink-500">Scoring needs the Reviewer role (level 3) or higher.</p>

  <div class="grid lg:grid-cols-[minmax(0,420px)_1fr] gap-5 items-start">
    <section class="card p-5">
      <h2 class="font-semibold text-ink-900 mb-3">What do you know about the customer?</h2>
      <form (ngSubmit)="run()" class="space-y-3" novalidate>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="label" for="r-type">Customer is</label><select id="r-type" class="input" [(ngModel)]="f.subjectType" name="subjectType"><option value="individual">A person</option><option value="business">A business</option></select></div>
          <div><label class="label" for="r-country">Country</label><input id="r-country" class="input" [(ngModel)]="f.country" name="country" maxlength="80"/></div>
          <div><label class="label" for="r-nat">Nationality</label><input id="r-nat" class="input" [(ngModel)]="f.nationality" name="nationality" maxlength="80"/></div>
          <div><label class="label" for="r-op">Operating country</label><input id="r-op" class="input" [(ngModel)]="f.operatingCountry" name="operatingCountry" maxlength="80"/></div>
          <div class="col-span-2"><label class="label" for="r-ind">Industry</label><input id="r-ind" class="input" [(ngModel)]="f.industry" name="industry" maxlength="120" placeholder="e.g. Money transfer, Real estate"/></div>
          <div><label class="label" for="r-prod">Product risk</label><select id="r-prod" class="input" [(ngModel)]="productRisk" name="productRisk"><option value="">Not stated</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></select></div>
          <div><label class="label" for="r-fail">Failed ID checks</label><input id="r-fail" class="input" type="number" min="0" max="20" [(ngModel)]="failed" name="failed"/></div>
          <div><label class="label" for="r-vol">Expected monthly volume</label><input id="r-vol" class="input" type="number" min="0" [(ngModel)]="volume" name="volume"/></div>
          <div><label class="label" for="r-layers">Ownership layers</label><input id="r-layers" class="input" type="number" min="0" max="20" [(ngModel)]="layers" name="layers"/></div>
        </div>
        <fieldset class="grid grid-cols-2 gap-2 text-sm">
          <legend class="label">Red flags</legend>
          <label *ngFor="let t of toggles" class="flex items-center gap-2"><input type="checkbox" [(ngModel)]="flags[t.key]" [name]="t.key"/> {{ t.label }}</label>
        </fieldset>
        <button class="btn-primary w-full" type="submit" [disabled]="!canRun || busy()">{{ busy() ? 'Scoring...' : 'Calculate risk' }}</button>
      </form>
    </section>

    <div class="space-y-5">
      <section class="card p-5" *ngIf="result() as r; else hint">
        <div class="flex items-center justify-between">
          <div><p class="muted">Risk score</p><p class="text-5xl font-extrabold text-ink-950">{{ r.score }}<span class="text-xl text-ink-400">/100</span></p></div>
          <span [ngClass]="badge(r.level)" class="text-sm">{{ r.level | titlecase }} risk</span>
        </div>
        <div class="h-2 rounded bg-ink-100 mt-3"><div class="h-full rounded" [ngClass]="r.level === 'low' ? 'bg-brand-500' : r.level === 'medium' ? 'bg-amber-500' : 'bg-red-500'" [style.width.%]="r.score"></div></div>
        <p class="text-sm text-ink-700 mt-4">{{ r.explanation }}</p>
        <div class="grid sm:grid-cols-2 gap-4 mt-4 text-sm">
          <div class="bg-ink-50 rounded-lg p-3"><p class="text-ink-500 text-xs">Recommended due diligence</p><p class="font-medium text-ink-900">{{ r.recommendedDueDiligence }}</p></div>
          <div class="bg-ink-50 rounded-lg p-3"><p class="text-ink-500 text-xs">Review this customer</p><p class="font-medium text-ink-900">every {{ r.reviewFrequencyMonths }} months</p></div>
        </div>
        <h3 class="text-sm font-semibold text-ink-800 mt-5 mb-2">What drove the score</h3>
        <ul class="space-y-2"><li *ngFor="let x of r.factors" class="text-sm">
          <div class="flex justify-between"><span class="font-medium text-ink-800">{{ x.label }}</span><span class="text-ink-600">+{{ x.points }}</span></div>
          <p class="text-xs text-ink-500">{{ x.detail }}</p></li>
          <li *ngIf="!r.factors.length" class="text-sm text-ink-500">No risk factors were found in what you entered.</li></ul>
        <p class="text-xs text-ink-400 mt-4">Country list: {{ r.countryListVersion }}.</p>
        <button *ngIf="canRun && (r.level === 'high' || r.level === 'critical')" class="btn-secondary mt-3" [disabled]="busy()" (click)="openCase(r)">Open a case for this customer</button>
      </section>
      <ng-template #hint><section class="card p-6 text-sm text-ink-500">Fill in what you know and press "Calculate risk". Leave anything unknown empty.</section></ng-template>

      <section class="card">
        <div class="p-4 border-b border-ink-100"><h2 class="font-semibold text-ink-900">Your customers, highest risk first</h2>
          <p class="text-xs text-ink-500">The score each customer received from their onboarding answers.</p></div>
        <div class="overflow-x-auto"><table class="table">
          <thead><tr><th>Customer</th><th>Form</th><th>Status</th><th>Risk</th></tr></thead>
          <tbody>
            <tr *ngFor="let c of customers()"><td><a [routerLink]="['/app/my-clients', c.id]" class="font-medium text-ink-900 hover:text-brand-700">{{ c.fullName }}</a><div class="text-xs text-ink-400">{{ c.country || '—' }}</div></td>
              <td class="text-sm">{{ c.formName }}</td><td class="text-sm">{{ c.status.replace('_', ' ') }}</td>
              <td><span [ngClass]="badge(c.riskLevel)">{{ c.riskLevel | titlecase }}</span> <span class="text-xs text-ink-400">{{ c.riskScore }}</span></td></tr>
            <tr *ngIf="loaded && !customers().length"><td colspan="4" class="text-center text-sm text-ink-400 py-6">No customers yet.</td></tr>
          </tbody></table></div>
      </section>
    </div>
  </div>
  `
})
export class CustomerRiskEngineComponent implements OnInit {
  f: RiskScoreRequest = { subjectType: 'individual' };
  productRisk = '';
  failed: number | null = null;
  volume: number | null = null;
  layers: number | null = null;
  readonly toggles = [
    { key: 'pepDeclared', label: 'Says they are a PEP' }, { key: 'pepMatch', label: 'Matched a PEP list' }, { key: 'adverseMedia', label: 'Adverse media found' },
    { key: 'sanctionsDeclared', label: 'Sanctions exposure declared' }, { key: 'sanctionsHit', label: 'Matched a sanctions list' }, { key: 'nonFaceToFace', label: 'Onboarded remotely' },
    { key: 'complexOwnership', label: 'Complex ownership' }, { key: 'bearerShares', label: 'Bearer shares' }, { key: 'cashIntensive', label: 'Cash-intensive business' },
    { key: 'documentsIncomplete', label: 'Documents incomplete' }, { key: 'uboUnknown', label: 'Owner not identified' }
  ];
  flags: Record<string, boolean> = {};
  busy = signal(false);
  error = signal('');
  result = signal<RiskScore | null>(null);
  customers = signal<Customer[]>([]);
  loaded = false;

  constructor(private ai: AiApiService, private auth: AuthService, private compliance: ComplianceApiService, private router: Router) {}

  get canRun() { return this.auth.hasMinRole(3); }
  badge(l: string) { return LEVEL_BADGE[l] ?? 'badge-gray'; }

  ngOnInit() {
    this.compliance.customers({ size: 100 }).subscribe({
      next: p => { this.customers.set([...p.items].sort((a, b) => b.riskScore - a.riskScore).slice(0, 10)); this.loaded = true; },
      error: () => { this.loaded = true; }
    });
  }

  private body(): RiskScoreRequest {
    const b: RiskScoreRequest = { ...this.f };
    for (const k of ['country', 'nationality', 'operatingCountry', 'industry'] as const) if (!b[k]?.trim()) delete b[k]; else b[k] = b[k]!.trim();
    for (const t of ['pepDeclared', 'pepMatch', 'adverseMedia', 'sanctionsDeclared', 'sanctionsHit', 'nonFaceToFace', 'complexOwnership', 'bearerShares', 'cashIntensive'] as const) if (this.flags[t]) b[t] = true;
    if (this.flags['documentsIncomplete']) b.documentsComplete = false;
    if (this.flags['uboUnknown']) b.uboIdentified = false;
    if (this.productRisk) b.productRisk = this.productRisk as 'low' | 'medium' | 'high';
    if (this.failed) b.failedVerifications = Number(this.failed);
    if (this.volume) b.expectedMonthlyVolume = Number(this.volume);
    if (this.layers) b.ownershipLayers = Number(this.layers);
    return b;
  }

  run() {
    this.busy.set(true);
    this.error.set('');
    this.ai.score(this.body()).subscribe({
      next: r => { this.busy.set(false); this.result.set(r); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  openCase(r: RiskScore) {
    this.busy.set(true);
    const name = this.f.country ? `${this.f.subjectType === 'business' ? 'Business' : 'Customer'} in ${this.f.country}` : 'High-risk customer';
    this.ai.createCase({
      title: `High risk score: ${name}`, subjectType: this.f.subjectType, description: r.explanation,
      evidence: [{ type: 'risk_score', code: 'RISK_SCORE', severity: r.level === 'critical' ? 'critical' : 'high', description: `Risk score ${r.score}/100 (${r.level}). ${r.factors.map(x => x.label).join('; ')}.` }]
    }).subscribe({
      next: c => { this.busy.set(false); this.router.navigate(['/app/cases', c.caseId]); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }
}
