import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, tap } from 'rxjs';
import { SECTORS, findSector, findIndustry, findTemplate } from '../mock/sectors.mock';
import { MOCK_FORMS } from '../mock/forms.mock';
import { MOCK_CUSTOMERS } from '../mock/customers.mock';
import {
  MOCK_COMPANY, MOCK_USER, MOCK_TEAM, TEAM_ROLES, PLANS, MOCK_SUBSCRIPTION,
  MOCK_INVOICES, MOCK_API_KEYS, MOCK_WEBHOOK_CONFIG, MOCK_WEBHOOK_LOGS,
  DASHBOARD_STATS, MOCK_SCREENING_RESULTS
} from '../mock/org.mock';
import {
  MOCK_ALERTS, MOCK_CASES, MOCK_STR_SAR, MOCK_CTR_ITR, RISK_APPETITE_MATRIX,
  MOCK_RULES, MOCK_MODELS, MOCK_AUDIT_LOG, MOCK_OBLIGATIONS, MOCK_POLICIES,
  MOCK_TRAINING, MOCK_CONTROLS
} from '../mock/compliance-ops.mock';
import { MOCK_ID_VERIFICATIONS, MOCK_BUSINESS_VERIFICATIONS, MOCK_DOCUMENT_VERIFICATIONS } from '../mock/verification-details.mock';
import {
  MOCK_SANCTIONS_CASES, MOCK_PEP_CASES, MOCK_ADVERSE_MEDIA_CASES, MOCK_KYB_COMPANIES
} from '../mock/screening-cases.mock';
import {
  MOCK_TMS_HITS, MOCK_FRAUD_HITS, MOCK_MERCHANTS, MOCK_DEVICES, RISK_FACTOR_WEIGHTS, RISK_TIER_THRESHOLDS
} from '../mock/detection-cases.mock';
import {
  MOCK_CDD_CASES, MOCK_EDD_CASES, MOCK_MONITORING_SCHEDULE
} from '../mock/workflow-cases.mock';
import { MOCK_NETWORK_GRAPH } from '../mock/network-graph.mock';
import {
  ComplianceForm, Customer, CompanyProfile, TeamMember, Alert, ComplianceCase,
  CaseTimelineEntry, RiskAppetiteTier, ComplianceRule, SanctionsCase, PepCase, AdverseMediaCase,
  ScreeningReviewStatus, CaseNote, IdVerificationRecord, BusinessVerificationRecord,
  DocumentVerificationRecord, TmsScenarioHit, FraudCaseHit, DetectionHitStatus, KybCompany,
  RegulatoryObligation, RiskFactorWeight, RiskTierThreshold, FraudDecision, CddCase,
  EddCase, EddChecklistItem, MonitoringScheduleEntry, RuleCondition
} from '../models/models';

@Injectable({ providedIn: 'root' })
export class DataService {
  // In-memory mutable stores seeded from mock data (simulates a backend for this demo build)
  forms = signal<ComplianceForm[]>([...MOCK_FORMS]);
  customers = signal<Customer[]>([...MOCK_CUSTOMERS]);
  company = signal<CompanyProfile>({ ...MOCK_COMPANY });
  team = signal<TeamMember[]>([...MOCK_TEAM]);
  alerts = signal<Alert[]>([...MOCK_ALERTS]);
  cases = signal<ComplianceCase[]>([...MOCK_CASES]);
  riskAppetiteMatrix = signal<RiskAppetiteTier[]>([...RISK_APPETITE_MATRIX]);
  rules = signal<ComplianceRule[]>([...MOCK_RULES]);
  sanctionsCases = signal<SanctionsCase[]>([...MOCK_SANCTIONS_CASES]);
  pepCases = signal<PepCase[]>([...MOCK_PEP_CASES]);
  adverseMediaCases = signal<AdverseMediaCase[]>([...MOCK_ADVERSE_MEDIA_CASES]);
  idVerifications = signal<IdVerificationRecord[]>([...MOCK_ID_VERIFICATIONS]);
  businessVerifications = signal<BusinessVerificationRecord[]>([...MOCK_BUSINESS_VERIFICATIONS]);
  documentVerifications = signal<DocumentVerificationRecord[]>([...MOCK_DOCUMENT_VERIFICATIONS]);
  tmsHits = signal<TmsScenarioHit[]>([...MOCK_TMS_HITS]);
  fraudHits = signal<FraudCaseHit[]>([...MOCK_FRAUD_HITS]);
  kybCompanies = signal<KybCompany[]>([...MOCK_KYB_COMPANIES]);
  obligations = signal<RegulatoryObligation[]>([...MOCK_OBLIGATIONS]);
  riskFactorWeights = signal<RiskFactorWeight[]>([...RISK_FACTOR_WEIGHTS]);
  riskTierThresholds = signal<RiskTierThreshold[]>([...RISK_TIER_THRESHOLDS]);
  cddCases = signal<CddCase[]>([...MOCK_CDD_CASES]);
  eddCases = signal<EddCase[]>([...MOCK_EDD_CASES]);
  monitoringSchedule = signal<MonitoringScheduleEntry[]>([...MOCK_MONITORING_SCHEDULE]);

  // ===== Sectors / Templates =====
  getSectors() { return of(SECTORS).pipe(delay(200)); }
  getSector(id: string) { return of(findSector(id)).pipe(delay(150)); }
  getIndustry(sectorId: string, industryId: string) { return of(findIndustry(sectorId, industryId)).pipe(delay(150)); }
  getTemplate(templateId: string) { return of(findTemplate(templateId)).pipe(delay(150)); }

  // ===== Forms =====
  getForms(): Observable<ComplianceForm[]> { return of(this.forms()).pipe(delay(200)); }
  getForm(id: string): Observable<ComplianceForm | undefined> { return of(this.forms().find(f => f.id === id)).pipe(delay(150)); }
  saveForm(form: ComplianceForm) {
    const list = this.forms();
    const idx = list.findIndex(f => f.id === form.id);
    if (idx >= 0) {
      const updated = [...list];
      updated[idx] = { ...form, updatedAt: new Date().toISOString().slice(0, 10) };
      this.forms.set(updated);
    } else {
      this.forms.set([{ ...form, createdAt: new Date().toISOString().slice(0, 10), updatedAt: new Date().toISOString().slice(0, 10) }, ...list]);
    }
    return of({ success: true }).pipe(delay(300));
  }
  deleteForm(id: string) {
    this.forms.set(this.forms().filter(f => f.id !== id));
    return of({ success: true }).pipe(delay(200));
  }
  updateFormStatus(id: string, status: ComplianceForm['status']) {
    this.forms.set(this.forms().map(f => f.id === id ? { ...f, status, updatedAt: new Date().toISOString().slice(0, 10) } : f));
    return of({ success: true }).pipe(delay(300));
  }
  reorderForms(newOrder: ComplianceForm[]) {
    this.forms.set(newOrder);
  }

  // ===== ID / Business / Document Verification (M2, M3, KYB) =====
  getIdVerifications() { return of(this.idVerifications()).pipe(delay(200)); }
  getIdVerification(id: string) { return of(this.idVerifications().find(v => v.id === id)).pipe(delay(150)); }
  addIdVerificationNote(id: string, note: CaseNote) {
    this.idVerifications.set(this.idVerifications().map(v => v.id === id ? { ...v, notes: [...v.notes, note] } : v));
    return of({ success: true }).pipe(delay(200));
  }

  getBusinessVerifications() { return of(this.businessVerifications()).pipe(delay(200)); }
  getBusinessVerification(id: string) { return of(this.businessVerifications().find(v => v.id === id)).pipe(delay(150)); }
  updateBusinessVerificationOutcome(id: string, outcome: BusinessVerificationRecord['outcome']) {
    this.businessVerifications.set(this.businessVerifications().map(v => v.id === id ? { ...v, outcome } : v));
    return of({ success: true }).pipe(delay(300));
  }
  addBusinessVerificationNote(id: string, note: CaseNote) {
    this.businessVerifications.set(this.businessVerifications().map(v => v.id === id ? { ...v, notes: [...v.notes, note] } : v));
    return of({ success: true }).pipe(delay(200));
  }

  getDocumentVerifications() { return of(this.documentVerifications()).pipe(delay(200)); }
  getDocumentVerification(id: string) { return of(this.documentVerifications().find(v => v.id === id)).pipe(delay(150)); }
  updateDocumentVerificationOutcome(id: string, outcome: DocumentVerificationRecord['outcome']) {
    this.documentVerifications.set(this.documentVerifications().map(v => v.id === id ? { ...v, outcome } : v));
    return of({ success: true }).pipe(delay(300));
  }
  addDocumentVerificationNote(id: string, note: CaseNote) {
    this.documentVerifications.set(this.documentVerifications().map(v => v.id === id ? { ...v, notes: [...v.notes, note] } : v));
    return of({ success: true }).pipe(delay(200));
  }

  // ===== Sanctions Screening (M5) =====
  getSanctionsCases() { return of(this.sanctionsCases()).pipe(delay(200)); }
  getSanctionsCase(id: string) { return of(this.sanctionsCases().find(c => c.id === id)).pipe(delay(150)); }
  updateSanctionsReview(id: string, reviewStatus: ScreeningReviewStatus, reviewedBy: string) {
    this.sanctionsCases.set(this.sanctionsCases().map(c => c.id === id
      ? { ...c, reviewStatus, reviewedBy, reviewedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : c));
    return of({ success: true }).pipe(delay(300));
  }
  addSanctionsNote(id: string, note: CaseNote) {
    this.sanctionsCases.set(this.sanctionsCases().map(c => c.id === id ? { ...c, notes: [...c.notes, note] } : c));
    return of({ success: true }).pipe(delay(200));
  }
  getSanctionsCasesForCustomer(customer: Customer) {
    return of(this.sanctionsCases().filter(c => c.customerId === customer.id || c.subjectName === customer.fullName)).pipe(delay(150));
  }
  runSanctionsScreening(input: { subjectName: string; subjectType: 'Individual' | 'Business'; dob?: string; nationality: string; country: string; identifiers?: string[]; customerId?: string }) {
    const score = Math.floor(Math.random() * 100);
    const verdict: SanctionsCase['verdict'] = score > 80 ? 'MATCH' : score > 45 ? 'POTENTIAL_MATCH' : 'CLEAR';
    const newCase: SanctionsCase = {
      id: 'sx-' + Date.now(), customerId: input.customerId, subjectName: input.subjectName, subjectType: input.subjectType,
      dob: input.dob, nationality: input.nationality || 'Unknown', country: input.country || 'Unknown',
      identifiers: input.identifiers || [], verdict, matchScore: score,
      matchedList: verdict !== 'CLEAR' ? 'OFAC SDN List' : undefined,
      matchedListVersion: verdict !== 'CLEAR' ? 'v2026.09.01' : undefined,
      matchedEntityName: verdict !== 'CLEAR' ? input.subjectName + ' (fuzzy match)' : undefined,
      evidenceSummary: verdict !== 'CLEAR' ? `Fuzzy name match at ${score}% confidence against list entry.` : undefined,
      screenedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), reviewStatus: 'pending', notes: []
    };
    return of(newCase).pipe(delay(1200), tap(c => this.sanctionsCases.set([c, ...this.sanctionsCases()])));
  }

  // ===== PEP Screening (M4) =====
  getPepCases() { return of(this.pepCases()).pipe(delay(200)); }
  getPepCase(id: string) { return of(this.pepCases().find(c => c.id === id)).pipe(delay(150)); }
  updatePepReview(id: string, reviewStatus: ScreeningReviewStatus, reviewedBy: string) {
    this.pepCases.set(this.pepCases().map(c => c.id === id
      ? { ...c, reviewStatus, reviewedBy, reviewedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : c));
    return of({ success: true }).pipe(delay(300));
  }
  requestPepEdd(id: string) {
    this.pepCases.set(this.pepCases().map(c => c.id === id ? { ...c, eddRequested: true } : c));
    return of({ success: true }).pipe(delay(250));
  }
  addPepNote(id: string, note: CaseNote) {
    this.pepCases.set(this.pepCases().map(c => c.id === id ? { ...c, notes: [...c.notes, note] } : c));
    return of({ success: true }).pipe(delay(200));
  }
  getPepCasesForCustomer(customer: Customer) {
    return of(this.pepCases().filter(c => c.customerId === customer.id || c.subjectName === customer.fullName)).pipe(delay(150));
  }
  runPepScreening(input: { subjectName: string; customerId?: string }) {
    const score = Math.floor(Math.random() * 100);
    const verdict: PepCase['verdict'] = score > 75 ? 'PEP_MATCH' : score > 40 ? 'POTENTIAL_PEP' : 'CLEAR';
    const newCase: PepCase = {
      id: 'pep-' + Date.now(), customerId: input.customerId, subjectName: input.subjectName, verdict, confidenceScore: score,
      position: verdict !== 'CLEAR' ? 'Matched public office role (unverified)' : undefined,
      country: verdict !== 'CLEAR' ? 'Nigeria' : undefined,
      category: verdict !== 'CLEAR' ? 'Domestic PEP' : undefined,
      relationship: verdict !== 'CLEAR' ? 'Self' : undefined,
      source: 'Global PEP Database', dataSourceVersion: 'v2026.09.01',
      screenedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), reviewStatus: 'pending', eddRequested: false, notes: []
    };
    return of(newCase).pipe(delay(1200), tap(c => this.pepCases.set([c, ...this.pepCases()])));
  }

  // ===== Adverse Media Intelligence (M6) =====
  getAdverseMediaCases() { return of(this.adverseMediaCases()).pipe(delay(200)); }
  getAdverseMediaCase(id: string) { return of(this.adverseMediaCases().find(c => c.id === id)).pipe(delay(150)); }
  updateAdverseMediaReview(id: string, reviewStatus: ScreeningReviewStatus, reviewedBy: string) {
    this.adverseMediaCases.set(this.adverseMediaCases().map(c => c.id === id
      ? { ...c, reviewStatus, reviewedBy, reviewedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : c));
    return of({ success: true }).pipe(delay(300));
  }
  addAdverseMediaNote(id: string, note: CaseNote) {
    this.adverseMediaCases.set(this.adverseMediaCases().map(c => c.id === id ? { ...c, notes: [...c.notes, note] } : c));
    return of({ success: true }).pipe(delay(200));
  }
  getAdverseMediaCasesForCustomer(customer: Customer) {
    return of(this.adverseMediaCases().filter(c => c.customerId === customer.id || c.subjectName === customer.fullName)).pipe(delay(150));
  }
  runAdverseMediaScreening(input: { subjectName: string; customerId?: string }) {
    const score = Math.floor(Math.random() * 100);
    const verdict: AdverseMediaCase['verdict'] = score > 50 ? 'POTENTIAL_RISK' : 'CLEAR';
    const newCase: AdverseMediaCase = {
      id: 'am-' + Date.now(), customerId: input.customerId, subjectName: input.subjectName, verdict, riskScore: score,
      articles: verdict === 'POTENTIAL_RISK' ? [{
        headline: `Search result referencing "${input.subjectName}" in a regulatory bulletin`,
        url: 'https://example-news.ng/bulletin', source: 'Aggregated News Index', sourceCredibility: 'medium',
        publishedDate: new Date().toISOString().slice(0, 10), themes: ['Regulatory Non-Compliance'], stage: 'Allegation', confidence: score,
        excerpt: 'Automated match — full article requires manual review to confirm relevance.'
      }] : [],
      screenedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), reviewStatus: 'pending', notes: []
    };
    return of(newCase).pipe(delay(1200), tap(c => this.adverseMediaCases.set([c, ...this.adverseMediaCases()])));
  }

  // ===== KYB & Beneficial Ownership (M3) =====
  getKybCompanies() { return of(this.kybCompanies()).pipe(delay(200)); }
  getKybCompany(id: string) { return of(this.kybCompanies().find(c => c.id === id)).pipe(delay(150)); }
  updateKybVerificationStatus(id: string, status: KybCompany['verificationStatus'], verifiedBy: string) {
    this.kybCompanies.set(this.kybCompanies().map(c => c.id === id
      ? { ...c, verificationStatus: status, verifiedBy, verifiedAt: new Date().toISOString().slice(0, 10) } : c));
    return of({ success: true }).pipe(delay(300));
  }
  addKybNote(id: string, note: CaseNote) {
    this.kybCompanies.set(this.kybCompanies().map(c => c.id === id ? { ...c, notes: [...c.notes, note] } : c));
    return of({ success: true }).pipe(delay(200));
  }

  // ===== Transaction Monitoring (M9) =====
  getTmsHits() { return of(this.tmsHits()).pipe(delay(200)); }
  updateTmsHitStatus(id: string, status: DetectionHitStatus) {
    this.tmsHits.set(this.tmsHits().map(h => h.id === id ? { ...h, status } : h));
    return of({ success: true }).pipe(delay(250));
  }

  // ===== Fraud Detection (M11) =====
  getFraudHits() { return of(this.fraudHits()).pipe(delay(200)); }
  updateFraudHitStatus(id: string, status: DetectionHitStatus) {
    this.fraudHits.set(this.fraudHits().map(h => h.id === id ? { ...h, status } : h));
    return of({ success: true }).pipe(delay(250));
  }
  overrideFraudDecision(id: string, decision: FraudDecision, reason: string, overriddenBy: string) {
    this.fraudHits.set(this.fraudHits().map(h => h.id === id
      ? { ...h, overrideDecision: decision, overrideReason: reason, overriddenBy, overriddenAt: new Date().toISOString().slice(0, 16).replace('T', ' ') } : h));
    return of({ success: true }).pipe(delay(300));
  }

  // ===== Merchant Risk & Device Intelligence (M12, M13) =====
  getMerchants() { return of(MOCK_MERCHANTS).pipe(delay(200)); }
  getDevices() { return of(MOCK_DEVICES).pipe(delay(200)); }

  // ===== Network / Graph Analytics (M14) =====
  getNetworkGraph() { return of(MOCK_NETWORK_GRAPH).pipe(delay(250)); }

  // ===== Customer Risk Engine configuration (M7) =====
  getRiskFactorWeights() { return of(this.riskFactorWeights()).pipe(delay(150)); }
  updateRiskFactorWeight(id: string, weight: number) {
    this.riskFactorWeights.set(this.riskFactorWeights().map(w => w.id === id ? { ...w, weight } : w));
    return of({ success: true }).pipe(delay(200));
  }
  getRiskTierThresholds() { return of(this.riskTierThresholds()).pipe(delay(150)); }
  updateRiskTierThreshold(tier: RiskTierThreshold) {
    this.riskTierThresholds.set(this.riskTierThresholds().map(t => t.tier === tier.tier ? tier : t));
    return of({ success: true }).pipe(delay(200));
  }

  // ===== Customers =====
  getCustomers(): Observable<Customer[]> { return of(this.customers()).pipe(delay(200)); }
  getCustomersByForm(formId: string): Observable<Customer[]> { return of(this.customers().filter(c => c.formId === formId)).pipe(delay(200)); }
  getCustomer(id: string): Observable<Customer | undefined> { return of(this.customers().find(c => c.id === id)).pipe(delay(150)); }
  updateCustomerStatus(id: string, status: Customer['status']) {
    this.customers.set(this.customers().map(c => c.id === id ? { ...c, status } : c));
    return of({ success: true }).pipe(delay(400));
  }
  reorderCustomers(newOrder: Customer[]) {
    this.customers.set(newOrder);
  }
  generateComplianceLink(customerName: string, formId: string) {
    const complianceId = 'CMP-' + Math.floor(60000 + Math.random() * 9000);
    return of({
      complianceId,
      link: `https://verify.360compliance.io/k/${formId}?cid=${complianceId}`
    }).pipe(delay(500));
  }

  // ===== Org / Team / Subscription / Dev console =====
  getCompany() { return of(this.company()).pipe(delay(150)); }
  updateCompany(company: CompanyProfile) { this.company.set(company); return of({ success: true }).pipe(delay(400)); }
  getUser() { return of(MOCK_USER).pipe(delay(100)); }
  getTeamRoles() { return of(TEAM_ROLES).pipe(delay(100)); }
  getTeam() { return of(this.team()).pipe(delay(200)); }
  inviteMember(member: TeamMember) { this.team.set([member, ...this.team()]); return of({ success: true }).pipe(delay(400)); }
  removeMember(id: string) { this.team.set(this.team().filter(m => m.id !== id)); return of({ success: true }).pipe(delay(300)); }
  updateMemberRole(id: string, role: TeamMember['role']) {
    this.team.set(this.team().map(m => m.id === id ? { ...m, role } : m));
    return of({ success: true }).pipe(delay(300));
  }

  getPlans() { return of(PLANS).pipe(delay(150)); }
  getSubscription() { return of(MOCK_SUBSCRIPTION).pipe(delay(150)); }
  getInvoices() { return of(MOCK_INVOICES).pipe(delay(150)); }

  getApiKeys() { return of(MOCK_API_KEYS).pipe(delay(150)); }
  getWebhookConfig() { return of(MOCK_WEBHOOK_CONFIG).pipe(delay(150)); }
  getWebhookLogs() { return of(MOCK_WEBHOOK_LOGS).pipe(delay(150)); }

  getDashboardStats() { return of(DASHBOARD_STATS).pipe(delay(200)); }
  getScreeningResults() { return of(MOCK_SCREENING_RESULTS).pipe(delay(200)); }

  // ===== Alerts (M16) =====
  getAlerts(): Observable<Alert[]> { return of(this.alerts()).pipe(delay(200)); }
  updateAlertStatus(id: string, status: Alert['status'], assignedTo?: string) {
    this.alerts.set(this.alerts().map(a => a.id === id ? { ...a, status, assignedTo: assignedTo ?? a.assignedTo } : a));
    return of({ success: true }).pipe(delay(300));
  }
  convertAlertToCase(alertId: string): Observable<{ success: boolean; caseId?: string }> {
    const alert = this.alerts().find(a => a.id === alertId);
    if (!alert) return of({ success: false }).pipe(delay(200));
    const caseNumber = 'CASE-2026-' + Math.floor(1000 + Math.random() * 8999);
    const newCase: ComplianceCase = {
      id: 'case-' + Date.now(),
      caseNumber,
      customerId: alert.customerId,
      customerName: alert.customerName,
      alertId: alert.id,
      type: alert.type,
      status: 'open',
      priority: alert.severity,
      assignedTo: alert.assignedTo || 'Unassigned',
      openedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      summary: `Case opened from alert: ${alert.ruleTriggered}`,
      timeline: [{ label: `Case opened from alert ${alert.id.toUpperCase()}`, date: new Date().toISOString().slice(0, 16).replace('T', ' '), actor: 'System' }]
    };
    this.cases.set([newCase, ...this.cases()]);
    this.alerts.set(this.alerts().map(a => a.id === alertId ? { ...a, status: 'investigating', caseId: newCase.id } : a));
    return of({ success: true, caseId: newCase.id }).pipe(delay(300));
  }

  // ===== Case Management (M17) =====
  getCases(): Observable<ComplianceCase[]> { return of(this.cases()).pipe(delay(200)); }
  getCase(id: string): Observable<ComplianceCase | undefined> { return of(this.cases().find(c => c.id === id)).pipe(delay(150)); }
  updateCaseStatus(id: string, status: ComplianceCase['status'], entry: CaseTimelineEntry) {
    this.cases.set(this.cases().map(c => c.id === id
      ? { ...c, status, closedAt: status === 'closed' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : c.closedAt, timeline: [...c.timeline, entry] }
      : c));
    return of({ success: true }).pipe(delay(300));
  }

  // ===== STR/SAR & CTR/ITR (M18, M19) =====
  getStrSarFilings() { return of(MOCK_STR_SAR).pipe(delay(200)); }
  getCtrItrReports() { return of(MOCK_CTR_ITR).pipe(delay(200)); }

  // ===== Risk Appetite & Decision Engine (M21) =====
  getRiskAppetiteMatrix() { return of(this.riskAppetiteMatrix()).pipe(delay(150)); }
  updateRiskAppetiteTier(tier: RiskAppetiteTier) {
    this.riskAppetiteMatrix.set(this.riskAppetiteMatrix().map(t => t.riskLevel === tier.riskLevel ? tier : t));
    return of({ success: true }).pipe(delay(300));
  }

  // ===== Compliance Rules Studio (M22) =====
  getRules() { return of(this.rules()).pipe(delay(200)); }
  getRule(id: string) { return of(this.rules().find(r => r.id === id)).pipe(delay(150)); }
  toggleRule(id: string) {
    this.rules.set(this.rules().map(r => r.id === id ? { ...r, enabled: !r.enabled, lastModified: new Date().toISOString().slice(0, 10) } : r));
    return of({ success: true }).pipe(delay(200));
  }
  updateRuleWeight(id: string, weight: number) {
    this.rules.set(this.rules().map(r => r.id === id ? { ...r, weight, lastModified: new Date().toISOString().slice(0, 10) } : r));
    return of({ success: true }).pipe(delay(200));
  }
  publishRule(id: string, conditions: RuleCondition[], action: string, severity: ComplianceRule['severity'], summary: string, modifiedBy: string) {
    this.rules.set(this.rules().map(r => {
      if (r.id !== id) return r;
      const version = r.version + 1;
      return {
        ...r, conditions, action, severity, version, lastModified: new Date().toISOString().slice(0, 10),
        versionHistory: [...r.versionHistory, { version, modifiedBy, date: new Date().toISOString().slice(0, 10), summary }]
      };
    }));
    return of({ success: true }).pipe(delay(400));
  }
  createRule(rule: ComplianceRule) {
    this.rules.set([rule, ...this.rules()]);
    return of({ success: true }).pipe(delay(300));
  }

  // ===== Model Governance (M23) =====
  getModels() { return of(MOCK_MODELS).pipe(delay(200)); }
  getModel(id: string) { return of(MOCK_MODELS.find(m => m.id === id)).pipe(delay(150)); }

  // ===== Audit Trail (M24) =====
  getAuditLog() { return of(MOCK_AUDIT_LOG).pipe(delay(200)); }

  // ===== Regulatory Calendar (M25) =====
  getObligations() { return of(this.obligations()).pipe(delay(200)); }
  getObligation(id: string) { return of(this.obligations().find(o => o.id === id)).pipe(delay(150)); }
  addObligation(obligation: RegulatoryObligation) {
    this.obligations.set([obligation, ...this.obligations()]);
    return of({ success: true }).pipe(delay(300));
  }
  updateObligationStatus(id: string, status: RegulatoryObligation['status']) {
    this.obligations.set(this.obligations().map(o => o.id === id
      ? { ...o, status, completedDate: status === 'completed' ? new Date().toISOString().slice(0, 10) : o.completedDate }
      : o));
    return of({ success: true }).pipe(delay(300));
  }
  reorderObligations(newOrder: RegulatoryObligation[]) {
    this.obligations.set(newOrder);
  }
  deleteObligation(id: string) {
    this.obligations.set(this.obligations().filter(o => o.id !== id));
    return of({ success: true }).pipe(delay(200));
  }
  addObligationNote(id: string, note: CaseNote) {
    this.obligations.set(this.obligations().map(o => o.id === id ? { ...o, notes: [...o.notes, note] } : o));
    return of({ success: true }).pipe(delay(200));
  }

  // ===== Customer Due Diligence (M20-adjacent, ACT) =====
  getCddCases() { return of(this.cddCases()).pipe(delay(200)); }
  getCddCase(id: string) { return of(this.cddCases().find(c => c.id === id)).pipe(delay(150)); }
  updateCddField(caseId: string, label: string, value: string) {
    this.cddCases.set(this.cddCases().map(c => c.id === caseId
      ? { ...c, fields: c.fields.map(f => f.label === label ? { ...f, value, completed: !!value.trim() } : f) } : c));
    return of({ success: true }).pipe(delay(200));
  }
  submitCddForReview(caseId: string) {
    this.cddCases.set(this.cddCases().map(c => c.id === caseId ? { ...c, status: 'pending_review' } : c));
    return of({ success: true }).pipe(delay(300));
  }
  approveCdd(caseId: string, reviewedBy: string) {
    this.cddCases.set(this.cddCases().map(c => c.id === caseId
      ? { ...c, status: 'completed', reviewedBy, reviewedAt: new Date().toISOString().slice(0, 10) } : c));
    return of({ success: true }).pipe(delay(300));
  }
  addCddNote(caseId: string, note: CaseNote) {
    this.cddCases.set(this.cddCases().map(c => c.id === caseId ? { ...c, notes: [...c.notes, note] } : c));
    return of({ success: true }).pipe(delay(200));
  }

  // ===== Enhanced Due Diligence (M20, ACT) =====
  getEddCases() { return of(this.eddCases()).pipe(delay(200)); }
  getEddCase(id: string) { return of(this.eddCases().find(c => c.id === id)).pipe(delay(150)); }
  toggleEddChecklistItem(caseId: string, item: string) {
    this.eddCases.set(this.eddCases().map(c => c.id === caseId
      ? { ...c, checklist: c.checklist.map((i: EddChecklistItem) => i.item === item ? { ...i, completed: !i.completed } : i) } : c));
    return of({ success: true }).pipe(delay(200));
  }
  updateEddStatus(caseId: string, status: EddCase['status']) {
    this.eddCases.set(this.eddCases().map(c => c.id === caseId
      ? { ...c, status, completedAt: status === 'completed' ? new Date().toISOString().slice(0, 16).replace('T', ' ') : c.completedAt } : c));
    return of({ success: true }).pipe(delay(300));
  }
  addEddNote(caseId: string, note: CaseNote) {
    this.eddCases.set(this.eddCases().map(c => c.id === caseId ? { ...c, notes: [...c.notes, note] } : c));
    return of({ success: true }).pipe(delay(200));
  }

  // ===== Continuous / Ongoing Monitoring (M15, ACT) =====
  getMonitoringSchedule() { return of(this.monitoringSchedule()).pipe(delay(200)); }
  toggleMonitoringStatus(id: string) {
    this.monitoringSchedule.set(this.monitoringSchedule().map(m => m.id === id ? { ...m, status: m.status === 'active' ? 'paused' : 'active' } : m));
    return of({ success: true }).pipe(delay(200));
  }
  runMonitoringNow(id: string) {
    const changeDetected = Math.random() > 0.75;
    const now = new Date();
    const next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    this.monitoringSchedule.set(this.monitoringSchedule().map(m => m.id === id
      ? {
          ...m, lastRunAt: now.toISOString().slice(0, 16).replace('T', ' '), nextRunAt: next.toISOString().slice(0, 16).replace('T', ' '),
          lastResult: changeDetected ? 'change_detected' : 'no_change',
          changeDetail: changeDetected ? 'New signal detected on manual re-screen — review recommended.' : undefined
        }
      : m));
    return of({ success: true, changeDetected }).pipe(delay(1000));
  }

  // ===== AML Compliance Programme / Training / CSA (M26-M28) =====
  getPolicies() { return of(MOCK_POLICIES).pipe(delay(150)); }
  getTrainingRecords() { return of(MOCK_TRAINING).pipe(delay(150)); }
  getControlAssessments() { return of(MOCK_CONTROLS).pipe(delay(150)); }
}
