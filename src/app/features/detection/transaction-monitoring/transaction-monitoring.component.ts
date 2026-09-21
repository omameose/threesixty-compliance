import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiError } from '../../../core/http/api.service';
import { AiApiService, TxnAlert, TxnAnalysis, Txn } from '../../../core/services/ai-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const SEVERITY: Record<string, string> = { low: 'badge-gray', medium: 'badge-blue', high: 'badge-yellow', critical: 'badge-red' };
const HEADER = 'id,timestamp,amount,direction,counterpartyCountry,counterpartyName';
const EXAMPLE = [HEADER,
  't1,2026-09-01T10:00:00Z,4900000,credit,Nigeria,A. Trader', 't2,2026-09-01T15:30:00Z,4900000,credit,Nigeria,A. Trader', 't3,2026-09-02T09:10:00Z,4800000,credit,Ghana,B. Supplies',
  't4,2026-09-03T11:00:00Z,4950000,credit,Iran,C. Exports', 't5,2026-09-04T16:20:00Z,120000,debit,Nigeria,Utilities Ltd'].join('\n');

/**
 * Transaction monitoring: paste or upload transactions (CSV) and the rules look for structuring below the reporting threshold, bursts,
 * outliers, round amounts, high-risk countries and pass-through activity. Nothing is stored. There is no live feed of your transactions
 * into the platform yet, so this analyses whatever you give it.
 */
@Component({
  selector: 'app-transaction-monitoring',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
  <app-page-header title="Transaction Monitoring" subtitle="Analyse a batch of transactions for suspicious patterns."></app-page-header>
  <div class="mb-5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-sm" role="note">
    Transactions are not connected to the platform automatically. Paste or upload a CSV of the transactions you want checked. Nothing you submit here is saved.
  </div>
  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>
  <p *ngIf="!canRun" class="mb-4 text-sm text-ink-500">Analysis needs the Reviewer role (level 3) or higher.</p>

  <div class="grid lg:grid-cols-[minmax(0,460px)_1fr] gap-5 items-start">
    <section class="card p-5">
      <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-ink-900">Transactions (CSV)</h2>
        <div class="flex gap-2"><button class="btn-secondary btn-sm" (click)="csv = example">Load an example</button>
          <label class="btn-secondary btn-sm cursor-pointer">Upload<input type="file" accept=".csv,text/csv,text/plain" class="hidden" (change)="onFile($event)"/></label></div></div>
      <p class="text-xs text-ink-500 mb-2">Columns: <span class="font-mono">{{ header }}</span>. Timestamps are ISO, e.g. 2026-09-01T10:00:00Z. Up to 5,000 rows.</p>
      <textarea class="input font-mono text-xs" rows="12" [(ngModel)]="csv" aria-label="Transactions CSV" [disabled]="!canRun"></textarea>
      <div class="grid grid-cols-2 gap-3 mt-3">
        <div><label class="label" for="t-th">Reporting threshold</label><input id="t-th" class="input" type="number" min="1" [(ngModel)]="threshold"/></div>
        <div><label class="label" for="t-cur">Currency (optional)</label><input id="t-cur" class="input" [(ngModel)]="currency" maxlength="3" placeholder="NGN"/></div>
      </div>
      <button class="btn-primary w-full mt-4" [disabled]="!canRun || busy() || !csv.trim()" (click)="analyse()">{{ busy() ? 'Analysing...' : 'Analyse' }}</button>
    </section>

    <section class="card p-5" *ngIf="result() as r; else hint">
      <div class="flex items-center justify-between mb-2"><h2 class="font-semibold text-ink-900">{{ r.alertCount }} alert{{ r.alertCount === 1 ? '' : 's' }} in {{ r.transactionsAnalysed }} transactions</h2>
        <span [ngClass]="r.level === 'low' ? 'badge-green' : r.level === 'medium' ? 'badge-yellow' : 'badge-red'">{{ r.level | titlecase }} concern &middot; {{ r.riskScore }}/100</span></div>
      <p class="text-sm text-ink-700">{{ r.summary }}</p>
      <p class="text-xs text-ink-400 mt-1">Total value {{ r.totalValue | number: '1.0-0' }} {{ r.currency }}</p>
      <ul class="mt-4 space-y-3">
        <li *ngFor="let a of r.alerts" class="border border-ink-100 rounded-lg p-3">
          <div class="flex flex-wrap items-center justify-between gap-2"><span><span [ngClass]="sev(a.severity)" class="mr-2">{{ a.severity }}</span><span class="font-mono text-xs text-ink-500">{{ a.code }}</span></span>
            <button *ngIf="canRun" class="btn-secondary btn-sm" [disabled]="busy()" (click)="openCase(a)">Open a case</button></div>
          <p class="text-sm text-ink-800 mt-1">{{ a.message }}</p>
          <p class="text-xs text-ink-400 mt-1">Transactions: {{ a.transactionIds.slice(0, 12).join(', ') }}<span *ngIf="a.transactionIds.length > 12"> and {{ a.transactionIds.length - 12 }} more</span></p>
        </li>
        <li *ngIf="!r.alerts.length" class="text-sm text-ink-500">No rule fired on these transactions.</li>
      </ul>
    </section>
    <ng-template #hint><section class="card p-6 text-sm text-ink-500">Load or paste transactions and press "Analyse".</section></ng-template>
  </div>
  `
})
export class TransactionMonitoringComponent {
  readonly header = HEADER;
  readonly example = EXAMPLE;
  csv = '';
  threshold: number | null = 5_000_000;
  currency = '';
  busy = signal(false);
  error = signal('');
  result = signal<TxnAnalysis | null>(null);

  constructor(private ai: AiApiService, private auth: AuthService, private router: Router) {}

  get canRun() { return this.auth.hasMinRole(3); }
  sev(s: string) { return SEVERITY[s] ?? 'badge-gray'; }

  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.error.set('That file is larger than 5 MB.'); return; }
    file.text().then(t => { this.csv = t; this.error.set(''); });
  }

  /** Reads the CSV into transactions, and tells the person exactly which line is wrong instead of failing on the server. */
  private parse(): Txn[] | null {
    const lines = this.csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const rows = lines[0]?.toLowerCase().startsWith('id,') ? lines.slice(1) : lines;
    if (!rows.length) { this.error.set('There are no transactions to analyse.'); return null; }
    if (rows.length > 5000) { this.error.set('Please analyse at most 5,000 transactions at a time.'); return null; }
    const out: Txn[] = [];
    for (let i = 0; i < rows.length; i++) {
      const [id, timestamp, amount, direction, country, name] = rows[i].split(',').map(s => s.trim());
      const n = Number(amount);
      if (!id || !timestamp || Number.isNaN(Date.parse(timestamp)) || !(n > 0)) {
        this.error.set(`Line ${i + 1 + (rows.length !== lines.length ? 1 : 0)} is not valid: it needs an id, an ISO timestamp and an amount above zero.`);
        return null;
      }
      out.push({ id, timestamp, amount: n, direction: direction === 'credit' || direction === 'debit' ? direction : undefined, counterpartyCountry: country || undefined, counterpartyName: name || undefined });
    }
    return out;
  }

  analyse() {
    this.error.set('');
    const transactions = this.parse();
    if (!transactions) return;
    this.busy.set(true);
    this.ai.analyseTransactions({ transactions, reportingThreshold: this.threshold ? Number(this.threshold) : undefined, currency: this.currency.trim().toUpperCase() || undefined }).subscribe({
      next: r => { this.busy.set(false); this.result.set(r); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  openCase(a: TxnAlert) {
    this.busy.set(true);
    this.ai.createCase({
      title: `Transaction alert: ${a.code.replace(/_/g, ' ')}`, subjectType: 'individual', description: a.message,
      evidence: [{ type: 'transaction_alert', code: a.code.toUpperCase(), severity: a.severity, description: a.message, data: { transactionIds: a.transactionIds.slice(0, 50) } }]
    }).subscribe({
      next: c => { this.busy.set(false); this.router.navigate(['/app/cases', c.caseId]); },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }
}
