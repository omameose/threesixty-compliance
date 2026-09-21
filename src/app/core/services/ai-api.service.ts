import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';

/** Which language model wrote the wording. The scores and findings always come from fixed rules; only the sentences may come from a model. */
export interface ModelInfo { provider: string; model?: string | null; generatedByModel: boolean; fallbackReason?: string | null; }

export type Severity = 'low' | 'medium' | 'high' | 'critical';

// ---------------------------------------------------------------- risk-detection
export interface RiskFactor { code: string; label: string; points: number; detail: string; }
export interface RiskScore {
  score: number; level: 'low' | 'medium' | 'high' | 'critical'; factors: RiskFactor[]; overrides: unknown[];
  recommendedDueDiligence: string; reviewFrequencyMonths: number; countryListVersion: string; explanation: string; model: ModelInfo;
}
export interface RiskScoreRequest {
  subjectType: 'individual' | 'business'; country?: string; nationality?: string; operatingCountry?: string; industry?: string;
  pepDeclared?: boolean; pepMatch?: boolean; adverseMedia?: boolean; sanctionsDeclared?: boolean; sanctionsHit?: boolean;
  failedVerifications?: number; documentsComplete?: boolean; nonFaceToFace?: boolean; productRisk?: 'low' | 'medium' | 'high';
  complexOwnership?: boolean; ownershipLayers?: number; bearerShares?: boolean; cashIntensive?: boolean; uboIdentified?: boolean;
  expectedMonthlyVolume?: number; volumeThreshold?: number;
}

export interface ScreeningHit { entryId: string; matchedName: string; listedName: string; type: string; list: string; nameSimilarity: number; confidence: number; notes?: string[]; }
export interface ScreeningResult {
  screenedName: string; threshold: number; entriesChecked: number; sampleData: boolean; hitCount: number; outcome: string;
  hits: ScreeningHit[]; note?: string;
}

export interface TxnAlert { code: string; severity: Severity; message: string; transactionIds: string[]; }
export interface TxnAnalysis {
  transactionsAnalysed: number; totalValue: number; currency?: string | null; alertCount: number; riskScore: number; level: string;
  alerts: TxnAlert[]; summary: string; model: ModelInfo;
}
export interface Txn { id: string; timestamp: string; amount: number; direction?: 'credit' | 'debit'; counterpartyCountry?: string; counterpartyName?: string; }

// ---------------------------------------------------------------- investigations
export interface CaseEvidence { type: string; code?: string | null; severity?: Severity | null; description?: string | null; ref?: string | null; data?: Record<string, unknown>; }
export interface CaseEvent { id: number; type: string; actor: string; message: string; data: Record<string, unknown>; createdAt: string; }
export interface CaseTriage {
  severity: Severity; priority: number; slaHours: number; dueAt?: string; reasons: string[]; recommendedSteps: string[]; signals: string[]; summary: string; model: ModelInfo;
}
export interface InvCase {
  caseId: string; companyId: string; title: string; description?: string | null; subjectType: 'individual' | 'business'; subjectName?: string | null;
  subjectRef?: string | null; severity: Severity; priority: number; status: string; resolution?: string | null; assignee?: string | null;
  evidence: CaseEvidence[]; triage: CaseTriage; createdBy: string; dueAt?: string; createdAt: string; updatedAt: string; closedAt?: string | null;
  overdue: boolean; events?: CaseEvent[];
}
export interface CaseStats { byStatus: Record<string, number>; bySeverity: Record<string, number>; open: number; overdue: number; averageOpenAgeDays: number; averageDaysToClose: number | null; }
export interface CasePage { items: InvCase[]; page: number; size: number; totalItems: number; totalPages: number; }
export interface CaseAction { action: string; label: string; }

// ---------------------------------------------------------------- customer intelligence
export interface ProfileAnalysis {
  dataQualityScore: number; concernLevel: string; completeness: { percent: number; missingFields: string[] };
  verification: { verified: number; failed: number; pending: number; averageMatchScore: number | null };
  documents: { coveragePercent: number; missing: string[] }; indicators: { code: string; severity: string; message: string }[];
  nextBestActions: string[]; summary: string; model: ModelInfo;
}
export interface PortfolioInsights {
  total: number; byStatus: Record<string, number>; byRisk: Record<string, number>; topCountries: { country: string; count: number }[];
  byForm: Record<string, number>; approvalRatePercent: number | null; averageReviewDays: number | null;
  topRejectionReasons: { reason: string; count: number }[]; highRiskShare: number; summary: string; model: ModelInfo;
}
export interface DuplicateMatches { checked: number; threshold: number; duplicateFound: boolean; matches: Record<string, unknown>[]; }

// ---------------------------------------------------------------- governance
export interface Control { id: string; domain: string; requirement: string; guidance: string; weight: number; evidenceExamples?: string; }
export interface Framework { key: string; name: string; description: string; controls: Control[]; }
export interface GovernanceCatalogue { frameworks: Framework[]; policyTypes: { key: string; name: string; clauses: number }[]; }
export interface Assessment {
  frameworkName: string; overallScorePercent: number; rating: string; byDomain: Record<string, unknown>; gaps: Record<string, unknown>[]; summary: string; model: ModelInfo;
}
export interface PolicyReview {
  policyName: string; coverageScorePercent: number; rating: string; missing: unknown[]; notes: unknown[]; reviewNotes: string; model: ModelInfo;
  [key: string]: unknown;
}
export interface ComplianceReport {
  reportType: string; overallStatus: string; kpis: { [key: string]: unknown }[]; findings: { [key: string]: unknown }[]; recommendations?: unknown[];
  executiveSummary: string; markdown: string; model: ModelInfo; [key: string]: unknown;
}

/** The Python AI services, reached through the gateway. Levels: risk 3+, intelligence 2+, cases view 3+ / manage 4+, governance 4+. */
@Injectable({ providedIn: 'root' })
export class AiApiService {
  constructor(private api: ApiService) {}

  // risk
  score(body: RiskScoreRequest): Observable<RiskScore> { return this.api.post('/ai/risk/score', body); }
  screen(body: { name: string; dateOfBirth?: string; country?: string; threshold?: number; types?: string[] }): Observable<ScreeningResult> { return this.api.post('/ai/risk/screen', body); }
  riskConfig(): Observable<{ countryListVersion: string; watchlistEntries: number; watchlistIsSample: boolean }> { return this.api.get('/ai/risk/config'); }
  analyseTransactions(body: { transactions: Txn[]; reportingThreshold?: number; currency?: string }): Observable<TxnAnalysis> { return this.api.post('/ai/risk/transactions/analyze', body); }

  // cases
  cases(q: { status?: string; severity?: string; q?: string; page?: number; size?: number }): Observable<CasePage> { return this.api.get('/ai/investigations', { params: q }); }
  caseStats(): Observable<CaseStats> { return this.api.get('/ai/investigations/stats'); }
  caseActions(): Observable<CaseAction[]> { return this.api.get('/ai/investigations/meta/actions'); }
  getCase(id: string): Observable<InvCase> { return this.api.get(`/ai/investigations/${id}`); }
  createCase(body: { title: string; description?: string; subjectType: 'individual' | 'business'; subjectName?: string; subjectRef?: string; severityHint?: Severity; evidence?: CaseEvidence[] }): Observable<InvCase> { return this.api.post('/ai/investigations', body); }
  addNote(id: string, message: string): Observable<InvCase> { return this.api.post(`/ai/investigations/${id}/notes`, { message }); }
  addEvidence(id: string, items: CaseEvidence[]): Observable<InvCase> { return this.api.post(`/ai/investigations/${id}/evidence`, { items }); }
  setCaseStatus(id: string, status: string, resolution?: string, note?: string): Observable<InvCase> { return this.api.put(`/ai/investigations/${id}/status`, { status, resolution, note }); }
  assignCase(id: string, assignee: string | null): Observable<InvCase> { return this.api.put(`/ai/investigations/${id}/assign`, { assignee }); }
  recordAction(id: string, action: string, note?: string): Observable<InvCase> { return this.api.post(`/ai/investigations/${id}/actions`, { action, note }); }
  reanalyse(id: string): Observable<InvCase> { return this.api.post(`/ai/investigations/${id}/analyze`, {}); }
  sarDraft(id: string): Observable<{ draft: string; filed: boolean; eventId: number; model: ModelInfo }> { return this.api.post(`/ai/investigations/${id}/sar-draft`, {}); }

  // intelligence
  profile(body: unknown): Observable<ProfileAnalysis> { return this.api.post('/ai/intelligence/profile', body); }
  portfolio(customers: unknown[]): Observable<PortfolioInsights> { return this.api.post('/ai/intelligence/portfolio', { customers }); }
  duplicates(target: unknown, candidates: unknown[], threshold = 0.75): Observable<DuplicateMatches> { return this.api.post('/ai/intelligence/entity-resolution/match', { target, candidates, threshold }); }

  // governance
  governance(): Observable<GovernanceCatalogue> { return this.api.get('/ai/governance/frameworks'); }
  assess(framework: string, responses: Record<string, { status: string; note?: string }>): Observable<Assessment> { return this.api.post('/ai/governance/gap-assessment', { framework, responses }); }
  reviewPolicy(policyType: string, text: string): Observable<PolicyReview> { return this.api.post('/ai/governance/policy-review', { policyType, text }); }
  report(body: unknown): Observable<ComplianceReport> { return this.api.post('/ai/governance/report', body); }
}
