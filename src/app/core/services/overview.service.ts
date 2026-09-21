import { Injectable } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { Customer } from '../models/models';
import { AiApiService, CaseStats, InvCase } from './ai-api.service';
import { AuthService } from './auth.service';
import { ComplianceApiService } from './compliance-api.service';
import { DueDiligence, MonitoringItem, Obligation, OperationsApiService } from './operations-api.service';

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

/** Something that needs a person's attention, worked out from the company's own records. It disappears when the cause is dealt with. */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  source: 'Case' | 'Monitoring' | 'Customer' | 'Due diligence' | 'Calendar';
  title: string;
  detail: string;
  link: string[];
}

/** Everything the alert, board and war-room screens read, gathered once. A source the person's role cannot read is listed in `unavailable`. */
export interface Snapshot {
  customers: Customer[];
  cases: InvCase[];
  caseStats: CaseStats | null;
  monitoring: MonitoringItem[];
  dueDiligence: DueDiligence[];
  obligations: Obligation[];
  unavailable: string[];
  loadedAt: Date;
}

const RANK: Record<AlertSeverity, number> = { critical: 0, high: 1, medium: 2, low: 3 };

@Injectable({ providedIn: 'root' })
export class OverviewService {
  constructor(private auth: AuthService, private api: ComplianceApiService, private ai: AiApiService, private ops: OperationsApiService) {}

  load(): Observable<Snapshot> {
    const unavailable: string[] = [];
    const guard = <T>(name: string, minLevel: number, call: () => Observable<T>, fallback: T): Observable<T> =>
      !this.auth.hasMinRole(minLevel)
        ? (unavailable.push(name), of(fallback))
        : call().pipe(catchError(() => (unavailable.push(name), of(fallback))));
    return forkJoin({
      customers: guard('customers', 2, () => this.api.customers({ size: 200 }).pipe(map(p => p.items)), [] as Customer[]),
      cases: guard('cases', 3, () => this.ai.cases({ size: 100 }).pipe(map(p => p.items)), [] as InvCase[]),
      caseStats: guard('cases', 3, () => this.ai.caseStats(), null as CaseStats | null),
      monitoring: guard('monitoring', 2, () => this.ops.monitoring(), [] as MonitoringItem[]),
      cdd: guard('due diligence', 2, () => this.ops.dueDiligence('CDD'), [] as DueDiligence[]),
      edd: guard('due diligence', 2, () => this.ops.dueDiligence('EDD'), [] as DueDiligence[]),
      obligations: guard('calendar', 2, () => this.ops.obligations(), [] as Obligation[])
    }).pipe(map(r => ({
      customers: r.customers, cases: r.cases, caseStats: r.caseStats, monitoring: r.monitoring, dueDiligence: [...r.cdd, ...r.edd],
      obligations: r.obligations, unavailable: [...new Set(unavailable)], loadedAt: new Date()
    })));
  }

  alerts(s: Snapshot): Alert[] {
    const out: Alert[] = [];
    for (const c of s.cases) {
      if (['resolved', 'closed'].includes(c.status)) continue;
      const sev = (c.overdue && (c.severity === 'low' || c.severity === 'medium') ? 'high' : c.severity) as AlertSeverity;
      out.push({ id: 'case-' + c.caseId, severity: sev, source: 'Case', title: c.title,
        detail: `${c.severity} case, ${c.status}${c.overdue ? ', response overdue' : ''}${c.assignee ? '' : ', nobody assigned'}`, link: ['/app/cases', c.caseId] });
    }
    for (const m of s.monitoring) {
      const link = ['/app/my-clients', m.submissionId];
      if (m.changed) out.push({ id: 'mon-chg-' + m.customerId, severity: 'high', source: 'Monitoring', title: `Screening result changed for ${m.customerName}`, detail: 'The possible matches differ from the previous check.', link });
      else if ((m.lastHitCount ?? 0) > 0) out.push({ id: 'mon-hit-' + m.customerId, severity: m.lastSampleData ? 'low' : 'high', source: 'Monitoring', title: `${m.customerName} has ${m.lastHitCount} possible watchlist match${m.lastHitCount! > 1 ? 'es' : ''}`, detail: m.lastSampleData ? 'From the demonstration list, so probably a test.' : 'Review the matches.', link });
      if (m.overdue) out.push({ id: 'mon-due-' + m.customerId, severity: 'medium', source: 'Monitoring', title: `Re-screening due for ${m.customerName}`, detail: `Every ${m.frequencyDays} days for ${m.riskLevel ?? 'unrated'} risk customers.`, link: ['/app/continuous-monitoring'] });
    }
    for (const c of s.customers) {
      const link = ['/app/my-clients', c.id];
      if (c.sanctionsHit && c.status !== 'rejected') out.push({ id: 'cus-san-' + c.id, severity: 'critical', source: 'Customer', title: `Possible sanctions match: ${c.fullName}`, detail: `Status: ${c.status.replace(/_/g, ' ')}.`, link });
      else if (c.status === 'pending_review' && c.riskLevel === 'high') out.push({ id: 'cus-high-' + c.id, severity: 'high', source: 'Customer', title: `High-risk customer waiting for a decision: ${c.fullName}`, detail: `Risk score ${c.riskScore}.`, link });
      else if (c.pepHit && c.status !== 'rejected') out.push({ id: 'cus-pep-' + c.id, severity: 'medium', source: 'Customer', title: `Possible politically exposed person: ${c.fullName}`, detail: 'Consider enhanced due diligence.', link });
    }
    for (const d of s.dueDiligence) {
      if (d.status === 'PENDING_REVIEW') out.push({ id: 'dd-rev-' + d.id, severity: 'medium', source: 'Due diligence', title: `${d.kind} file for ${d.customerName} is waiting for approval`, detail: 'A Compliance Officer has to approve or send it back.', link: [d.kind === 'CDD' ? '/app/cdd' : '/app/edd'] });
      if (d.reviewOverdue) out.push({ id: 'dd-old-' + d.id, severity: 'high', source: 'Due diligence', title: `${d.kind} review overdue for ${d.customerName}`, detail: `It was due on ${(d.nextReviewAt ?? '').slice(0, 10)}.`, link: [d.kind === 'CDD' ? '/app/cdd' : '/app/edd'] });
    }
    for (const o of s.obligations) {
      if (o.status !== 'OPEN') continue;
      if (o.overdue) out.push({ id: 'obl-' + o.id, severity: 'high', source: 'Calendar', title: `Overdue: ${o.title}`, detail: `Was due on ${o.dueDate}.`, link: ['/app/regulatory-calendar'] });
      else if (o.daysLeft <= 7) out.push({ id: 'obl-' + o.id, severity: 'medium', source: 'Calendar', title: `Due in ${o.daysLeft} day${o.daysLeft === 1 ? '' : 's'}: ${o.title}`, detail: `Due on ${o.dueDate}.`, link: ['/app/regulatory-calendar'] });
    }
    return out.sort((a, b) => RANK[a.severity] - RANK[b.severity]);
  }
}
