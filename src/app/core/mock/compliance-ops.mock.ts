import {
  Alert, ComplianceCase, StrSarFiling, CtrItrReport, RiskAppetiteTier, ComplianceRule,
  ModelGovernanceEntry, AuditLogEntry, RegulatoryObligation, CompliancePolicy, TrainingRecord, ControlAssessment
} from '../models/models';

export const MOCK_ALERTS: Alert[] = [
  { id: 'al-1', customerId: 'cus-2', customerName: 'Ibrahim Musa', type: 'Sanctions', severity: 'critical', ruleTriggered: 'OFAC SDN fuzzy match ≥ 90%', riskScore: 96, status: 'escalated', assignedTo: 'Temitope Oduwole', createdAt: '2026-09-08 08:10 AM', caseId: 'case-1' },
  { id: 'al-2', customerId: 'cus-3', customerName: 'Grace Effiong', type: 'PEP', severity: 'high', ruleTriggered: 'New PEP status detected', riskScore: 82, status: 'investigating', assignedTo: 'Temitope Oduwole', createdAt: '2026-09-07 04:22 PM', caseId: 'case-2' },
  { id: 'al-3', customerId: 'cus-5', customerName: 'Chidinma Nwosu', type: 'AML', severity: 'high', ruleTriggered: 'Structuring — 6 deposits under ₦1,000,000 in 24h', riskScore: 79, status: 'assigned', assignedTo: 'Ronke Odusanya', createdAt: '2026-09-08 06:45 AM' },
  { id: 'al-4', customerId: 'cus-6', customerName: 'Peter Okafor', type: 'Fraud', severity: 'medium', ruleTriggered: 'Device shared with 3 flagged accounts', riskScore: 64, status: 'open', createdAt: '2026-09-08 09:15 AM' },
  { id: 'al-5', customerId: 'cus-1', customerName: 'Tolulope Oke', type: 'Behavioural', severity: 'low', ruleTriggered: 'Transaction 4.2 std-dev above baseline', riskScore: 38, status: 'open', createdAt: '2026-09-08 07:02 AM' },
  { id: 'al-6', customerId: 'cus-7', customerName: 'Amaka Chukwu', type: 'Network', severity: 'medium', ruleTriggered: 'Connected to 23 previously flagged accounts', riskScore: 58, status: 'closed', assignedTo: 'Ronke Odusanya', createdAt: '2026-09-05 11:30 AM' }
];

export const MOCK_CASES: ComplianceCase[] = [
  {
    id: 'case-1', caseNumber: 'CASE-2026-0091', customerId: 'cus-2', customerName: 'Ibrahim Musa', alertId: 'al-1', type: 'Sanctions',
    status: 'escalated', priority: 'critical', assignedTo: 'Temitope Oduwole', openedAt: '2026-09-08 08:20 AM',
    summary: 'Fuzzy sanctions match against OFAC SDN list on onboarding screening.',
    timeline: [
      { label: 'Case opened from alert AL-1', date: '2026-09-08 08:20 AM', actor: 'System' },
      { label: 'Assigned to Temitope Oduwole', date: '2026-09-08 08:25 AM', actor: 'Rukayat Yaro' },
      { label: 'Evidence reviewed — name and DOB partial match', date: '2026-09-08 09:40 AM', actor: 'Temitope Oduwole' },
      { label: 'Escalated to MLRO for STR/SAR decision', date: '2026-09-08 10:15 AM', actor: 'Temitope Oduwole', note: 'High-confidence sanctions match, recommend filing.' }
    ]
  },
  {
    id: 'case-2', caseNumber: 'CASE-2026-0090', customerId: 'cus-3', customerName: 'Grace Effiong', alertId: 'al-2', type: 'PEP',
    status: 'investigating', priority: 'high', assignedTo: 'Temitope Oduwole', openedAt: '2026-09-07 04:30 PM',
    summary: 'Customer newly identified as a domestic PEP following change monitoring sweep.',
    timeline: [
      { label: 'Case opened from alert AL-2', date: '2026-09-07 04:30 PM', actor: 'System' },
      { label: 'EDD checklist triggered automatically', date: '2026-09-07 04:31 PM', actor: 'System' },
      { label: 'Source of wealth documentation requested', date: '2026-09-07 05:10 PM', actor: 'Temitope Oduwole' }
    ]
  },
  {
    id: 'case-3', caseNumber: 'CASE-2026-0087', customerId: 'cus-6', customerName: 'Peter Okafor', type: 'Fraud',
    status: 'pending_info', priority: 'medium', assignedTo: 'Ronke Odusanya', openedAt: '2026-09-06 10:05 AM',
    summary: 'Device fingerprint shared across multiple flagged merchant accounts.',
    timeline: [
      { label: 'Case opened manually', date: '2026-09-06 10:05 AM', actor: 'Ronke Odusanya' },
      { label: 'Requested additional ID verification from customer', date: '2026-09-06 11:00 AM', actor: 'Ronke Odusanya' }
    ]
  },
  {
    id: 'case-4', caseNumber: 'CASE-2026-0080', customerId: 'cus-7', customerName: 'Amaka Chukwu', alertId: 'al-6', type: 'Network',
    status: 'closed', priority: 'medium', assignedTo: 'Ronke Odusanya', openedAt: '2026-09-05 11:35 AM', closedAt: '2026-09-06 02:00 PM',
    summary: 'Network exposure review — connections found to be legitimate business associates.',
    timeline: [
      { label: 'Case opened from alert AL-6', date: '2026-09-05 11:35 AM', actor: 'System' },
      { label: 'Relationship analysis completed — no adverse findings', date: '2026-09-06 01:30 PM', actor: 'Ronke Odusanya' },
      { label: 'Case closed with rationale', date: '2026-09-06 02:00 PM', actor: 'Ronke Odusanya', note: 'Shared connections are verified co-directors of a registered business.' }
    ]
  }
];

export const MOCK_STR_SAR: StrSarFiling[] = [
  { id: 'str-1', caseId: 'case-1', caseNumber: 'CASE-2026-0091', customerName: 'Ibrahim Musa', status: 'pending_approval', narrativeSummary: 'Suspicious activity report drafted following confirmed sanctions list match during onboarding screening.', deadline: '2026-09-15', preparedBy: 'Temitope Oduwole' },
  { id: 'str-2', caseId: 'case-2', caseNumber: 'CASE-2026-0090', customerName: 'Grace Effiong', status: 'drafting', narrativeSummary: 'Draft pending outcome of enhanced due diligence and source-of-wealth review.', deadline: '2026-09-21', preparedBy: 'Temitope Oduwole' },
  { id: 'str-3', caseId: 'case-9', caseNumber: 'CASE-2026-0071', customerName: 'Uche Eze', status: 'filed', narrativeSummary: 'Structuring pattern confirmed across five linked accounts. Filed with NFIU.', deadline: '2026-08-30', filedAt: '2026-08-28', filingRef: 'NFIU-STR-000482', preparedBy: 'Ronke Odusanya', approvedBy: 'Rukayat Yaro' },
  { id: 'str-4', caseId: 'case-11', caseNumber: 'CASE-2026-0065', customerName: 'Blessing Adeyemi', status: 'confirmed', narrativeSummary: 'Mule account activity linked to fraud ring. Filing acknowledged by NFIU.', deadline: '2026-08-20', filedAt: '2026-08-18', filingRef: 'NFIU-STR-000463', preparedBy: 'Ronke Odusanya', approvedBy: 'Rukayat Yaro' }
];

export const MOCK_CTR_ITR: CtrItrReport[] = [
  { id: 'ctr-1', reportType: 'CTR', transactionRef: 'TXN-88291034', customerName: 'Chidinma Nwosu', amount: 6500000, currency: 'NGN', thresholdTriggered: 'Cash transaction > ₦5,000,000', status: 'ready', createdAt: '2026-09-08 06:50 AM' },
  { id: 'ctr-2', reportType: 'ITR', transactionRef: 'TXN-88290877', customerName: 'Emeka Obi', amount: 12000, currency: 'USD', thresholdTriggered: 'International transfer > $10,000', status: 'pending_validation', createdAt: '2026-09-08 09:10 AM' },
  { id: 'ctr-3', reportType: 'CTR', transactionRef: 'TXN-88289654', customerName: 'Samuel Etim', amount: 5200000, currency: 'NGN', thresholdTriggered: 'Cash transaction > ₦5,000,000', status: 'exception', createdAt: '2026-09-07 03:20 PM' },
  { id: 'ctr-4', reportType: 'ITR', transactionRef: 'TXN-88288120', customerName: 'Fatima Bello', amount: 18500, currency: 'USD', thresholdTriggered: 'International transfer > $10,000', status: 'submitted', createdAt: '2026-09-06 01:05 PM' },
  { id: 'ctr-5', reportType: 'CTR', transactionRef: 'TXN-88286903', customerName: 'Peter Okafor', amount: 7300000, currency: 'NGN', thresholdTriggered: 'Cash transaction > ₦5,000,000', status: 'confirmed', createdAt: '2026-09-05 10:40 AM' }
];

export const RISK_APPETITE_MATRIX: RiskAppetiteTier[] = [
  { riskLevel: 'Low', approver: 'Automated / Standard Approval', action: 'Auto-approve, standard monitoring', slaHours: 0 },
  { riskLevel: 'Medium', approver: 'Compliance Officer', action: 'Manual review before activation', slaHours: 24 },
  { riskLevel: 'High', approver: 'Chief Compliance Officer', action: 'EDD required, CCO sign-off', slaHours: 48 },
  { riskLevel: 'Very High', approver: 'Executive Risk Committee', action: 'Full EDD, committee approval required', slaHours: 72 },
  { riskLevel: 'Prohibited / Sanctions-Confirmed', approver: 'System (auto-block)', action: 'Reject / block activation immediately', slaHours: 0 }
];

export const MOCK_RULES: ComplianceRule[] = [
  { id: 'r-1', name: 'Structuring detection', module: 'Transaction Monitoring', description: 'Multiple deposits just under the reporting threshold within 24 hours.', parameter: '≥ 4 txns, 90% of ₦5,000,000 threshold', weight: 18, enabled: true, lastModified: '2026-08-20', action: 'Raise high-severity alert and route to TMS queue', severity: 'high', version: 3,
    conditions: [
      { field: 'transaction_count_24h', operator: '>=', value: '4' },
      { field: 'amount_pct_of_threshold', operator: '>=', value: '90', logic: 'AND' }
    ],
    versionHistory: [
      { version: 1, modifiedBy: 'Ronke Odusanya', date: '2026-05-01', summary: 'Initial rule created at 3 transactions.' },
      { version: 2, modifiedBy: 'Ronke Odusanya', date: '2026-07-02', summary: 'Increased threshold to 90% of reporting limit.' },
      { version: 3, modifiedBy: 'Ronke Odusanya', date: '2026-08-20', summary: 'Structuring detection threshold changed from 3 to 4 transactions.' }
    ]
  },
  { id: 'r-2', name: 'Rapid movement of funds', module: 'Transaction Monitoring', description: 'Funds received and moved out within a short window.', parameter: '< 2 hours between credit and debit', weight: 15, enabled: true, lastModified: '2026-08-20', action: 'Raise medium-severity alert', severity: 'medium', version: 1,
    conditions: [{ field: 'time_between_credit_debit_minutes', operator: '<', value: '120' }],
    versionHistory: [{ version: 1, modifiedBy: 'Ronke Odusanya', date: '2026-08-20', summary: 'Rule created.' }]
  },
  { id: 'r-3', name: 'Dormant account reactivation', module: 'Transaction Monitoring', description: 'Sudden activity on an account dormant for 90+ days.', parameter: '> 90 days dormant, then > ₦500,000 activity', weight: 12, enabled: true, lastModified: '2026-07-11', action: 'Raise medium-severity alert', severity: 'medium', version: 1,
    conditions: [
      { field: 'dormant_days', operator: '>', value: '90' },
      { field: 'reactivation_amount', operator: '>', value: '500000', logic: 'AND' }
    ],
    versionHistory: [{ version: 1, modifiedBy: 'Temitope Oduwole', date: '2026-07-11', summary: 'Rule created.' }]
  },
  { id: 'r-4', name: 'PEP proximity weighting', module: 'Customer Risk', description: 'Adds risk weight for confirmed PEP status or close association.', parameter: 'Domestic PEP +18, Foreign PEP +25', weight: 18, enabled: true, lastModified: '2026-06-30', action: 'Add weighted score to customer risk engine', severity: 'high', version: 2,
    conditions: [{ field: 'pep_status', operator: '=', value: 'confirmed' }],
    versionHistory: [
      { version: 1, modifiedBy: 'Rukayat Yaro', date: '2026-04-01', summary: 'Initial weighting created.' },
      { version: 2, modifiedBy: 'Rukayat Yaro', date: '2026-06-30', summary: 'Split weighting for domestic vs foreign PEP.' }
    ]
  },
  { id: 'r-5', name: 'High-risk geography', module: 'Customer Risk', description: 'Adds risk weight for customers or counterparties in high-risk jurisdictions.', parameter: 'FATF grey/black list countries', weight: 10, enabled: true, lastModified: '2026-06-30', action: 'Add weighted score to customer risk engine', severity: 'medium', version: 1,
    conditions: [{ field: 'country', operator: 'in', value: 'FATF grey/black list' }],
    versionHistory: [{ version: 1, modifiedBy: 'Rukayat Yaro', date: '2026-06-30', summary: 'Rule created.' }]
  },
  { id: 'r-6', name: 'Sanctions fuzzy-match threshold', module: 'Sanctions', description: 'Minimum confidence score to raise a sanctions alert.', parameter: '≥ 85% name similarity', weight: 25, enabled: true, lastModified: '2026-08-02', action: 'Raise critical-severity alert', severity: 'critical', version: 2,
    conditions: [{ field: 'match_score', operator: '>=', value: '85' }],
    versionHistory: [
      { version: 1, modifiedBy: 'Temitope Oduwole', date: '2026-03-10', summary: 'Initial threshold set at 80%.' },
      { version: 2, modifiedBy: 'Temitope Oduwole', date: '2026-08-02', summary: 'Raised to 85% to reduce false positives.' }
    ]
  },
  { id: 'r-7', name: 'Mandatory EDD trigger — VASP exposure', module: 'EDD', description: 'Requires enhanced due diligence for virtual asset service provider exposure.', parameter: 'Any confirmed VASP counterparty', weight: 14, enabled: false, lastModified: '2026-05-14', action: 'Open EDD case and block activation', severity: 'high', version: 1,
    conditions: [{ field: 'counterparty_type', operator: '=', value: 'VASP' }],
    versionHistory: [{ version: 1, modifiedBy: 'Rukayat Yaro', date: '2026-05-14', summary: 'Rule created, disabled pending policy sign-off.' }]
  },
  { id: 'r-8', name: 'CTR eligibility threshold', module: 'CTR/ITR', description: 'Cash transaction threshold for mandatory CTR filing.', parameter: '≥ ₦5,000,000 (Nigeria — CBN/NFIU)', weight: 0, enabled: true, lastModified: '2026-04-01', action: 'Queue transaction for CTR reporting', severity: 'low', version: 1,
    conditions: [{ field: 'cash_transaction_amount', operator: '>=', value: '5000000' }],
    versionHistory: [{ version: 1, modifiedBy: 'Ronke Odusanya', date: '2026-04-01', summary: 'Rule created per CBN/NFIU threshold.' }]
  }
];

export const MOCK_MODELS: ModelGovernanceEntry[] = [
  { id: 'm-1', name: 'Transaction Behavioural Baseline', version: 'v2.3.1', purpose: 'Builds per-customer behavioural baselines and scores deviations.', owner: 'Data Science Team', status: 'approved', precision: 0.91, recall: 0.86, falsePositiveRate: 0.06, populationStability: 0.02, lastValidated: '2026-07-15',
    featureImportance: [
      { feature: 'Transaction velocity (24h)', importance: 0.28 }, { feature: 'Amount deviation from baseline', importance: 0.24 },
      { feature: 'Beneficiary novelty', importance: 0.19 }, { feature: 'Time-of-day deviation', importance: 0.15 }, { feature: 'Geography deviation', importance: 0.14 }
    ],
    incidents: []
  },
  { id: 'm-2', name: 'Sanctions Fuzzy Matcher', version: 'v4.0.0', purpose: 'Name-matching model for sanctions, PEP and adverse media screening.', owner: 'Compliance Engineering', status: 'approved', precision: 0.88, recall: 0.94, falsePositiveRate: 0.11, populationStability: 0.03, lastValidated: '2026-08-01',
    featureImportance: [
      { feature: 'Levenshtein name distance', importance: 0.35 }, { feature: 'Phonetic similarity', importance: 0.27 },
      { feature: 'DOB proximity', importance: 0.21 }, { feature: 'Alias overlap', importance: 0.17 }
    ],
    incidents: [{ date: '2026-06-12', description: 'False-positive spike after list vendor pushed a malformed update; rolled back within 4 hours.', severity: 'medium' }]
  },
  { id: 'm-3', name: 'Fraud Network Risk Score', version: 'v1.4.0', purpose: 'Graph-based scoring of accounts connected to confirmed fraud rings.', owner: 'Data Science Team', status: 'in_review', precision: 0.79, recall: 0.72, falsePositiveRate: 0.15, populationStability: 0.06, lastValidated: '2026-09-01',
    featureImportance: [
      { feature: 'Shared device count', importance: 0.31 }, { feature: 'Network distance to known fraud node', importance: 0.29 },
      { feature: 'Account age', importance: 0.22 }, { feature: 'Shared IP range', importance: 0.18 }
    ],
    incidents: [{ date: '2026-09-01', description: 'Population stability index rising above target — under review before wider rollout.', severity: 'low' }]
  },
  { id: 'm-4', name: 'Legacy Rule-Based Risk Score v1', version: 'v1.0.0', purpose: 'Original deterministic customer risk scoring engine.', owner: 'Compliance Team', status: 'deprecated', precision: 0.71, recall: 0.65, falsePositiveRate: 0.22, populationStability: 0.11, lastValidated: '2026-02-10',
    featureImportance: [{ feature: 'Industry code', importance: 0.4 }, { feature: 'Country', importance: 0.35 }, { feature: 'Product type', importance: 0.25 }],
    incidents: [{ date: '2025-12-04', description: 'Elevated false-negative rate on layered corporate structures — superseded by network-aware models.', severity: 'high' }]
  }
];

export const MOCK_AUDIT_LOG: AuditLogEntry[] = [
  { id: 'au-1', actor: 'Temitope Oduwole', action: 'Escalated case', entityType: 'Case', entityId: 'CASE-2026-0091', timestamp: '2026-09-08 10:15 AM', ipAddress: '105.112.44.21', detail: 'Escalated to MLRO for STR/SAR decision.', oldValue: 'investigating', newValue: 'escalated' },
  { id: 'au-2', actor: 'System', action: 'Risk score recalculated', entityType: 'Customer', entityId: 'cus-3', timestamp: '2026-09-07 04:29 PM', ipAddress: 'internal', detail: 'Score changed from 54 (Medium) to 82 (High) — new PEP status.', oldValue: '54 (Medium)', newValue: '82 (High)' },
  { id: 'au-3', actor: 'Rukayat Yaro', action: 'Approved STR filing', entityType: 'STR/SAR', entityId: 'NFIU-STR-000482', timestamp: '2026-08-28 03:40 PM', ipAddress: '105.112.44.10', detail: 'Maker/checker approval for filing NFIU-STR-000482.', oldValue: 'pending_approval', newValue: 'filed' },
  { id: 'au-4', actor: 'Ronke Odusanya', action: 'Updated compliance rule', entityType: 'Rule', entityId: 'r-1', timestamp: '2026-08-20 11:02 AM', ipAddress: '105.112.44.33', detail: 'Structuring detection threshold changed from 3 to 4 transactions.', oldValue: '3 transactions', newValue: '4 transactions' },
  { id: 'au-5', actor: 'James Attah', action: 'Viewed customer record', entityType: 'Customer', entityId: 'cus-2', timestamp: '2026-09-08 08:05 AM', ipAddress: '197.210.55.9', detail: 'Read-only access — no changes made.' },
  { id: 'au-6', actor: 'System', action: 'Sanctions re-screen executed', entityType: 'Customer', entityId: 'all', timestamp: '2026-09-08 12:00 AM', ipAddress: 'internal', detail: 'Scheduled nightly re-screen against updated OFAC/UN/local lists.' }
];

export const MOCK_OBLIGATIONS: RegulatoryObligation[] = [
  { id: 'ob-1', title: 'File STR — Ibrahim Musa (CASE-2026-0091)', description: 'Suspicious transaction report arising from the confirmed sanctions match on onboarding screening.', category: 'STR', dueDate: '2026-09-15', status: 'due_this_week', owner: 'Temitope Oduwole', notes: [] },
  { id: 'ob-2', title: 'Submit August CTR batch to NFIU', description: 'Monthly batch of qualifying cash-transaction reports for August 2026.', category: 'CTR', dueDate: '2026-09-10', status: 'overdue', owner: 'Ronke Odusanya', notes: [{ id: 'n1', author: 'Ronke Odusanya', date: '2026-09-09 10:15 AM', text: 'Batch is compiled — waiting on final sign-off from MLRO before submission.' }] },
  { id: 'ob-3', title: 'Quarterly AML training — all staff', description: 'Mandatory AML/CFT refresher training for all employees, tracked in the Compliance Programme module.', category: 'Training', dueDate: '2026-09-30', status: 'due_this_week', owner: 'Compliance Team', notes: [] },
  { id: 'ob-4', title: 'KYC refresh — high-risk customer segment', description: 'Periodic KYC refresh required for all customers rated High or Very High risk.', category: 'KYC Review', dueDate: '2026-09-12', status: 'due_this_week', owner: 'Temitope Oduwole', notes: [] },
  { id: 'ob-5', title: 'Sanctions policy annual review', description: 'Annual review and re-approval of the Sanctions & PEP Screening Policy.', category: 'Policy Review', dueDate: '2026-11-01', status: 'due_this_week', owner: 'Rukayat Yaro', notes: [] },
  { id: 'ob-6', title: 'CBN AML/CFT returns — Q3 2026', description: 'Quarterly AML/CFT regulatory returns due to the Central Bank of Nigeria.', category: 'Regulatory Return', dueDate: '2026-10-15', status: 'due_this_week', owner: 'Rukayat Yaro', notes: [] },
  { id: 'ob-7', title: 'Renew data-vendor screening license', description: 'Annual licence renewal for the sanctions/PEP/adverse-media data vendor.', category: 'License', dueDate: '2026-08-25', status: 'completed', owner: 'Rukayat Yaro', completedDate: '2026-08-24', notes: [] }
];

export const MOCK_POLICIES: CompliancePolicy[] = [
  { id: 'pol-1', name: 'AML & CFT Policy', owner: 'Rukayat Yaro (MLRO)', lastReviewed: '2026-01-10', nextReview: '2027-01-10', status: 'current' },
  { id: 'pol-2', name: 'Customer Due Diligence Policy', owner: 'Temitope Oduwole', lastReviewed: '2025-11-02', nextReview: '2026-11-02', status: 'current' },
  { id: 'pol-3', name: 'Sanctions & PEP Screening Policy', owner: 'Rukayat Yaro (MLRO)', lastReviewed: '2025-10-01', nextReview: '2026-10-01', status: 'due_for_review' },
  { id: 'pol-4', name: 'Fraud Risk Management Policy', owner: 'Ronke Odusanya', lastReviewed: '2025-06-15', nextReview: '2026-06-15', status: 'overdue' }
];

export const MOCK_TRAINING: TrainingRecord[] = [
  { id: 'tr-1', employeeName: 'Rukayat Yaro', course: 'AML/CFT Fundamentals', completedDate: '2026-02-01', score: 96, certificateExpiry: '2027-02-01', status: 'completed' },
  { id: 'tr-2', employeeName: 'Temitope Oduwole', course: 'AML/CFT Fundamentals', completedDate: '2026-02-03', score: 91, certificateExpiry: '2027-02-03', status: 'completed' },
  { id: 'tr-3', employeeName: 'Ronke Odusanya', course: 'Fraud Typologies & Red Flags', completedDate: '2026-03-12', score: 88, certificateExpiry: '2027-03-12', status: 'completed' },
  { id: 'tr-4', employeeName: 'Joseph Alabi', course: 'AML/CFT Fundamentals', status: 'overdue' },
  { id: 'tr-5', employeeName: 'James Attah', course: 'Sanctions Screening Essentials', status: 'in_progress' }
];

export const MOCK_CONTROLS: ControlAssessment[] = [
  { id: 'ca-1', controlName: 'KYC / Customer Identification', evidenceStatus: 'collected', effectivenessScore: 92, rating: 'strong', remediationTasks: 0 },
  { id: 'ca-2', controlName: 'Beneficial Ownership Verification', evidenceStatus: 'partial', effectivenessScore: 68, rating: 'satisfactory', remediationTasks: 2 },
  { id: 'ca-3', controlName: 'Transaction Monitoring Coverage', evidenceStatus: 'collected', effectivenessScore: 85, rating: 'strong', remediationTasks: 0 },
  { id: 'ca-4', controlName: 'Sanctions Screening QA', evidenceStatus: 'collected', effectivenessScore: 79, rating: 'satisfactory', remediationTasks: 1 },
  { id: 'ca-5', controlName: 'EDD Completion & Sign-off', evidenceStatus: 'missing', effectivenessScore: 41, rating: 'weak', remediationTasks: 4 }
];
