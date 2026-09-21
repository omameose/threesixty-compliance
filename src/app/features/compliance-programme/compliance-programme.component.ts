import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiError } from '../../core/http/api.service';
import { AiApiService, Framework, GovernanceCatalogue, ModelInfo } from '../../core/services/ai-api.service';
import { AuthService } from '../../core/services/auth.service';
import { ComplianceApiService } from '../../core/services/compliance-api.service';
import { VerificationApiService } from '../../core/services/verification-api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

type Status = 'implemented' | 'partial' | 'not_implemented' | 'not_applicable';

interface AssessmentOut {
  frameworkName: string; overallScorePercent: number | null; rating: string; answered: number; totalControls: number; unanswered: unknown[];
  byDomain: { domain: string; scorePercent: number | null; controls: number }[];
  gaps: { controlId: string; domain: string; requirement: string; status: string; priority: string; remediation: string; evidenceToCollect?: string; note?: string }[];
  disclaimer: string; summary: string; model: ModelInfo;
}
interface PolicyOut {
  policyName: string; coverageScorePercent: number; rating: string; present: { clause: string; label: string }[]; missing: { clause: string; label: string; suggestion: string }[];
  notes: string[]; wordCount: number; method: string; disclaimer: string; reviewNotes: string; model: ModelInfo;
}
interface ReportOut {
  reportType: string; overallStatus: string; kpis: { key: string; label: string; value: number | null; unit: string; previous?: number | null; change?: number | null; status: string }[];
  findings: { severity: string; finding: string }[]; recommendations: string[]; executiveSummary: string; markdown: string; model: ModelInfo;
}

const RATING_CLASS: Record<string, string> = { strong: 'badge-green', good: 'badge-green', adequate: 'badge-yellow', partial: 'badge-yellow', weak: 'badge-red', poor: 'badge-red' };

/**
 * The compliance programme workbench: a self-assessment against a control catalogue, a coverage check of your written policies, and
 * management reports built from your real figures. Everything is worked out by fixed rules; a language model (if configured) only words the
 * summaries. These are aids for the compliance officer, not legal advice or a regulatory determination, and every result says so.
 */
@Component({
  selector: 'app-compliance-programme',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
  <app-page-header title="AML Compliance Programme" subtitle="Assess your controls, check your policies and produce management reports."></app-page-header>
  <p *ngIf="!allowed" class="mb-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-sm">This workbench is for the Compliance Officer role (level 4) or higher.</p>
  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

  <div class="flex items-center bg-ink-100 rounded-lg p-1 w-fit mb-5">
    <button class="px-4 py-2 rounded-md text-sm font-medium" [class.bg-white]="tab === 'assess'" (click)="tab = 'assess'">Control assessment</button>
    <button class="px-4 py-2 rounded-md text-sm font-medium" [class.bg-white]="tab === 'policy'" (click)="tab = 'policy'">Policy review</button>
    <button class="px-4 py-2 rounded-md text-sm font-medium" [class.bg-white]="tab === 'report'" (click)="tab = 'report'">Reports</button>
  </div>

  <!-- ASSESSMENT -->
  <div *ngIf="tab === 'assess'" class="grid lg:grid-cols-[1fr_380px] gap-5 items-start">
    <section class="card p-5">
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <label class="label !mb-0" for="fw">Framework</label>
        <select id="fw" class="input !w-auto" [(ngModel)]="frameworkKey" (ngModelChange)="assessment.set(null)">
          <option *ngFor="let f of catalogue()?.frameworks" [value]="f.key">{{ f.name }}</option></select>
        <span class="text-sm text-ink-500">{{ answeredCount() }} of {{ framework()?.controls?.length || 0 }} answered</span>
      </div>
      <p class="text-sm text-ink-500 mb-4">{{ framework()?.description }}</p>
      <div *ngFor="let c of framework()?.controls" class="py-3 border-t border-ink-100">
        <p class="text-sm font-medium text-ink-900"><span class="font-mono text-xs text-ink-400 mr-2">{{ c.id }}</span>{{ c.requirement }}</p>
        <p class="text-xs text-ink-500 mt-1">{{ c.domain }} &middot; weight {{ c.weight }}<span *ngIf="c.evidenceExamples"> &middot; evidence: {{ c.evidenceExamples }}</span></p>
        <div class="flex flex-wrap gap-2 mt-2">
          <button *ngFor="let s of statuses" type="button" class="px-3 py-1 rounded-lg border text-xs font-medium"
                  [ngClass]="answers[c.id]?.status === s.value ? s.active : 'bg-white text-ink-600 border-ink-200 hover:border-ink-400'" (click)="answer(c.id, s.value)">{{ s.label }}</button>
        </div>
        <input *ngIf="answers[c.id]" class="input mt-2 text-sm" [ngModel]="answers[c.id].note" (ngModelChange)="answers[c.id].note = $event" maxlength="1000" placeholder="Note or evidence (optional)" [attr.aria-label]="'Note for ' + c.id"/>
      </div>
      <button class="btn-primary mt-4" [disabled]="!allowed || busy() || !answeredCount()" (click)="assess()">{{ busy() ? 'Assessing...' : 'Assess my answers' }}</button>
    </section>

    <section class="card p-5 lg:sticky lg:top-2" *ngIf="assessment() as a; else assessHint">
      <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-ink-900">{{ a.frameworkName }}</h2><span [ngClass]="ratingClass(a.rating)">{{ a.rating }}</span></div>
      <p class="text-4xl font-extrabold text-ink-950">{{ a.overallScorePercent ?? '—' }}<span class="text-lg text-ink-500" *ngIf="a.overallScorePercent !== null">%</span></p>
      <p class="text-sm text-ink-600 mt-2">{{ a.summary }}</p>
      <h3 class="text-sm font-semibold text-ink-800 mt-4 mb-1">By area</h3>
      <div *ngFor="let d of a.byDomain" class="mb-2"><div class="flex justify-between text-xs"><span>{{ d.domain }}</span><span>{{ d.scorePercent ?? '—' }}<span *ngIf="d.scorePercent !== null">%</span></span></div>
        <div class="h-1.5 bg-ink-100 rounded"><div class="h-full bg-brand-600 rounded" [style.width.%]="d.scorePercent || 0"></div></div></div>
      <h3 class="text-sm font-semibold text-ink-800 mt-4 mb-1">Gaps to close ({{ a.gaps.length }})</h3>
      <ul class="space-y-3 max-h-[420px] overflow-y-auto">
        <li *ngFor="let g of a.gaps" class="text-sm"><span [ngClass]="g.priority === 'high' ? 'badge-red' : g.priority === 'medium' ? 'badge-yellow' : 'badge-gray'">{{ g.priority }}</span>
          <span class="font-mono text-xs text-ink-400 ml-2">{{ g.controlId }}</span><p class="text-ink-800 mt-1">{{ g.requirement }}</p><p class="text-ink-500 text-xs mt-1">{{ g.remediation }}</p></li>
      </ul>
      <p class="text-xs text-ink-400 mt-4">{{ a.disclaimer }}</p>
    </section>
    <ng-template #assessHint><section class="card p-6 text-sm text-ink-500">Answer the controls that apply, then press "Assess my answers" for a score, the gaps and what to fix first.</section></ng-template>
  </div>

  <!-- POLICY REVIEW -->
  <div *ngIf="tab === 'policy'" class="grid lg:grid-cols-2 gap-5 items-start">
    <section class="card p-5">
      <div class="mb-3"><label class="label" for="pt">Policy type</label>
        <select id="pt" class="input" [(ngModel)]="policyType"><option *ngFor="let p of catalogue()?.policyTypes" [value]="p.key">{{ p.name }} ({{ p.clauses }} topics checked)</option></select></div>
      <label class="label" for="ptext">Paste the policy text</label>
      <textarea id="ptext" class="input font-mono text-xs" rows="14" [(ngModel)]="policyText" maxlength="60000" placeholder="Paste the full text of the policy here..."></textarea>
      <button class="btn-primary mt-3" [disabled]="!allowed || busy() || policyText.trim().length < 20" (click)="review()">{{ busy() ? 'Checking...' : 'Check coverage' }}</button>
    </section>
    <section class="card p-5" *ngIf="policy() as p; else policyHint">
      <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-ink-900">{{ p.policyName }}</h2><span [ngClass]="ratingClass(p.rating)">{{ p.rating }}</span></div>
      <p class="text-3xl font-extrabold text-ink-950">{{ p.coverageScorePercent }}<span class="text-lg text-ink-500">% of topics covered</span></p>
      <p class="text-sm text-ink-600 mt-2">{{ p.reviewNotes }}</p>
      <h3 class="text-sm font-semibold text-ink-800 mt-4 mb-1">Missing topics ({{ p.missing.length }})</h3>
      <ul class="space-y-2"><li *ngFor="let m of p.missing" class="text-sm"><span class="font-medium text-ink-800">{{ m.label }}</span><p class="text-xs text-ink-500">{{ m.suggestion }}</p></li>
        <li *ngIf="!p.missing.length" class="text-sm text-ink-500">Every expected topic is mentioned.</li></ul>
      <h3 class="text-sm font-semibold text-ink-800 mt-4 mb-1">Mentioned ({{ p.present.length }})</h3>
      <p class="text-xs text-ink-500">{{ presentLabels(p) }}</p>
      <p class="text-xs text-ink-400 mt-4">{{ p.method }} {{ p.disclaimer }}</p>
    </section>
    <ng-template #policyHint><section class="card p-6 text-sm text-ink-500">Paste a policy to see which expected topics it mentions and which are missing. This is a keyword check: a person still has to judge whether each topic is handled well.</section></ng-template>
  </div>

  <!-- REPORTS -->
  <div *ngIf="tab === 'report'" class="grid lg:grid-cols-[380px_1fr] gap-5 items-start">
    <section class="card p-5">
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div><label class="label" for="rt">Report</label><select id="rt" class="input" [(ngModel)]="reportType"><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="annual">Annual</option><option value="board">Board</option></select></div>
        <div></div>
        <div><label class="label" for="rf">From</label><input id="rf" class="input" type="date" [(ngModel)]="from"/></div>
        <div><label class="label" for="rto">To</label><input id="rto" class="input" type="date" [(ngModel)]="to"/></div>
      </div>
      <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-ink-900 text-sm">Figures for the period</h2>
        <button class="btn-secondary btn-sm" [disabled]="busy()" (click)="fillFromData()">Fill from my data</button></div>
      <p class="text-xs text-ink-500 mb-3">Filled from your customers, checks and cases (all time, not just the period). Edit anything that is not right; leave unknowns empty.</p>
      <div class="grid grid-cols-2 gap-3">
        <div *ngFor="let m of metricFields"><label class="label text-xs" [attr.for]="'m-' + m.key">{{ m.label }}</label>
          <input [id]="'m-' + m.key" class="input" type="number" min="0" [(ngModel)]="metrics[m.key]"/></div>
      </div>
      <button class="btn-primary w-full mt-4" [disabled]="!allowed || busy() || !from || !to" (click)="generate()">{{ busy() ? 'Preparing...' : 'Generate report' }}</button>
    </section>

    <section class="card p-5" *ngIf="report() as r; else reportHint">
      <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-ink-900">{{ r.reportType | titlecase }} report</h2>
        <span [ngClass]="r.overallStatus === 'green' ? 'badge-green' : r.overallStatus === 'amber' ? 'badge-yellow' : 'badge-red'">{{ r.overallStatus }}</span></div>
      <p class="text-sm text-ink-700 whitespace-pre-line">{{ r.executiveSummary }}</p>
      <div class="grid sm:grid-cols-2 gap-3 mt-4">
        <div *ngFor="let k of r.kpis" class="border border-ink-100 rounded-lg p-3">
          <div class="flex justify-between text-xs text-ink-500"><span>{{ k.label }}</span><span [ngClass]="k.status === 'green' ? 'text-brand-600' : k.status === 'amber' ? 'text-amber-600' : 'text-red-600'">&#9679; {{ k.status }}</span></div>
          <p class="text-xl font-bold text-ink-950">{{ k.value ?? '—' }}<span class="text-sm text-ink-500"> {{ k.unit }}</span></p>
        </div>
      </div>
      <h3 class="text-sm font-semibold text-ink-800 mt-4 mb-1">Findings</h3>
      <ul class="space-y-1"><li *ngFor="let f of r.findings" class="text-sm"><span [ngClass]="f.severity === 'high' ? 'badge-red' : f.severity === 'medium' ? 'badge-yellow' : 'badge-gray'" class="mr-2">{{ f.severity }}</span>{{ f.finding }}</li></ul>
      <h3 class="text-sm font-semibold text-ink-800 mt-4 mb-1">Recommendations</h3>
      <ul class="list-disc ml-5 text-sm text-ink-700 space-y-1"><li *ngFor="let x of r.recommendations">{{ x }}</li></ul>
      <button class="btn-secondary mt-5" (click)="download(r)">Download as a document (Markdown)</button>
    </section>
    <ng-template #reportHint><section class="card p-6 text-sm text-ink-500">Choose the period and press "Fill from my data", then generate a report with traffic-light figures, findings and recommendations.</section></ng-template>
  </div>
  `
})
export class ComplianceProgrammeComponent implements OnInit {
  tab: 'assess' | 'policy' | 'report' = 'assess';
  catalogue = signal<GovernanceCatalogue | null>(null);
  busy = signal(false);
  error = signal('');
  assessment = signal<AssessmentOut | null>(null);
  policy = signal<PolicyOut | null>(null);
  report = signal<ReportOut | null>(null);

  frameworkKey = '';
  answers: Record<string, { status: Status; note?: string }> = {};
  readonly statuses: { value: Status; label: string; active: string }[] = [
    { value: 'implemented', label: 'Implemented', active: 'bg-brand-600 text-white border-brand-600' },
    { value: 'partial', label: 'Partly', active: 'bg-amber-500 text-white border-amber-500' },
    { value: 'not_implemented', label: 'Not implemented', active: 'bg-red-600 text-white border-red-600' },
    { value: 'not_applicable', label: 'Not applicable', active: 'bg-ink-700 text-white border-ink-700' }
  ];

  policyType = '';
  policyText = '';

  reportType = 'monthly';
  from = ''; to = '';
  metrics: Record<string, number | null> = {};
  readonly metricFields = [
    { key: 'customersOnboarded', label: 'Customers onboarded' }, { key: 'approved', label: 'Approved' }, { key: 'rejected', label: 'Rejected' }, { key: 'pending', label: 'Pending review' },
    { key: 'avgReviewHours', label: 'Average review time (hours)' }, { key: 'slaBreaches', label: 'Review deadlines missed' }, { key: 'verificationsRun', label: 'Identity checks run' },
    { key: 'verificationsFailed', label: 'Identity checks failed' }, { key: 'highRiskCustomers', label: 'High-risk customers' }, { key: 'alertsRaised', label: 'Alerts raised' },
    { key: 'alertsClosed', label: 'Alerts closed' }, { key: 'casesOverdue', label: 'Cases overdue' }, { key: 'strFiled', label: 'Reports filed' },
    { key: 'trainingCompletionPct', label: 'Staff training done (%)' }, { key: 'policyReviewsDue', label: 'Policy reviews due' }
  ];

  constructor(private ai: AiApiService, private auth: AuthService, private compliance: ComplianceApiService, private verifications: VerificationApiService) {}

  get allowed() { return this.auth.hasMinRole(4); }
  framework(): Framework | undefined { return this.catalogue()?.frameworks.find(f => f.key === this.frameworkKey); }
  answeredCount() { return Object.keys(this.answers).length; }
  ratingClass(r: string) { return RATING_CLASS[r.toLowerCase()] ?? 'badge-gray'; }
  presentLabels(p: PolicyOut) { return p.present.map(x => x.label).join(', ') || 'None'; }

  ngOnInit() {
    const now = new Date();
    this.from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    this.to = now.toISOString().slice(0, 10);
    this.ai.governance().subscribe({
      next: c => { this.catalogue.set(c); this.frameworkKey = c.frameworks[0]?.key ?? ''; this.policyType = c.policyTypes[0]?.key ?? ''; },
      error: (e: ApiError) => this.error.set(e.httpStatus === 403 ? 'This workbench needs the Compliance Officer role (level 4) or higher.' : e.userMessage)
    });
  }

  answer(id: string, status: Status) { this.answers = { ...this.answers, [id]: { status, note: this.answers[id]?.note } }; this.assessment.set(null); }

  private call<T>(obs: import('rxjs').Observable<T>, done: (r: T) => void) {
    this.busy.set(true);
    this.error.set('');
    obs.subscribe({ next: r => { this.busy.set(false); done(r); }, error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); } });
  }

  assess() {
    const responses: Record<string, { status: string; note?: string }> = {};
    const mine = new Set(this.framework()?.controls.map(c => c.id) ?? []);
    for (const [id, a] of Object.entries(this.answers)) if (mine.has(id)) responses[id] = { status: a.status, note: a.note?.trim() || undefined };
    this.call(this.ai.assess(this.frameworkKey, responses), r => this.assessment.set(r as unknown as AssessmentOut));
  }

  review() { this.call(this.ai.reviewPolicy(this.policyType, this.policyText), r => this.policy.set(r as unknown as PolicyOut)); }

  /** Counts from the company's real records, so the report starts from facts instead of guesses. */
  fillFromData() {
    this.busy.set(true);
    this.error.set('');
    forkJoin({ customers: this.compliance.customers({ size: 200 }), checks: this.verifications.list(100), stats: this.ai.caseStats() }).subscribe({
      next: ({ customers, checks, stats }) => {
        this.busy.set(false);
        const c = customers.items;
        const count = (f: (x: (typeof c)[number]) => boolean) => c.filter(f).length;
        this.metrics = {
          ...this.metrics,
          customersOnboarded: customers.totalItems, approved: count(x => x.status === 'approved'), rejected: count(x => x.status === 'rejected'),
          pending: count(x => x.status === 'pending_review' || x.status === 'in_progress' || x.status === 'more_info_required'),
          highRiskCustomers: count(x => x.riskLevel === 'high'), verificationsRun: checks.items.length,
          verificationsFailed: checks.items.filter(v => v.status === 'FAILED').length, casesOverdue: stats.overdue
        };
      },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.httpStatus === 403 ? 'Reading customers and checks needs a higher role; fill the figures by hand.' : e.userMessage); }
    });
  }

  generate() {
    const metrics: Record<string, number> = {};
    for (const [k, v] of Object.entries(this.metrics)) if (v !== null && v !== undefined && `${v}` !== '') metrics[k] = Number(v);
    this.call(this.ai.report({ reportType: this.reportType, companyName: this.auth.currentUser()?.companyName, period: { from: this.from, to: this.to }, metrics }),
      r => this.report.set(r as unknown as ReportOut));
  }

  download(r: ReportOut) {
    const url = URL.createObjectURL(new Blob([r.markdown], { type: 'text/markdown' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${this.from}-to-${this.to}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
