import { ApiKeyPair, AppUser, CompanyProfile, DashboardStats, Invoice, Plan, ScreeningResult, Subscription, TeamMember, TeamRoleInfo, WebhookConfig, WebhookLog } from '../models/models';

export const MOCK_COMPANY: CompanyProfile = {
  id: 'org-360-01',
  name: 'PayFlux Technologies',
  legalName: 'PayFlux Technologies Limited',
  logoUrl: '',
  brandColor: '#128a4d',
  website: 'https://payflux.com',
  supportEmail: 'support@payflux.com',
  address: '14 Adeola Odeku Street, Victoria Island, Lagos, Nigeria',
  industry: 'Payment Gateway',
  country: 'Nigeria',
  verified: true,
  createdAt: '2026-04-02'
};

export const MOCK_USER: AppUser = {
  id: 'user-01',
  firstName: 'Rukayat',
  lastName: 'Yaro',
  email: 'rukayat.yaro@payflux.com',
  phone: '0701 234 5678',
  avatarUrl: '',
  role: 7,
  twoFactorEnabled: true,
  companyId: 'org-360-01',
  lastLoginAt: '2026-09-08 08:42 AM'
};

export const TEAM_ROLES: TeamRoleInfo[] = [
  { level: 1, name: 'Viewer', description: 'Read-only access to dashboards and reports.' },
  { level: 2, name: 'Support Agent', description: 'Can view customer submissions and respond to queries.' },
  { level: 3, name: 'Reviewer', description: 'Can review and request more information on submissions.' },
  { level: 4, name: 'Compliance Officer', description: 'Can approve/reject KYC/KYB and manage templates.' },
  { level: 5, name: 'Form Builder', description: 'Can create and publish compliance forms.' },
  { level: 6, name: 'Admin', description: 'Full access except billing and team super-admin actions.' },
  { level: 7, name: 'Super Admin', description: 'Unrestricted access including billing, API keys and team management.' }
];

export const MOCK_TEAM: TeamMember[] = [
  { id: 'tm-1', name: 'Rukayat Yaro', email: 'rukayat.yaro@payflux.com', avatarUrl: '', role: 7, status: 'active', invitedAt: '2026-04-02', lastActive: '2 mins ago' },
  { id: 'tm-2', name: 'Tolulope Oke', email: 'tolulope.oke@payflux.com', avatarUrl: '', role: 6, status: 'active', invitedAt: '2026-04-10', lastActive: '1 hour ago' },
  { id: 'tm-3', name: 'Temitope Oduwole', email: 'temitope.o@payflux.com', avatarUrl: '', role: 4, status: 'active', invitedAt: '2026-05-01', lastActive: '3 hours ago' },
  { id: 'tm-4', name: 'Ronke Odusanya', email: 'ronke.o@payflux.com', avatarUrl: '', role: 3, status: 'active', invitedAt: '2026-05-14', lastActive: '1 day ago' },
  { id: 'tm-5', name: 'Joseph Alabi', email: 'joseph.alabi@payflux.com', avatarUrl: '', role: 2, status: 'invited', invitedAt: '2026-08-30', lastActive: '—' },
  { id: 'tm-6', name: 'James Attah', email: 'james.attah@payflux.com', avatarUrl: '', role: 1, status: 'active', invitedAt: '2026-06-20', lastActive: '5 days ago' }
];

export const PLANS: Plan[] = [
  { id: 'free', name: 'Free', price: 0, billingCycle: 'month', description: 'Get started with basic verification tools.', verificationsIncluded: 25, overagePrice: 0, features: ['25 verifications / month', '1 compliance form', 'Email support', 'Basic dashboard analytics'] },
  { id: 'basic', name: 'Basic', price: 49, billingCycle: 'month', description: 'For small teams starting to scale verification.', verificationsIncluded: 500, overagePrice: 0.35, features: ['500 verifications / month', '5 compliance forms', 'Sanctions & PEP screening', 'Webhook notifications', 'Email + chat support'] },
  { id: 'standard', name: 'Standard', price: 199, billingCycle: 'month', description: 'For growing businesses with regular compliance needs.', verificationsIncluded: 2500, overagePrice: 0.25, features: ['2,500 verifications / month', 'Unlimited compliance forms', 'AML + Ongoing monitoring', 'API + webhook access', 'Priority support', 'Team roles (up to 10 seats)'], highlighted: true },
  { id: 'enterprise', name: 'Enterprise', price: 0, billingCycle: 'month', description: 'Custom volume, SLAs and dedicated infrastructure.', verificationsIncluded: -1, overagePrice: 0, features: ['Unlimited verifications', 'Dedicated account manager', 'Custom SLAs & compliance workflows', 'Single Sign-On (SSO)', 'Unlimited team seats', 'Custom integrations'] }
];

export const MOCK_SUBSCRIPTION: Subscription = {
  planId: 'standard',
  status: 'active',
  renewsAt: '2026-10-08',
  seats: 6,
  usage: { used: 1840, included: 2500 }
};

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2026-0812', date: '2026-08-08', amount: 199, status: 'paid', plan: 'Standard (Monthly)', invoiceUrl: '#' },
  { id: 'INV-2026-0712', date: '2026-07-08', amount: 199, status: 'paid', plan: 'Standard (Monthly)', invoiceUrl: '#' },
  { id: 'INV-2026-0612', date: '2026-06-08', amount: 199, status: 'paid', plan: 'Standard (Monthly)', invoiceUrl: '#' },
  { id: 'INV-2026-0512', date: '2026-05-08', amount: 49, status: 'paid', plan: 'Basic (Monthly)', invoiceUrl: '#' },
  { id: 'INV-2026-0412', date: '2026-04-08', amount: 0, status: 'paid', plan: 'Free', invoiceUrl: '#' }
];

export const MOCK_API_KEYS: ApiKeyPair[] = [
  { id: 'key-test', environment: 'test', publicKey: 'pk_test_51N8x2FKq7bZ3aWx9UjLm', secretKeyMasked: 'sk_test_••••••••••••kP2q', createdAt: '2026-04-05', lastUsed: '2 hours ago' },
  { id: 'key-live', environment: 'live', publicKey: 'pk_live_9aQmZ3xR8tY6bLp1WvNc', secretKeyMasked: 'sk_live_••••••••••••7hT4', createdAt: '2026-04-05', lastUsed: '18 mins ago' }
];

export const MOCK_WEBHOOK_CONFIG: WebhookConfig = {
  url: 'https://api.payflux.com/webhooks/360compliance',
  signingSecret: 'whsec_8f2A9dK3mZ7pQ1xC6vR4tB0nL5jH2sE',
  encryptionKey: 'enc_4tY8nB2pL9xQ6mR1vD3cA7sZ0jK5hW2',
  events: ['kyc.completed', 'kyb.completed', 'submission.approved', 'submission.rejected', 'submission.more_info_required'],
  enabled: true
};

export const MOCK_WEBHOOK_LOGS: WebhookLog[] = [
  { id: 'wh-1', event: 'kyc.completed', status: 'success', statusCode: 200, timestamp: '2026-09-08 08:12 AM', url: 'https://api.payflux.com/webhooks/360compliance' },
  { id: 'wh-2', event: 'submission.approved', status: 'success', statusCode: 200, timestamp: '2026-09-08 07:45 AM', url: 'https://api.payflux.com/webhooks/360compliance' },
  { id: 'wh-3', event: 'submission.more_info_required', status: 'failed', statusCode: 503, timestamp: '2026-09-07 04:30 PM', url: 'https://api.payflux.com/webhooks/360compliance' },
  { id: 'wh-4', event: 'kyb.completed', status: 'success', statusCode: 200, timestamp: '2026-09-07 11:02 AM', url: 'https://api.payflux.com/webhooks/360compliance' },
  { id: 'wh-5', event: 'submission.rejected', status: 'pending', statusCode: 0, timestamp: '2026-09-07 09:15 AM', url: 'https://api.payflux.com/webhooks/360compliance' }
];

export const DASHBOARD_STATS: DashboardStats = {
  totalCustomers: 740,
  totalCustomersDelta: 12.4,
  approvedRate: 82.3,
  approvedRateDelta: 3.1,
  pendingReview: 40,
  pendingReviewDelta: -5.2,
  avgVerificationTime: '6m 42s',
  avgVerificationTimeDelta: -8.7,
  monthlyVerifications: [
    { month: 'Mar', kyc: 62, kyb: 18, aml: 10 },
    { month: 'Apr', kyc: 74, kyb: 22, aml: 14 },
    { month: 'May', kyc: 90, kyb: 28, aml: 16 },
    { month: 'Jun', kyc: 110, kyb: 34, aml: 20 },
    { month: 'Jul', kyc: 128, kyb: 40, aml: 24 },
    { month: 'Aug', kyc: 145, kyb: 46, aml: 28 }
  ],
  statusBreakdown: [
    { status: 'Approved', value: 609, color: '#1fae62' },
    { status: 'Pending Review', value: 40, color: '#f59e0b' },
    { status: 'More Info Required', value: 31, color: '#3b82f6' },
    { status: 'Rejected', value: 60, color: '#ef4444' }
  ],
  riskBreakdown: [
    { level: 'Low Risk', value: 520, color: '#1fae62' },
    { level: 'Medium Risk', value: 168, color: '#f59e0b' },
    { level: 'High Risk', value: 52, color: '#ef4444' }
  ],
  recentActivity: [
    { id: 'a1', text: 'Tolulope Oke completed Individual Customer KYC', time: '5 mins ago', icon: 'check' },
    { id: 'a2', text: 'New submission flagged for high risk — Ibrahim Musa', time: '22 mins ago', icon: 'alert' },
    { id: 'a3', text: 'Webhook delivered successfully to api.payflux.com', time: '1 hour ago', icon: 'webhook' },
    { id: 'a4', text: 'Business / Merchant KYB form published', time: '3 hours ago', icon: 'form' },
    { id: 'a5', text: 'James Attah invited to team as Viewer', time: 'Yesterday', icon: 'user' },
    { id: 'a6', text: 'Grace Effiong requires more information', time: 'Yesterday', icon: 'info' }
  ]
};

export const MOCK_SCREENING_RESULTS: ScreeningResult[] = [
  { id: 'sc-1', name: 'Ibrahim Musa', type: 'Sanctions', match: true, matchScore: 91, list: 'OFAC SDN List', country: 'Nigeria', checkedAt: '2026-09-08 08:10 AM' },
  { id: 'sc-2', name: 'Grace Effiong', type: 'PEP', match: true, matchScore: 78, list: 'Global PEP Database', country: 'Nigeria', checkedAt: '2026-09-07 04:22 PM' },
  { id: 'sc-3', name: 'Samuel Etim', type: 'Sanctions', match: false, matchScore: 4, list: 'UN Consolidated List', country: 'Ghana', checkedAt: '2026-09-07 02:00 PM' },
  { id: 'sc-4', name: 'Fatima Bello', type: 'Adverse Media', match: false, matchScore: 12, list: 'Global News Index', country: 'Nigeria', checkedAt: '2026-09-06 11:45 AM' },
  { id: 'sc-5', name: 'Emeka Obi', type: 'PEP', match: false, matchScore: 8, list: 'Global PEP Database', country: 'Nigeria', checkedAt: '2026-09-06 09:30 AM' }
];
