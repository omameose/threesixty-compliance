import { Customer, CustomerStatus } from '../models/models';

const names = ['Tolulope Oke', 'Temitope Oduwole', 'Ronke Odusanya', 'Joseph Alabi', 'Rukayat Yaro', 'James Attah', 'Frank Alfonso', 'Oreoluwa Fayemi', 'Cassie Jung', 'Alice Wong', 'Theresa Webb', 'Christian Wong', 'Whitney Harlow', 'Orlando Bloom', 'Adam Joseph', 'Chidinma Okeke', 'Ibrahim Musa', 'Grace Effiong', 'Samuel Etim', 'Blessing Nwachukwu', 'Fatima Bello', 'Emeka Obi', 'Ngozi Umeh', 'David Kalu'];
const countries = ['Nigeria', 'Ghana', 'Kenya', 'South Africa', 'United Kingdom', 'United States', 'UAE'];
const statuses: CustomerStatus[] = ['not_started', 'in_progress', 'pending_review', 'more_info_required', 'approved', 'rejected'];
const forms = [
  { id: 'form-001', name: 'Individual Customer KYC' },
  { id: 'form-002', name: 'Business / Merchant KYB' },
  { id: 'form-004', name: 'Investor Enhanced Due Diligence' }
];

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
const rand = seedRandom(42);

function progressForStatus(status: CustomerStatus): number {
  switch (status) {
    case 'not_started': return 0;
    case 'in_progress': return Math.floor(rand() * 60) + 20;
    case 'pending_review': return 100;
    case 'more_info_required': return 85;
    case 'approved': return 100;
    case 'rejected': return 100;
  }
}

function riskFor(i: number): { score: number; level: 'low' | 'medium' | 'high' } {
  const score = Math.floor(rand() * 100);
  const level = score < 40 ? 'low' : score < 75 ? 'medium' : 'high';
  return { score, level };
}

export const MOCK_CUSTOMERS: Customer[] = names.map((name, i) => {
  const status = statuses[i % statuses.length];
  const form = forms[i % forms.length];
  const risk = riskFor(i);
  const day = 3 + (i % 25);
  return {
    id: 'cust-' + (1000 + i),
    complianceId: 'CMP-' + (58000 + i * 7),
    fullName: name,
    email: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com',
    phone: '0801234' + (1000 + i).toString().slice(-4),
    avatarUrl: '',
    formId: form.id,
    formName: form.name,
    status,
    riskScore: risk.score,
    riskLevel: risk.level,
    startedAt: `2026-08-${day.toString().padStart(2, '0')}`,
    completedAt: status === 'approved' || status === 'rejected' ? `2026-08-${(day + 1).toString().padStart(2, '0')}` : undefined,
    progress: progressForStatus(status),
    country: countries[i % countries.length],
    sanctionsHit: risk.level === 'high' && i % 3 === 0,
    pepHit: risk.level !== 'low' && i % 5 === 0,
    answers: [
      { questionId: 'q1', label: 'Full Legal Name', type: 'short_text', value: name },
      { questionId: 'q2', label: 'Email Address', type: 'email', value: name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com' },
      { questionId: 'q3', label: 'Phone Number', type: 'phone', value: '0801234' + (1000 + i).toString().slice(-4) },
      { questionId: 'q4', label: 'Date of Birth', type: 'date', value: `19${80 + (i % 15)}-0${(i % 9) + 1}-1${i % 9}` },
      { questionId: 'q5', label: 'Nationality', type: 'country', value: countries[i % countries.length] },
      { questionId: 'q7', label: 'ID Type', type: 'dropdown', value: ['Passport', "Driver's License", 'National ID'][i % 3] },
      { questionId: 'q8', label: 'ID Number', type: 'short_text', value: 'A' + (10000000 + i * 91) },
      { questionId: 'q9', label: 'Upload ID Document (Front)', type: 'file_upload', value: 'uploaded', fileName: 'id-front-' + (i + 1) + '.jpg', fileSize: (200 + i * 3) + ' KB' },
      { questionId: 'q11', label: 'Selfie / Liveness Photo', type: 'file_upload', value: 'uploaded', fileName: 'selfie-' + (i + 1) + '.jpg', fileSize: (150 + i * 2) + ' KB' },
      { questionId: 'q12', label: 'Source of Funds', type: 'dropdown', value: ['Salary/Employment', 'Business Income', 'Investments'][i % 3] },
      { questionId: 'q13', label: 'Are you a Politically Exposed Person (PEP)?', type: 'radio', value: i % 5 === 0 ? 'Yes' : 'No' }
    ],
    timeline: [
      { label: 'Link generated', date: `2026-08-${day.toString().padStart(2, '0')} 09:12 AM` },
      { label: 'Verification started', date: `2026-08-${day.toString().padStart(2, '0')} 09:20 AM` },
      ...(status !== 'not_started' && status !== 'in_progress' ? [{ label: 'Submitted for review', date: `2026-08-${day.toString().padStart(2, '0')} 09:48 AM` }] : []),
      ...(status === 'more_info_required' ? [{ label: 'More information requested', date: `2026-08-${(day + 1).toString().padStart(2, '0')} 11:00 AM`, note: 'ID document image was unclear, please re-upload.' }] : []),
      ...(status === 'approved' ? [{ label: 'Approved by compliance team', date: `2026-08-${(day + 1).toString().padStart(2, '0')} 02:15 PM` }] : []),
      ...(status === 'rejected' ? [{ label: 'Rejected by compliance team', date: `2026-08-${(day + 1).toString().padStart(2, '0')} 02:15 PM`, note: 'Document does not match provided name.' }] : [])
    ]
  };
});
