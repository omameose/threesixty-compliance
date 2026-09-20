// ===================== AUTH & ORG =====================

export interface CompanyProfile {
  id: string;
  name: string;
  legalName: string;
  logoUrl: string;
  brandColor: string;
  website: string;
  supportEmail: string;
  address: string;
  industry: string;
  country: string;
  verified: boolean;
  createdAt: string;
}

export interface AppUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  avatarUrl: string;
  role: TeamRoleLevel;
  twoFactorEnabled: boolean;
  companyId: string;
  companyName?: string;
  /** True once the company's KYC has been approved; before that most features are blocked by the API. */
  companyApproved?: boolean;
  lastLoginAt: string;
}

export type TeamRoleLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface TeamRoleInfo {
  level: TeamRoleLevel;
  name: string;
  description: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatarUrl: string;
  role: TeamRoleLevel;
  status: 'active' | 'invited' | 'suspended';
  invitedAt: string;
  lastActive: string;
}

// ===================== SUBSCRIPTION =====================

/** A plan key such as 'free', 'basic', 'standard', 'enterprise'; admins can add more, so it is not a fixed union. */
export type PlanId = string;

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  billingCycle: 'month' | 'year';
  description: string;
  verificationsIncluded: number;
  overagePrice: number;
  features: string[];
  highlighted?: boolean;
  annualPrice?: number | null;
  customPricing?: boolean;
  trialDays?: number;
  currency?: string;
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  plan: string;
  invoiceUrl: string;
}

export interface Subscription {
  planId: PlanId;
  status: 'active' | 'trialing' | 'canceled' | 'past_due';
  renewsAt: string;
  trialEndsAt?: string;
  seats: number;
  usage: { used: number; included: number };
  billingCycle?: 'month' | 'year';
  cancelAtPeriodEnd?: boolean;
  pendingPlanId?: string | null;
  paymentMethod?: { brand: string; last4: string; expMonth?: number; expYear?: number } | null;
  failedAttempts?: number;
  nextRetryAt?: string | null;
  nextChargeAmount?: number | null;
  currency?: string;
}

// ===================== COMPLIANCE TEMPLATES =====================

export interface Sector {
  id: string;
  name: string;
  icon: string;
  description: string;
  industries: Industry[];
}

export interface Industry {
  id: string;
  name: string;
  description: string;
  templates: ComplianceTemplateSummary[];
}

export interface ComplianceTemplateSummary {
  id: string;
  name: string;
  type: 'KYC' | 'KYB' | 'AML' | 'Combined';
  description: string;
  fieldsCount: number;
  popular?: boolean;
  updatedAt: string;
}

// ===================== FORM BUILDER =====================

export type QuestionType =
  | 'short_text'
  | 'long_text'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'file_upload'
  | 'date'
  | 'email'
  | 'phone'
  | 'number'
  | 'country'
  | 'id_document'
  | 'signature'
  | 'address';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface FormQuestion {
  id: string;
  type: QuestionType;
  label: string;
  placeholder?: string;
  helpText?: string;
  required: boolean;
  options?: QuestionOption[];
  acceptedFileTypes?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  questions: FormQuestion[];
}

export type ComplianceFormStatus = 'draft' | 'in_review' | 'live' | 'paused' | 'archived';

export interface ComplianceForm {
  id: string;
  name: string;
  type: 'KYC' | 'KYB' | 'AML' | 'Combined';
  status: ComplianceFormStatus;
  sourceTemplateId?: string;
  sections: FormSection[];
  createdAt: string;
  updatedAt: string;
  submissionsCount: number;
  completedCount: number;
  pendingReviewCount: number;
  webhookEnabled: boolean;
}

// ===================== CUSTOMERS / SUBMISSIONS =====================

export type CustomerStatus =
  | 'not_started'
  | 'in_progress'
  | 'pending_review'
  | 'more_info_required'
  | 'approved'
  | 'rejected';

export interface CustomerAnswer {
  questionId: string;
  label: string;
  type: QuestionType;
  value: string;
  fileName?: string;
  fileSize?: string;
}

export interface Customer {
  id: string;
  complianceId: string;
  fullName: string;
  email: string;
  phone: string;
  avatarUrl?: string;
  formId: string;
  formName: string;
  status: CustomerStatus;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  startedAt: string;
  completedAt?: string;
  progress: number;
  country: string;
  answers: CustomerAnswer[];
  timeline: { label: string; date: string; note?: string }[];
  sanctionsHit: boolean;
  pepHit: boolean;
}

// ===================== DASHBOARD ANALYTICS =====================

export interface DashboardStats {
  totalCustomers: number;
  totalCustomersDelta: number;
  approvedRate: number;
  approvedRateDelta: number;
  pendingReview: number;
  pendingReviewDelta: number;
  avgVerificationTime: string;
  avgVerificationTimeDelta: number;
  monthlyVerifications: { month: string; kyc: number; kyb: number; aml: number }[];
  statusBreakdown: { status: string; value: number; color: string }[];
  riskBreakdown: { level: string; value: number; color: string }[];
  recentActivity: { id: string; text: string; time: string; icon: string }[];
}

// ===================== DEVELOPER CONSOLE =====================

export interface ApiKeyPair {
  id: string;
  environment: 'test' | 'live';
  publicKey: string;
  secretKeyMasked: string;
  createdAt: string;
  lastUsed: string;
}

export interface WebhookConfig {
  url: string;
  signingSecret: string;
  encryptionKey: string;
  events: string[];
  enabled: boolean;
}

export interface WebhookLog {
  id: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  statusCode: number;
  timestamp: string;
  url: string;
}

// ===================== TOOLS =====================

export interface ScreeningResult {
  id: string;
  name: string;
  type: 'Sanctions' | 'PEP' | 'Adverse Media';
  match: boolean;
  matchScore: number;
  list: string;
  country: string;
  checkedAt: string;
}

export type VerificationOutcome = 'VERIFIED' | 'REVIEW_REQUIRED' | 'FAILED' | 'PENDING';

export interface CaseNote {
  id: string;
  author: string;
  date: string;
  text: string;
}

export interface IdVerificationRecord {
  id: string;
  customerName: string;
  idType: string;
  idCountry: string;
  formName: string;
  status: CustomerStatus;
  checkedAt: string;
  outcome: VerificationOutcome;
  extractedName?: string;
  extractedDob?: string;
  extractedIdNumber?: string;
  expiryDate?: string;
  ocrConfidence: number;
  livenessResult: 'pass' | 'fail' | 'not_run';
  faceMatchScore: number;
  failureReasons: string[];
  provider: string;
  notes: CaseNote[];
}

export interface BusinessVerificationRecord {
  id: string;
  businessName: string;
  verificationType: string;
  referenceNumber: string;
  country: string;
  status: CustomerStatus;
  checkedAt: string;
  outcome: VerificationOutcome;
  legalName?: string;
  incorporationStatus?: 'Active' | 'Dissolved' | 'Inactive';
  registeredAddress?: string;
  directors: { name: string; role: string }[];
  shareholders: { name: string; ownershipPct: number }[];
  discrepancies: string[];
  confidenceScore: number;
  dataSources: string[];
  notes: CaseNote[];
}

export interface DocumentVerificationRecord {
  id: string;
  customerName: string;
  documentType: string;
  issuingCountry: string;
  documentNumber: string;
  expiryDate?: string;
  outcome: VerificationOutcome;
  authenticityScore: number;
  tamperIndicators: string[];
  extractedFields: { label: string; value: string; matchesSubmitted: boolean }[];
  anomalies: string[];
  provider: string;
  checkedAt: string;
  notes: CaseNote[];
}

// ===================== SANCTIONS / PEP / ADVERSE MEDIA CASE WORKBENCH (KNOW) =====================

export type ScreeningReviewStatus = 'pending' | 'confirmed_match' | 'false_positive' | 'escalated';

export type SanctionsVerdict = 'CLEAR' | 'POTENTIAL_MATCH' | 'MATCH';

export interface SanctionsCase {
  id: string;
  customerId?: string;
  subjectName: string;
  subjectType: 'Individual' | 'Business';
  dob?: string;
  nationality: string;
  country: string;
  identifiers: string[];
  verdict: SanctionsVerdict;
  matchScore: number;
  matchedList?: string;
  matchedListVersion?: string;
  matchedEntityName?: string;
  matchedAliases?: string[];
  matchedCountry?: string;
  evidenceSummary?: string;
  screenedAt: string;
  reviewStatus: ScreeningReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes: CaseNote[];
}

export type PepVerdict = 'CLEAR' | 'POTENTIAL_PEP' | 'PEP_MATCH';

export interface PepCase {
  id: string;
  customerId?: string;
  subjectName: string;
  verdict: PepVerdict;
  confidenceScore: number;
  position?: string;
  country?: string;
  category?: 'Domestic PEP' | 'Foreign PEP' | 'International Organisation PEP';
  relationship?: 'Self' | 'Family Member' | 'Close Associate';
  relatedPepName?: string;
  source?: string;
  dataSourceVersion?: string;
  screenedAt: string;
  reviewStatus: ScreeningReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  eddRequested: boolean;
  notes: CaseNote[];
}

export type AdverseMediaVerdict = 'CLEAR' | 'POTENTIAL_RISK';

export interface AdverseMediaArticle {
  headline: string;
  url: string;
  source: string;
  sourceCredibility: 'high' | 'medium' | 'low';
  publishedDate: string;
  themes: string[];
  stage: 'Allegation' | 'Investigation' | 'Charge' | 'Conviction' | 'Regulatory Action';
  confidence: number;
  excerpt: string;
}

export interface AdverseMediaCase {
  id: string;
  customerId?: string;
  subjectName: string;
  verdict: AdverseMediaVerdict;
  riskScore: number;
  articles: AdverseMediaArticle[];
  screenedAt: string;
  reviewStatus: ScreeningReviewStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  notes: CaseNote[];
}

// ===================== KYB & BENEFICIAL OWNERSHIP (KNOW) =====================

export interface OwnershipNode {
  id: string;
  name: string;
  type: 'company' | 'person';
  ownershipPct?: number;
  isUbo?: boolean;
  flag?: 'nominee' | 'offshore' | 'complex';
  children?: OwnershipNode[];
}

export interface KybCompany {
  id: string;
  legalName: string;
  registrationNumber: string;
  country: string;
  status: 'Active' | 'Dissolved' | 'Inactive';
  incorporationDate: string;
  registeredAddress: string;
  industry: string;
  directors: { name: string; role: string; nationality: string }[];
  shareholders: { name: string; type: 'Person' | 'Company'; ownershipPct: number; country?: string }[];
  ownershipTree: OwnershipNode;
  ubos: { name: string; effectiveOwnershipPct: number; nationality: string }[];
  riskFlags: string[];
  dataSources: string[];
  verificationStatus: 'verified' | 'review_required' | 'rejected' | 'pending';
  verifiedAt?: string;
  verifiedBy?: string;
  notes: CaseNote[];
}

// ===================== TRANSACTION MONITORING / FRAUD / MERCHANT / DEVICE (UNDERSTAND) =====================

export type DetectionHitStatus = 'new' | 'reviewing' | 'escalated' | 'cleared';

export interface TmsScenarioHit {
  id: string;
  scenario: string;
  customerName: string;
  customerId: string;
  transactionRef: string;
  amount: number;
  currency: string;
  riskScore: number;
  status: DetectionHitStatus;
  detectedAt: string;
  ruleParameters: string;
  linkedAlertId?: string;
}

export type FraudDecision = 'ALLOW' | 'REVIEW' | 'CHALLENGE' | 'BLOCK';

export interface FraudCaseHit {
  id: string;
  typology: string;
  customerName: string;
  customerId: string;
  channel: string;
  riskScore: number;
  status: DetectionHitStatus;
  detectedAt: string;
  linkedCaseId?: string;
  deviceId?: string;
  decision: FraudDecision;
  signals: string[];
  overrideDecision?: FraudDecision;
  overrideReason?: string;
  overriddenBy?: string;
  overriddenAt?: string;
}

export interface RiskFactorWeight {
  id: string;
  label: string;
  category: 'Inherent' | 'Control';
  weight: number;
}

export interface RiskTierThreshold {
  tier: 'Low' | 'Medium' | 'High' | 'Very High';
  minScore: number;
  maxScore: number;
}

export interface MerchantRiskProfile {
  id: string;
  merchantName: string;
  mcc: string;
  country: string;
  onboardedAt: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  chargebackRate: number;
  expectedMonthlyVolume: number;
  actualMonthlyVolume: number;
  flags: string[];
  status: 'active' | 'under_review' | 'suspended';
}

export interface DeviceProfile {
  id: string;
  deviceId: string;
  deviceType: string;
  os: string;
  ipAddress: string;
  location: string;
  linkedCustomers: string[];
  riskLevel: 'low' | 'medium' | 'high';
  firstSeen: string;
  lastSeen: string;
  flags: string[];
}

export interface CustomerRiskBreakdown {
  customerId: string;
  inherentRisk: number;
  controlEffectiveness: number;
  residualRisk: number;
  components: { label: string; score: number; weight: number }[];
}

// ===================== ALERTS & CASE MANAGEMENT (ACT) =====================

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'assigned' | 'investigating' | 'escalated' | 'closed';
export type AlertType = 'AML' | 'Fraud' | 'Sanctions' | 'PEP' | 'Behavioural' | 'Network';

export interface Alert {
  id: string;
  customerId: string;
  customerName: string;
  type: AlertType;
  severity: AlertSeverity;
  ruleTriggered: string;
  riskScore: number;
  status: AlertStatus;
  assignedTo?: string;
  createdAt: string;
  caseId?: string;
}

export type CaseStatus = 'open' | 'assigned' | 'investigating' | 'pending_info' | 'decision' | 'closed' | 'escalated';

export interface CaseTimelineEntry {
  label: string;
  date: string;
  actor?: string;
  note?: string;
}

export interface ComplianceCase {
  id: string;
  caseNumber: string;
  customerId: string;
  customerName: string;
  alertId?: string;
  type: AlertType;
  status: CaseStatus;
  priority: AlertSeverity;
  assignedTo: string;
  openedAt: string;
  closedAt?: string;
  summary: string;
  timeline: CaseTimelineEntry[];
}

export type StrSarStatus = 'drafting' | 'pending_approval' | 'filed' | 'confirmed';

export interface StrSarFiling {
  id: string;
  caseId: string;
  caseNumber: string;
  customerName: string;
  status: StrSarStatus;
  narrativeSummary: string;
  deadline: string;
  filedAt?: string;
  filingRef?: string;
  preparedBy: string;
  approvedBy?: string;
}

export type CtrItrStatus = 'pending_validation' | 'exception' | 'ready' | 'submitted' | 'confirmed';

export interface CtrItrReport {
  id: string;
  reportType: 'CTR' | 'ITR';
  transactionRef: string;
  customerName: string;
  amount: number;
  currency: string;
  thresholdTriggered: string;
  status: CtrItrStatus;
  createdAt: string;
}

export interface RiskAppetiteTier {
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High' | 'Prohibited / Sanctions-Confirmed';
  approver: string;
  action: string;
  slaHours: number;
}

// ===================== GOVERNANCE (GOVERN) =====================

export interface RuleCondition {
  field: string;
  operator: '>' | '>=' | '<' | '<=' | '=' | '!=' | 'contains' | 'in';
  value: string;
  logic?: 'AND' | 'OR';
}

export interface RuleVersionEntry {
  version: number;
  modifiedBy: string;
  date: string;
  summary: string;
}

export interface ComplianceRule {
  id: string;
  name: string;
  module: 'Transaction Monitoring' | 'Customer Risk' | 'Sanctions' | 'EDD' | 'CTR/ITR';
  description: string;
  parameter: string;
  weight: number;
  enabled: boolean;
  lastModified: string;
  conditions: RuleCondition[];
  action: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  version: number;
  versionHistory: RuleVersionEntry[];
}

export interface ModelFeatureImportance {
  feature: string;
  importance: number;
}

export interface ModelIncident {
  date: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ModelGovernanceEntry {
  id: string;
  name: string;
  version: string;
  purpose: string;
  owner: string;
  status: 'approved' | 'in_review' | 'deprecated';
  precision: number;
  recall: number;
  falsePositiveRate: number;
  populationStability: number;
  lastValidated: string;
  featureImportance: ModelFeatureImportance[];
  incidents: ModelIncident[];
}

export interface AuditLogEntry {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ipAddress: string;
  detail: string;
  oldValue?: string;
  newValue?: string;
}

export type ObligationStatus = 'overdue' | 'due_this_week' | 'completed';

export interface RegulatoryObligation {
  id: string;
  title: string;
  description?: string;
  category: 'STR' | 'CTR' | 'Training' | 'KYC Review' | 'Policy Review' | 'License' | 'Regulatory Return';
  dueDate: string;
  status: ObligationStatus;
  owner: string;
  completedDate?: string;
  notes: CaseNote[];
}

export interface CompliancePolicy {
  id: string;
  name: string;
  owner: string;
  lastReviewed: string;
  nextReview: string;
  status: 'current' | 'due_for_review' | 'overdue';
}

export interface TrainingRecord {
  id: string;
  employeeName: string;
  course: string;
  completedDate?: string;
  score?: number;
  certificateExpiry?: string;
  status: 'completed' | 'overdue' | 'in_progress';
}

export interface ControlAssessment {
  id: string;
  controlName: string;
  evidenceStatus: 'collected' | 'partial' | 'missing';
  effectivenessScore: number;
  rating: 'strong' | 'satisfactory' | 'weak';
  remediationTasks: number;
}

// ===================== CUSTOMER DUE DILIGENCE (ACT) =====================

export interface CddChecklistField {
  label: string;
  required: boolean;
  completed: boolean;
  value?: string;
}

export interface CddCase {
  id: string;
  customerId: string;
  customerName: string;
  customerType: 'Individual' | 'Business';
  status: 'in_progress' | 'pending_review' | 'completed';
  fields: CddChecklistField[];
  reviewedBy?: string;
  reviewedAt?: string;
  notes: CaseNote[];
}

// ===================== ENHANCED DUE DILIGENCE (ACT) =====================

export interface EddChecklistItem {
  item: string;
  completed: boolean;
}

export interface EddCase {
  id: string;
  customerId: string;
  customerName: string;
  triggerReasons: string[];
  checklist: EddChecklistItem[];
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  assignedTo?: string;
  openedAt: string;
  completedAt?: string;
  sourceOfFunds?: string;
  sourceOfWealth?: string;
  notes: CaseNote[];
}

// ===================== CONTINUOUS MONITORING (ACT) =====================

export interface MonitoringScheduleEntry {
  id: string;
  customerId: string;
  customerName: string;
  monitoringType: 'Sanctions' | 'PEP' | 'Adverse Media' | 'Risk Score' | 'Corporate Changes';
  frequency: 'Daily' | 'Weekly' | 'Monthly' | 'On list update';
  lastRunAt: string;
  nextRunAt: string;
  lastResult: 'no_change' | 'change_detected';
  changeDetail?: string;
  status: 'active' | 'paused';
}

// ===================== NETWORK / GRAPH ANALYTICS (UNDERSTAND) =====================

export type GraphNodeType = 'customer' | 'account' | 'device' | 'merchant' | 'business';

export interface GraphNode {
  id: string;
  label: string;
  type: GraphNodeType;
  risk: 'low' | 'medium' | 'high';
  detail: string;
  customerId?: string;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
}

export interface NetworkGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
