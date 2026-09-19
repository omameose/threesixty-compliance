import { CddCase, EddCase, MonitoringScheduleEntry } from '../models/models';

export const MOCK_CDD_CASES: CddCase[] = [
  {
    id: 'cdd-1', customerId: 'cust-1000', customerName: 'Tolulope Oke', customerType: 'Individual', status: 'in_progress',
    fields: [
      { label: 'Full Legal Name', required: true, completed: true, value: 'Tolulope Oke' },
      { label: 'Government ID', required: true, completed: true, value: 'National ID Card (NIN)' },
      { label: 'Occupation / Employer', required: true, completed: true, value: 'Software Engineer, PayFlux Technologies' },
      { label: 'Purpose of Account', required: true, completed: false },
      { label: 'Source of Funds', required: true, completed: false },
      { label: 'Proof of Address', required: true, completed: true, value: 'Utility bill uploaded' },
      { label: 'Expected Transaction Volume', required: false, completed: false }
    ],
    notes: []
  },
  {
    id: 'cdd-2', customerId: 'cust-1001', customerName: 'Temitope Oduwole', customerType: 'Business', status: 'pending_review',
    fields: [
      { label: 'Registered Business Name', required: true, completed: true, value: 'Temitope Oduwole Merchant Services Ltd' },
      { label: 'CAC Registration Number', required: true, completed: true, value: 'RC-2298104' },
      { label: 'Nature of Business', required: true, completed: true, value: 'Retail merchant / payment aggregation' },
      { label: 'Directors & Shareholders', required: true, completed: true, value: '2 directors on file' },
      { label: 'Source of Funds / Wealth', required: true, completed: true, value: 'Retail trading revenue' },
      { label: 'Expected Transaction Volume', required: true, completed: true, value: '₦15,000,000 / month' },
      { label: 'Beneficial Ownership Declaration', required: true, completed: true, value: 'Declared — no layered structure' }
    ],
    reviewedBy: undefined,
    notes: [{ id: 'n1', author: 'Ronke Odusanya', date: '2026-09-08 11:00 AM', text: 'All fields complete — queued for compliance review and sign-off.' }]
  },
  {
    id: 'cdd-3', customerId: 'cust-1014', customerName: 'Ronke Odusanya', customerType: 'Individual', status: 'completed',
    fields: [
      { label: 'Full Legal Name', required: true, completed: true, value: 'Ronke Odusanya' },
      { label: 'Government ID', required: true, completed: true, value: "Driver's License" },
      { label: 'Occupation / Employer', required: true, completed: true, value: 'Investment Analyst' },
      { label: 'Purpose of Account', required: true, completed: true, value: 'Investment / wealth management' },
      { label: 'Source of Funds', required: true, completed: true, value: 'Salary and investment returns' },
      { label: 'Proof of Address', required: true, completed: true, value: 'Bank statement uploaded' }
    ],
    reviewedBy: 'Rukayat Yaro', reviewedAt: '2026-08-06', notes: []
  }
];

export const MOCK_EDD_CASES: EddCase[] = [
  {
    id: 'edd-1', customerId: 'cust-1017', customerName: 'Grace Effiong', triggerReasons: ['Newly identified domestic PEP', 'High risk score (82/100)'],
    checklist: [
      { item: 'Enhanced identity verification', completed: true },
      { item: 'Source of wealth documentation', completed: true },
      { item: 'Source of funds documentation', completed: false },
      { item: 'Senior management approval', completed: false },
      { item: 'Enhanced ongoing monitoring flag set', completed: true }
    ],
    status: 'in_progress', assignedTo: 'Temitope Oduwole', openedAt: '2026-09-07 05:00 PM',
    sourceOfWealth: 'Public sector remuneration and declared business interests (under review).',
    notes: [{ id: 'n1', author: 'Temitope Oduwole', date: '2026-09-07 05:10 PM', text: 'Requested source-of-funds documentation and management sign-off given new PEP status.' }]
  },
  {
    id: 'edd-2', customerId: 'cust-1016', customerName: 'Ibrahim Musa', triggerReasons: ['Sanctions fuzzy match (94%)', 'Adverse media — trade-invoicing investigation'],
    checklist: [
      { item: 'Enhanced identity verification', completed: true },
      { item: 'Source of wealth documentation', completed: false },
      { item: 'Source of funds documentation', completed: false },
      { item: 'Senior management approval', completed: false },
      { item: 'Enhanced ongoing monitoring flag set', completed: true }
    ],
    status: 'blocked', assignedTo: 'Temitope Oduwole', openedAt: '2026-09-08 09:00 AM',
    notes: [{ id: 'n1', author: 'Temitope Oduwole', date: '2026-09-08 09:05 AM', text: 'Activation blocked pending STR/SAR decision and sanctions confirmation.' }]
  },
  {
    id: 'edd-3', customerId: 'cust-1030', customerName: 'Harvestly Agro Exports Limited', triggerReasons: ['Complex/offshore ownership structure', 'Nominee arrangement detected'],
    checklist: [
      { item: 'Beneficial ownership declaration', completed: true },
      { item: 'Offshore entity registry lookup', completed: true },
      { item: 'Source of funds documentation', completed: true },
      { item: 'Senior management approval', completed: true },
      { item: 'Enhanced ongoing monitoring flag set', completed: true }
    ],
    status: 'completed', assignedTo: 'Ronke Odusanya', openedAt: '2026-09-06 10:45 AM', completedAt: '2026-09-09 02:00 PM',
    sourceOfFunds: 'Agricultural export proceeds, reconciled against shipping and customs records.',
    notes: []
  }
];

export const MOCK_MONITORING_SCHEDULE: MonitoringScheduleEntry[] = [
  { id: 'mon-1', customerId: 'cust-1016', customerName: 'Ibrahim Musa', monitoringType: 'Sanctions', frequency: 'On list update', lastRunAt: '2026-09-08 12:00 AM', nextRunAt: '2026-09-09 12:00 AM', lastResult: 'change_detected', changeDetail: 'New fuzzy match against updated OFAC SDN list.', status: 'active' },
  { id: 'mon-2', customerId: 'cust-1017', customerName: 'Grace Effiong', monitoringType: 'PEP', frequency: 'Weekly', lastRunAt: '2026-09-07 06:00 AM', nextRunAt: '2026-09-14 06:00 AM', lastResult: 'change_detected', changeDetail: 'Customer newly identified as a domestic PEP.', status: 'active' },
  { id: 'mon-3', customerId: 'cust-1018', customerName: 'Samuel Etim', monitoringType: 'Sanctions', frequency: 'On list update', lastRunAt: '2026-09-08 12:00 AM', nextRunAt: '2026-09-09 12:00 AM', lastResult: 'no_change', status: 'active' },
  { id: 'mon-4', customerId: 'cust-1020', customerName: 'Fatima Bello', monitoringType: 'Adverse Media', frequency: 'Monthly', lastRunAt: '2026-08-15 06:00 AM', nextRunAt: '2026-09-15 06:00 AM', lastResult: 'no_change', status: 'active' },
  { id: 'mon-5', customerId: 'cust-1030', customerName: 'Harvestly Agro Exports Limited', monitoringType: 'Corporate Changes', frequency: 'Monthly', lastRunAt: '2026-09-01 06:00 AM', nextRunAt: '2026-10-01 06:00 AM', lastResult: 'no_change', status: 'active' },
  { id: 'mon-6', customerId: 'cust-1004', customerName: 'Rukayat Yaro', monitoringType: 'Risk Score', frequency: 'Daily', lastRunAt: '2026-09-09 12:00 AM', nextRunAt: '2026-09-10 12:00 AM', lastResult: 'no_change', status: 'paused' }
];
