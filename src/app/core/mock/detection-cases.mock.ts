import { DeviceProfile, FraudCaseHit, MerchantRiskProfile, RiskFactorWeight, RiskTierThreshold, TmsScenarioHit } from '../models/models';

export const MOCK_TMS_HITS: TmsScenarioHit[] = [
  { id: 'tms-1', scenario: 'Structuring', customerName: 'Chidinma Nwosu', customerId: 'cus-5', transactionRef: 'TXN-88291034', amount: 4800000, currency: 'NGN', riskScore: 82, status: 'escalated', detectedAt: '2026-09-08 06:50 AM', ruleParameters: '≥ 4 deposits, each ≥ 90% of ₦5,000,000 threshold, within 24h', linkedAlertId: 'al-3' },
  { id: 'tms-2', scenario: 'Rapid movement of funds', customerName: 'Peter Okafor', customerId: 'cus-6', transactionRef: 'TXN-88290512', amount: 1250000, currency: 'NGN', riskScore: 64, status: 'reviewing', detectedAt: '2026-09-08 09:20 AM', ruleParameters: '< 2 hours between credit and full debit' },
  { id: 'tms-3', scenario: 'Dormant account reactivation', customerName: 'Emeka Obi', customerId: 'cus-8', transactionRef: 'TXN-88289981', amount: 780000, currency: 'NGN', riskScore: 48, status: 'new', detectedAt: '2026-09-08 07:40 AM', ruleParameters: '> 90 days dormant, then > ₦500,000 activity' },
  { id: 'tms-4', scenario: 'Multiple receiving accounts', customerName: 'Amaka Chukwu', customerId: 'cus-7', transactionRef: 'TXN-88288760', amount: 2100000, currency: 'NGN', riskScore: 55, status: 'cleared', detectedAt: '2026-09-06 01:10 PM', ruleParameters: '≥ 5 distinct beneficiary accounts within 48h' },
  { id: 'tms-5', scenario: 'Circular transactions', customerName: 'Ibrahim Musa', customerId: 'cus-2', transactionRef: 'TXN-88287410', amount: 3400000, currency: 'NGN', riskScore: 88, status: 'escalated', detectedAt: '2026-09-05 04:15 PM', ruleParameters: 'Funds return to originating account within 3 hops', linkedAlertId: 'al-1' },
  { id: 'tms-6', scenario: 'Unusual timing / geography', customerName: 'Grace Effiong', customerId: 'cus-3', transactionRef: 'TXN-88286332', amount: 950000, currency: 'NGN', riskScore: 39, status: 'new', detectedAt: '2026-09-08 02:10 AM', ruleParameters: 'Transaction outside 06:00–22:00 local time window, high-risk geography' }
];

export const MOCK_FRAUD_HITS: FraudCaseHit[] = [
  { id: 'fr-1', typology: 'Account takeover', customerName: 'Peter Okafor', customerId: 'cus-6', channel: 'Mobile App', riskScore: 74, status: 'reviewing', detectedAt: '2026-09-08 09:15 AM', deviceId: 'dev-4', linkedCaseId: 'case-3', decision: 'CHALLENGE', signals: ['Device first seen 1 day before login', 'SIM swap flag from carrier', 'Login from new IP range'] },
  { id: 'fr-2', typology: 'Mule account behaviour', customerName: 'Amaka Chukwu', customerId: 'cus-7', channel: 'Internet Banking', riskScore: 58, status: 'cleared', detectedAt: '2026-09-05 11:35 AM', deviceId: 'dev-2', decision: 'REVIEW', signals: ['Device shared with 2 other customer profiles', 'Rapid inbound/outbound transfer pattern'], overrideDecision: 'ALLOW', overrideReason: 'Confirmed legitimate family device sharing after customer call-back verification.', overriddenBy: 'Ronke Odusanya', overriddenAt: '2026-09-05 01:10 PM' },
  { id: 'fr-3', typology: 'Device / credential compromise', customerName: 'Chidinma Nwosu', customerId: 'cus-5', channel: 'Mobile App', riskScore: 69, status: 'new', detectedAt: '2026-09-08 06:55 AM', deviceId: 'dev-1', decision: 'CHALLENGE', signals: ['New SIM registered in last 7 days', 'Password reset immediately before high-value transfer'] },
  { id: 'fr-4', typology: 'Collusive merchant activity', customerName: 'Uche Eze', customerId: 'cus-9', channel: 'POS', riskScore: 81, status: 'escalated', detectedAt: '2026-08-28 03:20 PM', deviceId: 'dev-5', decision: 'BLOCK', signals: ['Terminal linked to 2 previously suspended merchants', 'Abnormal chargeback ratio', 'Round-amount transaction clustering'] },
  { id: 'fr-5', typology: 'Social engineering', customerName: 'Blessing Adeyemi', customerId: 'cus-10', channel: 'USSD', riskScore: 47, status: 'reviewing', detectedAt: '2026-08-20 09:00 AM', decision: 'REVIEW', signals: ['Customer contacted support shortly before transfer', 'First-time beneficiary added same day as transfer'] }
];

export const RISK_FACTOR_WEIGHTS: RiskFactorWeight[] = [
  { id: 'rfw-1', label: 'Industry / Product Risk', category: 'Inherent', weight: 20 },
  { id: 'rfw-2', label: 'Geography Risk', category: 'Inherent', weight: 15 },
  { id: 'rfw-3', label: 'PEP / Sanctions / Adverse Media', category: 'Inherent', weight: 25 },
  { id: 'rfw-4', label: 'Transaction Volume & Velocity', category: 'Inherent', weight: 20 },
  { id: 'rfw-5', label: 'Channel & Delivery Risk', category: 'Inherent', weight: 20 },
  { id: 'rfw-6', label: 'KYC / Ownership Verification', category: 'Control', weight: 30 },
  { id: 'rfw-7', label: 'Transaction Monitoring Coverage', category: 'Control', weight: 25 },
  { id: 'rfw-8', label: 'Sanctions Screening QA', category: 'Control', weight: 25 },
  { id: 'rfw-9', label: 'EDD Completion Rate', category: 'Control', weight: 20 }
];

export const RISK_TIER_THRESHOLDS: RiskTierThreshold[] = [
  { tier: 'Low', minScore: 0, maxScore: 39 },
  { tier: 'Medium', minScore: 40, maxScore: 64 },
  { tier: 'High', minScore: 65, maxScore: 84 },
  { tier: 'Very High', minScore: 85, maxScore: 100 }
];

export const MOCK_MERCHANTS: MerchantRiskProfile[] = [
  { id: 'mer-1', merchantName: 'Lagos Fashion Hub', mcc: '5651 — Family Clothing Stores', country: 'Nigeria', onboardedAt: '2025-11-02', riskScore: 28, riskLevel: 'low', chargebackRate: 0.4, expectedMonthlyVolume: 8000000, actualMonthlyVolume: 8600000, flags: [], status: 'active' },
  { id: 'mer-2', merchantName: 'QuickCash Exchange Kiosk', mcc: '6051 — Non-FI Money Orders', country: 'Nigeria', onboardedAt: '2026-01-15', riskScore: 76, riskLevel: 'high', chargebackRate: 3.8, expectedMonthlyVolume: 5000000, actualMonthlyVolume: 21000000, flags: ['Volume 4.2x expected', 'MCC associated with elevated ML risk', 'Chargeback rate above 3% threshold'], status: 'under_review' },
  { id: 'mer-3', merchantName: 'Naija Gadgets Online', mcc: '5732 — Electronics Stores', country: 'Nigeria', onboardedAt: '2025-07-20', riskScore: 45, riskLevel: 'medium', chargebackRate: 1.9, expectedMonthlyVolume: 12000000, actualMonthlyVolume: 15500000, flags: ['Volume above expected range'], status: 'active' },
  { id: 'mer-4', merchantName: 'Shadow Trading Co.', mcc: '4829 — Wire Transfer Money Orders', country: 'Nigeria', onboardedAt: '2026-06-01', riskScore: 92, riskLevel: 'high', chargebackRate: 5.2, expectedMonthlyVolume: 2000000, actualMonthlyVolume: 34000000, flags: ['Volume 17x expected — possible transaction laundering', 'Newly onboarded with abnormal early volume', 'Director linked to a previously suspended merchant'], status: 'suspended' },
  { id: 'mer-5', merchantName: 'Abuja Bites Restaurant', mcc: '5812 — Eating Places', country: 'Nigeria', onboardedAt: '2024-09-10', riskScore: 15, riskLevel: 'low', chargebackRate: 0.2, expectedMonthlyVolume: 3000000, actualMonthlyVolume: 3100000, flags: [], status: 'active' }
];

export const MOCK_DEVICES: DeviceProfile[] = [
  { id: 'dev-1', deviceId: 'DVC-8827-AA10', deviceType: 'Mobile — Android', os: 'Android 14', ipAddress: '105.112.44.21', location: 'Lagos, Nigeria', linkedCustomers: ['Chidinma Nwosu'], riskLevel: 'medium', firstSeen: '2026-06-01', lastSeen: '2026-09-08', flags: ['New SIM registered on device in last 7 days'] },
  { id: 'dev-2', deviceId: 'DVC-4471-BB22', deviceType: 'Web — Desktop', os: 'Windows 11', ipAddress: '197.210.55.9', location: 'Lagos, Nigeria', linkedCustomers: ['Amaka Chukwu', 'Uche Eze', 'Blessing Adeyemi'], riskLevel: 'high', firstSeen: '2026-03-14', lastSeen: '2026-09-05', flags: ['Shared across 3 unrelated customer profiles', 'Session velocity anomaly'] },
  { id: 'dev-3', deviceId: 'DVC-2290-CC03', deviceType: 'Mobile — iOS', os: 'iOS 18', ipAddress: '41.58.100.4', location: 'Accra, Ghana', linkedCustomers: ['Temitope Oduwole'], riskLevel: 'low', firstSeen: '2025-10-02', lastSeen: '2026-09-04', flags: [] },
  { id: 'dev-4', deviceId: 'DVC-9931-DD44', deviceType: 'Mobile — Android', os: 'Android 12', ipAddress: '105.118.20.77', location: 'Port Harcourt, Nigeria', linkedCustomers: ['Peter Okafor'], riskLevel: 'high', firstSeen: '2026-09-07', lastSeen: '2026-09-08', flags: ['Device first seen 1 day before account-takeover alert', 'SIM swap flag from carrier signal'] },
  { id: 'dev-5', deviceId: 'DVC-6602-EE55', deviceType: 'POS Terminal', os: 'Embedded', ipAddress: '154.113.9.30', location: 'Lagos, Nigeria', linkedCustomers: ['Uche Eze'], riskLevel: 'high', firstSeen: '2026-08-01', lastSeen: '2026-08-28', flags: ['Terminal linked to 2 previously suspended merchants'] }
];
