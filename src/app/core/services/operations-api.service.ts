import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { PageData } from './compliance-api.service';

export type DdKind = 'CDD' | 'EDD';
export type DdStatus = 'IN_PROGRESS' | 'PENDING_REVIEW' | 'COMPLETED';

export interface DdChecklistItem { key: string; label: string; required: boolean; value: string; completed: boolean }
export interface DdNote { author: string; at: string; text: string }

export interface DueDiligence {
  id: string;
  kind: DdKind;
  status: DdStatus;
  customerId: string;
  submissionId?: string | null;
  customerName: string;
  email: string;
  country?: string | null;
  riskLevel?: string | null;
  riskScore?: number | null;
  reasons: string[];
  checklist: DdChecklistItem[];
  notes: DdNote[];
  completionPercent: number;
  openedBy: string;
  openedAt: string;
  submittedAt?: string | null;
  decidedAt?: string | null;
  decidedBy?: string | null;
  decisionReason?: string | null;
  nextReviewAt?: string | null;
  reviewOverdue: boolean;
}

export interface DdSuggestion { submissionId: string; customerName: string; kind: DdKind; riskLevel?: string | null; reasons: string[] }

export interface MonitoringHit { listedName: string; type: string; confidence: number }

export interface MonitoringItem {
  customerId: string;
  submissionId: string;
  customerName: string;
  email: string;
  country?: string | null;
  riskLevel?: string | null;
  frequencyDays: number;
  approvedAt?: string | null;
  lastCheckedAt?: string | null;
  nextDueAt: string;
  overdue: boolean;
  checkCount: number;
  lastHitCount?: number | null;
  lastSampleData: boolean;
  changed: boolean;
  hits: MonitoringHit[];
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  detail?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
}

export type ObligationCategory = 'STR' | 'CTR' | 'TRAINING' | 'KYC_REVIEW' | 'POLICY_REVIEW' | 'LICENCE' | 'RETURN' | 'OTHER';

export interface Obligation {
  id: string;
  title: string;
  category: ObligationCategory;
  regulator?: string | null;
  description?: string | null;
  dueDate: string;
  status: 'OPEN' | 'COMPLETED';
  owner?: string | null;
  repeatMonths?: number | null;
  completedAt?: string | null;
  completedBy?: string | null;
  overdue: boolean;
  daysLeft: number;
}

export interface ObligationRequest {
  title: string;
  category: ObligationCategory;
  regulator?: string;
  description?: string;
  dueDate: string;
  owner?: string;
  repeatMonths?: number | null;
}

/** compliance-service: due diligence files, continuous monitoring and the company's audit trail. */
@Injectable({ providedIn: 'root' })
export class OperationsApiService {
  constructor(private api: ApiService) {}

  // due diligence
  dueDiligence(kind: DdKind): Observable<DueDiligence[]> { return this.api.get('/due-diligence', { params: { kind } }); }
  ddSuggestions(): Observable<DdSuggestion[]> { return this.api.get('/due-diligence/suggestions'); }
  openDd(submissionId: string, kind: DdKind): Observable<DueDiligence> { return this.api.post('/due-diligence', { submissionId, kind }); }
  setDdField(id: string, key: string, value: string): Observable<DueDiligence> { return this.api.put(`/due-diligence/${id}/fields`, { key, value }); }
  addDdNote(id: string, text: string): Observable<DueDiligence> { return this.api.post(`/due-diligence/${id}/notes`, { text }); }
  submitDd(id: string): Observable<DueDiligence> { return this.api.post(`/due-diligence/${id}/submit`, {}); }
  approveDd(id: string): Observable<DueDiligence> { return this.api.post(`/due-diligence/${id}/approve`, {}); }
  sendBackDd(id: string, reason: string): Observable<DueDiligence> { return this.api.post(`/due-diligence/${id}/send-back`, { reason }); }

  // monitoring
  monitoring(): Observable<MonitoringItem[]> { return this.api.get('/monitoring'); }
  checkCustomer(customerId: string): Observable<MonitoringItem> { return this.api.post(`/monitoring/customers/${customerId}/check`, {}); }
  runDueChecks(): Observable<{ checked: number; failed: number; stillDue: number }> { return this.api.post('/monitoring/run-due', {}); }

  // audit
  audit(q: string, page = 0, size = 100): Observable<PageData<AuditEntry>> {
    return this.api.get('/audit', { params: { q, page, size } });
  }

  // regulatory calendar
  obligations(): Observable<Obligation[]> { return this.api.get('/obligations'); }
  createObligation(b: ObligationRequest): Observable<Obligation> { return this.api.post('/obligations', b); }
  updateObligation(id: string, b: ObligationRequest): Observable<Obligation> { return this.api.put(`/obligations/${id}`, b); }
  completeObligation(id: string): Observable<Obligation[]> { return this.api.post(`/obligations/${id}/complete`, {}); }
  deleteObligation(id: string): Observable<void> { return this.api.delete(`/obligations/${id}`); }
}
