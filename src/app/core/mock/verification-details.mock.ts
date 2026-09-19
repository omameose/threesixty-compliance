import { BusinessVerificationRecord, DocumentVerificationRecord, IdVerificationRecord } from '../models/models';

export const ID_TYPES: string[] = [
  'International Passport',
  'National ID Card (NIN)',
  "Voter's Card (PVC)",
  "Driver's License",
  'Bank Verification Number (BVN) Slip',
  'Permanent Resident Card',
  'Ghana Card (National ID)',
  'Huduma Namba (National ID — Kenya)',
  'Smart ID Card (South Africa)',
  'Social Security Number (SSN) Card',
  'Refugee / Immigration ID',
  'Military ID Card'
];

export const VERIFICATION_COUNTRIES: string[] = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States', 'Canada', 'UAE', 'Other'
];

export const BUSINESS_VERIFICATION_TYPES: string[] = [
  'CAC Registration Number (RC/BN)',
  'Tax Identification Number (TIN)',
  'Certificate of Incorporation',
  'Business Name Registration',
  'VAT Registration Number',
  'SCUML Certificate',
  'Memorandum & Articles of Association',
  "Ghana RGD Registration Number",
  'Kenya BRS Registration Number',
  'South Africa CIPC Registration Number'
];

export const DOCUMENT_TYPES: string[] = [
  'International Passport', 'National ID Card', "Driver's License", 'Utility Bill (Proof of Address)',
  'Bank Statement', 'Certificate of Incorporation', 'Board Resolution', 'Tax Clearance Certificate'
];

export const ID_PROVIDERS: string[] = ['Smile ID', 'Youverify', 'VerifyMe', 'Prembly'];

export const MOCK_ID_VERIFICATIONS: IdVerificationRecord[] = [
  { id: 'idv-1', customerName: 'Tolulope Oke', idType: 'National ID Card (NIN)', idCountry: 'Nigeria', formName: 'Individual Customer KYC', status: 'not_started', checkedAt: '2026-08-03', outcome: 'PENDING', ocrConfidence: 0, livenessResult: 'not_run', faceMatchScore: 0, failureReasons: [], provider: 'Smile ID', notes: [] },
  { id: 'idv-2', customerName: 'Temitope Oduwole', idType: 'International Passport', idCountry: 'Ghana', formName: 'Business / Merchant KYB', status: 'in_progress', checkedAt: '2026-08-04', outcome: 'PENDING', ocrConfidence: 0, livenessResult: 'not_run', faceMatchScore: 0, failureReasons: [], provider: 'Youverify', notes: [] },
  { id: 'idv-3', customerName: 'Ronke Odusanya', idType: "Driver's License", idCountry: 'Kenya', formName: 'Investor Enhanced Due Diligence', status: 'pending_review', checkedAt: '2026-08-05', outcome: 'REVIEW_REQUIRED', extractedName: 'Ronke A. Odusanya', extractedDob: '1989-03-14', extractedIdNumber: 'DL-88213094', expiryDate: '2028-03-14', ocrConfidence: 74, livenessResult: 'pass', faceMatchScore: 68, failureReasons: ['Face match below 80% confidence threshold'], provider: 'VerifyMe', notes: [] },
  { id: 'idv-4', customerName: 'Ibrahim Musa', idType: "Voter's Card (PVC)", idCountry: 'Nigeria', formName: 'Individual Customer KYC', status: 'rejected', checkedAt: '2026-08-07', outcome: 'FAILED', extractedName: 'Ibrahim A. Musa', extractedDob: '1978-11-02', extractedIdNumber: 'PVC-90A2C4E1', ocrConfidence: 91, livenessResult: 'fail', faceMatchScore: 22, failureReasons: ['Liveness check failed — static image detected', 'Face match below threshold'], provider: 'Smile ID', notes: [{ id: 'n1', author: 'Temitope Oduwole', date: '2026-08-07 10:20 AM', text: 'Liveness failure pattern consistent with a printed photo presentation attack. Recommend re-capture on video call.' }] },
  { id: 'idv-5', customerName: 'Grace Effiong', idType: 'Bank Verification Number (BVN) Slip', idCountry: 'Nigeria', formName: 'Business / Merchant KYB', status: 'approved', checkedAt: '2026-08-08', outcome: 'VERIFIED', extractedName: 'Grace O. Effiong', extractedDob: '1985-06-21', extractedIdNumber: 'BVN-22104487321', ocrConfidence: 98, livenessResult: 'pass', faceMatchScore: 96, failureReasons: [], provider: 'Prembly', notes: [] },
  { id: 'idv-6', customerName: 'Samuel Etim', idType: 'Ghana Card (National ID)', idCountry: 'Ghana', formName: 'Individual Customer KYC', status: 'approved', checkedAt: '2026-08-09', outcome: 'VERIFIED', extractedName: 'Samuel K. Etim', extractedDob: '1992-01-30', extractedIdNumber: 'GHA-901224871-3', expiryDate: '2030-01-30', ocrConfidence: 95, livenessResult: 'pass', faceMatchScore: 93, failureReasons: [], provider: 'Youverify', notes: [] },
  { id: 'idv-7', customerName: 'Fatima Bello', idType: 'Smart ID Card (South Africa)', idCountry: 'South Africa', formName: 'Investor Enhanced Due Diligence', status: 'more_info_required', checkedAt: '2026-08-10', outcome: 'REVIEW_REQUIRED', extractedName: 'Fatima Bello', extractedDob: '1990-09-18', extractedIdNumber: 'ZA-9009185800086', ocrConfidence: 82, livenessResult: 'pass', faceMatchScore: 79, failureReasons: ['Document expiry date not clearly legible — manual confirmation required'], provider: 'VerifyMe', notes: [] }
];

export const MOCK_BUSINESS_VERIFICATIONS: BusinessVerificationRecord[] = [
  { id: 'biz-1', businessName: 'PayFlux Technologies Limited', verificationType: 'CAC Registration Number (RC/BN)', referenceNumber: 'RC-1487321', country: 'Nigeria', status: 'approved', checkedAt: '2026-08-02', outcome: 'VERIFIED', legalName: 'PayFlux Technologies Limited', incorporationStatus: 'Active', registeredAddress: '14 Adeola Odeku Street, Victoria Island, Lagos', directors: [{ name: 'Rukayat Yaro', role: 'Managing Director' }, { name: 'Tolulope Oke', role: 'Director' }], shareholders: [{ name: 'Rukayat Yaro', ownershipPct: 60 }, { name: 'Tolulope Oke', ownershipPct: 40 }], discrepancies: [], confidenceScore: 97, dataSources: ['CAC Registry'], notes: [] },
  { id: 'biz-2', businessName: 'Nimbus Bank Plc', verificationType: 'Tax Identification Number (TIN)', referenceNumber: 'TIN-08812345-0001', country: 'Nigeria', status: 'approved', checkedAt: '2026-08-04', outcome: 'VERIFIED', legalName: 'Nimbus Bank Plc', incorporationStatus: 'Active', registeredAddress: '9 Marina Road, Lagos Island, Lagos', directors: [{ name: 'Adaeze Nwankwo', role: 'Chairman' }], shareholders: [{ name: 'Nimbus Holdings Ltd', ownershipPct: 100 }], discrepancies: [], confidenceScore: 99, dataSources: ['FIRS TIN Registry', 'CAC Registry'], notes: [] },
  { id: 'biz-3', businessName: 'Harvestly Agro Exports', verificationType: 'SCUML Certificate', referenceNumber: 'SCUML-2026-00931', country: 'Nigeria', status: 'pending_review', checkedAt: '2026-08-06', outcome: 'REVIEW_REQUIRED', legalName: 'Harvestly Agro Exports Limited', incorporationStatus: 'Active', registeredAddress: '22 Awolowo Way, Ikeja, Lagos', directors: [{ name: 'Chika Obiora', role: 'Director' }], shareholders: [{ name: 'Chika Obiora', ownershipPct: 70 }, { name: 'Offshore Holdings BVI', ownershipPct: 30 }], discrepancies: ['Registered address on SCUML certificate does not match CAC filing', '30% shareholder is an offshore entity — beneficial owner not yet disclosed'], confidenceScore: 61, dataSources: ['SCUML Registry', 'CAC Registry'], notes: [] },
  { id: 'biz-4', businessName: 'Medico Health Ghana Ltd', verificationType: 'Ghana RGD Registration Number', referenceNumber: 'RGD-CS-114820', country: 'Ghana', status: 'in_progress', checkedAt: '2026-08-07', outcome: 'PENDING', directors: [], shareholders: [], discrepancies: [], confidenceScore: 0, dataSources: ['Ghana RGD'], notes: [] },
  { id: 'biz-5', businessName: 'EduSpark Kenya', verificationType: 'Kenya BRS Registration Number', referenceNumber: 'BRS-PVT-993201', country: 'Kenya', status: 'not_started', checkedAt: '2026-08-08', outcome: 'PENDING', directors: [], shareholders: [], discrepancies: [], confidenceScore: 0, dataSources: [], notes: [] },
  { id: 'biz-6', businessName: 'CargoLine SA (Pty) Ltd', verificationType: 'South Africa CIPC Registration Number', referenceNumber: 'CIPC-2021/558214/07', country: 'South Africa', status: 'rejected', checkedAt: '2026-08-09', outcome: 'FAILED', incorporationStatus: 'Dissolved', directors: [{ name: 'Johan van der Berg', role: 'Former Director' }], shareholders: [], discrepancies: ['CIPC registry shows entity was deregistered on 2025-11-02', 'Company presented an outdated certificate of incorporation'], confidenceScore: 12, dataSources: ['CIPC Registry'], notes: [{ id: 'n2', author: 'Ronke Odusanya', date: '2026-08-09 02:15 PM', text: 'Entity confirmed deregistered — recommend rejection and closure of onboarding.' }] }
];

export const MOCK_DOCUMENT_VERIFICATIONS: DocumentVerificationRecord[] = [
  { id: 'doc-1', customerName: 'Tolulope Oke', documentType: 'International Passport', issuingCountry: 'Nigeria', documentNumber: 'A05213489', expiryDate: '2029-04-12', outcome: 'VERIFIED', authenticityScore: 97, tamperIndicators: [], extractedFields: [{ label: 'Full Name', value: 'Tolulope A. Oke', matchesSubmitted: true }, { label: 'Date of Birth', value: '1994-05-02', matchesSubmitted: true }, { label: 'Passport No.', value: 'A05213489', matchesSubmitted: true }], anomalies: [], provider: 'Smile ID', checkedAt: '2026-09-08 08:10 AM', notes: [] },
  { id: 'doc-2', customerName: 'Ibrahim Musa', documentType: "Driver's License", issuingCountry: 'Nigeria', documentNumber: 'DL-90A2C4E1', expiryDate: '2024-01-15', outcome: 'FAILED', authenticityScore: 38, tamperIndicators: ['Font inconsistency detected in date-of-birth field', 'Hologram security feature not detected'], extractedFields: [{ label: 'Full Name', value: 'Ibrahim A. Musa', matchesSubmitted: true }, { label: 'Expiry Date', value: '2024-01-15', matchesSubmitted: false }], anomalies: ['Document expired 19 months before submission', 'Possible digital tampering on issue date'], provider: 'Prembly', checkedAt: '2026-09-07 03:40 PM', notes: [{ id: 'n3', author: 'Ronke Odusanya', date: '2026-09-07 04:00 PM', text: 'Requested a valid, unexpired document from customer.' }] },
  { id: 'doc-3', customerName: 'Grace Effiong', documentType: 'Certificate of Incorporation', issuingCountry: 'Nigeria', documentNumber: 'RC-1487321', outcome: 'VERIFIED', authenticityScore: 95, tamperIndicators: [], extractedFields: [{ label: 'Company Name', value: 'PayFlux Technologies Limited', matchesSubmitted: true }, { label: 'RC Number', value: 'RC-1487321', matchesSubmitted: true }], anomalies: [], provider: 'Youverify', checkedAt: '2026-09-06 11:20 AM', notes: [] },
  { id: 'doc-4', customerName: 'Fatima Bello', documentType: 'Utility Bill (Proof of Address)', issuingCountry: 'South Africa', documentNumber: 'N/A', outcome: 'REVIEW_REQUIRED', authenticityScore: 71, tamperIndicators: ['Address field shows slight pixel misalignment — inconclusive'], extractedFields: [{ label: 'Name', value: 'Fatima Bello', matchesSubmitted: true }, { label: 'Address', value: '14 Loop Street, Cape Town', matchesSubmitted: true }, { label: 'Bill Date', value: '2026-06-02', matchesSubmitted: true }], anomalies: ['Document older than 3-month freshness policy'], provider: 'VerifyMe', checkedAt: '2026-09-05 09:05 AM', notes: [] },
  { id: 'doc-5', customerName: 'Peter Okafor', documentType: 'Bank Statement', issuingCountry: 'Nigeria', documentNumber: 'N/A', outcome: 'REVIEW_REQUIRED', authenticityScore: 66, tamperIndicators: ['Inconsistent line spacing detected in transaction table'], extractedFields: [{ label: 'Account Name', value: 'Peter C. Okafor', matchesSubmitted: true }, { label: 'Bank', value: 'Nimbus Bank Plc', matchesSubmitted: true }], anomalies: ['Possible edited transaction rows — recommend requesting source statement from bank'], provider: 'Smile ID', checkedAt: '2026-09-08 01:15 PM', notes: [] }
];
