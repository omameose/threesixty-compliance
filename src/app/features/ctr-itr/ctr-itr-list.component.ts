import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface Row { line: number; id: string; timestamp: string; amount: number; direction: string; country: string; party: string }
interface Aggregated { party: string; day: string; total: number; count: number; ids: string[] }

const EXAMPLE = [
  'id,timestamp,amount,direction,country,name',
  't1,2026-09-01T09:00:00Z,6500000,credit,Nigeria,Ada Obi',
  't2,2026-09-01T11:00:00Z,3000000,credit,Nigeria,Bola Ade',
  't3,2026-09-01T15:30:00Z,3000000,credit,Nigeria,Bola Ade',
  't4,2026-09-02T10:00:00Z,8000000,debit,Ghana,Kofi Mensah',
  't5,2026-09-03T10:00:00Z,150000,debit,United Kingdom,Ada Obi'
].join('\n');

/**
 * Prepares the data for currency (CTR) and international transfer (ITR) reports from a file of transactions. Thresholds and forms differ by
 * regulator, so the person enters the ones that apply; nothing is filed from here and nothing is stored. The output is a list to hand to
 * the compliance officer, and a CSV to download.
 */
@Component({
  selector: 'app-ctr-itr-list',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent],
  template: `
  <app-page-header title="CTR / ITR Preparation" subtitle="List the transactions that reach a reporting threshold, from a file you supply. Nothing is filed from here."></app-page-header>

  <div class="mb-5 p-3 rounded-lg bg-amber-50 text-amber-800 text-sm" role="note">
    Reporting thresholds and forms are set by your regulator and change over time, so enter the ones that apply to you. This tool prepares a list for your compliance officer. It does not file anything, and it works only on the transactions you paste or upload below (no live feed exists yet).
  </div>
  <div *ngIf="error()" class="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm" role="alert">{{ error() }}</div>

  <section class="card p-5 mb-5">
    <div class="grid md:grid-cols-4 gap-4 mb-4">
      <div><label class="label" for="ct-th">Threshold (single or same-day total)</label><input id="ct-th" class="input" type="number" min="1" [(ngModel)]="threshold" placeholder="Enter the amount"/></div>
      <div><label class="label" for="ct-cur">Currency (label only)</label><input id="ct-cur" class="input" maxlength="3" [(ngModel)]="currency" placeholder="NGN"/></div>
      <div><label class="label" for="ct-home">Your home country (for ITR)</label><input id="ct-home" class="input" [(ngModel)]="home" placeholder="Nigeria"/></div>
      <div class="flex items-end gap-2"><button class="btn-secondary" (click)="csv = example">Load an example</button>
        <label class="btn-secondary cursor-pointer">Upload<input type="file" accept=".csv,text/csv" class="hidden" (change)="onFile($event)"/></label></div>
    </div>
    <label class="label" for="ct-csv">Transactions</label>
    <textarea id="ct-csv" aria-label="Transactions CSV" class="input font-mono text-xs" rows="6" [(ngModel)]="csv" [placeholder]="header"></textarea>
    <p class="text-xs text-ink-500 mt-1">Columns: id, timestamp (ISO), amount, direction (credit or debit), country of the other party, name of the party.</p>
    <button class="btn-primary mt-3" [disabled]="!threshold || !csv.trim()" (click)="prepare()">Prepare</button>
  </section>

  <ng-container *ngIf="ready()">
    <div class="grid grid-cols-3 gap-4 mb-5">
      <div class="card p-4"><p class="muted">Single transactions at or above {{ threshold | number }}</p><p class="text-2xl font-bold text-ink-950">{{ singles().length }}</p></div>
      <div class="card p-4"><p class="muted">Same-day totals at or above it (each part below it)</p><p class="text-2xl font-bold text-ink-950">{{ aggregated().length }}</p></div>
      <div class="card p-4"><p class="muted">International at or above it</p><p class="text-2xl font-bold text-ink-950">{{ international().length }}</p></div>
    </div>

    <h3 class="font-semibold text-ink-900 mb-2">Currency transaction candidates</h3>
    <div class="card overflow-x-auto mb-5">
      <table class="table" aria-label="Currency transaction candidates"><thead><tr><th>Id</th><th>When</th><th>Party</th><th>Direction</th><th class="text-right">Amount</th></tr></thead>
        <tbody><tr *ngFor="let r of singles()"><td class="font-mono text-xs">{{ r.id }}</td><td class="text-sm">{{ r.timestamp | date: 'medium' }}</td><td>{{ r.party || '—' }}</td><td>{{ r.direction || '—' }}</td><td class="text-right font-medium">{{ currency }} {{ r.amount | number }}</td></tr></tbody></table>
      <p class="py-6 text-center text-sm text-ink-400" *ngIf="!singles().length">None.</p>
    </div>

    <h3 class="font-semibold text-ink-900 mb-2">Same-day totals (possible splitting)</h3>
    <div class="card overflow-x-auto mb-5">
      <table class="table" aria-label="Same-day totals"><thead><tr><th>Party</th><th>Day</th><th>Transactions</th><th class="text-right">Total</th></tr></thead>
        <tbody><tr *ngFor="let a of aggregated()"><td>{{ a.party }}</td><td>{{ a.day }}</td><td class="text-sm">{{ a.count }} ({{ a.ids.join(', ') }})</td><td class="text-right font-medium">{{ currency }} {{ a.total | number }}</td></tr></tbody></table>
      <p class="py-6 text-center text-sm text-ink-400" *ngIf="!aggregated().length">None.</p>
    </div>

    <h3 class="font-semibold text-ink-900 mb-2">International transfer candidates</h3>
    <div class="card overflow-x-auto mb-5">
      <table class="table" aria-label="International transfer candidates"><thead><tr><th>Id</th><th>When</th><th>Party</th><th>Country</th><th class="text-right">Amount</th></tr></thead>
        <tbody><tr *ngFor="let r of international()"><td class="font-mono text-xs">{{ r.id }}</td><td class="text-sm">{{ r.timestamp | date: 'medium' }}</td><td>{{ r.party || '—' }}</td><td>{{ r.country }}</td><td class="text-right font-medium">{{ currency }} {{ r.amount | number }}</td></tr></tbody></table>
      <p class="py-6 text-center text-sm text-ink-400" *ngIf="!international().length">{{ home.trim() ? 'None.' : 'Enter your home country to list international transfers.' }}</p>
    </div>
    <button class="btn-secondary" (click)="download()">Download as CSV</button>
  </ng-container>
  `
})
export class CtrItrListComponent {
  readonly example = EXAMPLE;
  readonly header = 'id,timestamp,amount,direction,country,name';
  csv = '';
  threshold: number | null = null;
  currency = '';
  home = '';
  error = signal('');
  rows = signal<Row[] | null>(null);
  ready = signal(false);
  singles = signal<Row[]>([]);
  aggregated = signal<Aggregated[]>([]);
  international = signal<Row[]>([]);

  onFile(ev: Event) {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { this.error.set('That file is larger than 5 MB.'); return; }
    file.text().then(t => { this.csv = t; this.error.set(''); });
  }

  prepare() {
    this.error.set('');
    this.ready.set(false);
    const limit = Number(this.threshold);
    if (!(limit > 0)) { this.error.set('Enter the threshold that applies to you.'); return; }
    const lines = this.csv.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const hasHeader = lines[0]?.toLowerCase().startsWith('id,');
    const body = hasHeader ? lines.slice(1) : lines;
    if (!body.length) { this.error.set('There are no transactions.'); return; }
    if (body.length > 20000) { this.error.set('Please use at most 20,000 transactions at a time.'); return; }
    const rows: Row[] = [];
    for (let i = 0; i < body.length; i++) {
      const [id, timestamp, amount, direction, country, party] = body[i].split(',').map(s => s.trim());
      const n = Number(amount);
      if (!id || !timestamp || Number.isNaN(Date.parse(timestamp)) || !(n > 0)) {
        this.error.set(`Line ${i + 1 + (hasHeader ? 1 : 0)} is not valid: it needs an id, an ISO timestamp and an amount above zero.`);
        return;
      }
      rows.push({ line: i + 1, id, timestamp, amount: n, direction: direction ?? '', country: country ?? '', party: party ?? '' });
    }
    this.singles.set(rows.filter(r => r.amount >= limit));
    // Same party, same calendar day (UTC), each part below the threshold but the total at or above it.
    const groups = new Map<string, Aggregated>();
    for (const r of rows) {
      if (!r.party || r.amount >= limit) continue;
      const day = r.timestamp.slice(0, 10);
      const g = groups.get(r.party + '|' + day) ?? { party: r.party, day, total: 0, count: 0, ids: [] };
      g.total += r.amount; g.count++; g.ids.push(r.id);
      groups.set(r.party + '|' + day, g);
    }
    this.aggregated.set([...groups.values()].filter(g => g.count > 1 && g.total >= limit));
    const home = this.home.trim().toLowerCase();
    this.international.set(home ? rows.filter(r => r.amount >= limit && r.country && r.country.toLowerCase() !== home) : []);
    this.rows.set(rows);
    this.ready.set(true);
  }

  download() {
    // A leading = + - @ would make a spreadsheet treat the cell as a formula, so such cells get an apostrophe in front.
    const cell = (v: string | number) => { const s = String(v); return `"${(/^[=+\-@]/.test(s) ? "'" + s : s).replace(/"/g, '""')}"`; };
    const lines = [['Report', 'Id or ids', 'When or day', 'Party', 'Country', 'Amount'].join(',')];
    for (const r of this.singles()) lines.push(['CTR candidate', r.id, r.timestamp, r.party, r.country, r.amount].map(cell).join(','));
    for (const a of this.aggregated()) lines.push(['CTR same-day total', a.ids.join(' '), a.day, a.party, '', a.total].map(cell).join(','));
    for (const r of this.international()) lines.push(['ITR candidate', r.id, r.timestamp, r.party, r.country, r.amount].map(cell).join(','));
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url; a.download = `ctr-itr-candidates-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }
}
