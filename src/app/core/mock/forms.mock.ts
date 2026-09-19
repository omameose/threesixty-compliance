import { ComplianceForm } from '../models/models';

export const MOCK_FORMS: ComplianceForm[] = [
  {
    id: 'form-001',
    name: 'Individual Customer KYC',
    type: 'KYC',
    status: 'live',
    sourceTemplateId: 'fin-fintech-kyc',
    createdAt: '2026-06-12',
    updatedAt: '2026-08-20',
    submissionsCount: 482,
    completedCount: 401,
    pendingReviewCount: 23,
    webhookEnabled: true,
    sections: [
      {
        id: 'sec-1', title: 'Personal Information', description: 'Basic identity details',
        questions: [
          { id: 'q1', type: 'short_text', label: 'Full Legal Name', required: true },
          { id: 'q2', type: 'email', label: 'Email Address', required: true },
          { id: 'q3', type: 'phone', label: 'Phone Number', required: true },
          { id: 'q4', type: 'date', label: 'Date of Birth', required: true },
          { id: 'q5', type: 'country', label: 'Nationality', required: true },
          { id: 'q6', type: 'address', label: 'Residential Address', required: true }
        ]
      },
      {
        id: 'sec-2', title: 'Identity Verification', description: 'Government ID and proof of identity',
        questions: [
          { id: 'q7', type: 'dropdown', label: 'ID Type', required: true, options: [{ id: 'o1', label: 'Passport' }, { id: 'o2', label: "Driver's License" }, { id: 'o3', label: 'National ID' }, { id: 'o4', label: 'Voter\'s Card' }] },
          { id: 'q8', type: 'short_text', label: 'ID Number', required: true },
          { id: 'q9', type: 'file_upload', label: 'Upload ID Document (Front)', required: true, acceptedFileTypes: '.jpg,.png,.pdf' },
          { id: 'q10', type: 'file_upload', label: 'Upload ID Document (Back)', required: false, acceptedFileTypes: '.jpg,.png,.pdf' },
          { id: 'q11', type: 'file_upload', label: 'Selfie / Liveness Photo', required: true, acceptedFileTypes: '.jpg,.png' }
        ]
      },
      {
        id: 'sec-3', title: 'Additional Information', description: 'Source of funds and declarations',
        questions: [
          { id: 'q12', type: 'dropdown', label: 'Source of Funds', required: true, options: [{ id: 'o1', label: 'Salary/Employment' }, { id: 'o2', label: 'Business Income' }, { id: 'o3', label: 'Investments' }, { id: 'o4', label: 'Inheritance' }] },
          { id: 'q13', type: 'radio', label: 'Are you a Politically Exposed Person (PEP)?', required: true, options: [{ id: 'o1', label: 'Yes' }, { id: 'o2', label: 'No' }] },
          { id: 'q14', type: 'checkbox', label: 'I confirm the information provided is accurate', required: true, options: [{ id: 'o1', label: 'I agree' }] }
        ]
      }
    ]
  },
  {
    id: 'form-002',
    name: 'Business / Merchant KYB',
    type: 'KYB',
    status: 'live',
    sourceTemplateId: 'fin-gw-kyb',
    createdAt: '2026-05-03',
    updatedAt: '2026-08-14',
    submissionsCount: 156,
    completedCount: 122,
    pendingReviewCount: 14,
    webhookEnabled: true,
    sections: [
      {
        id: 'sec-1', title: 'Business Information',
        questions: [
          { id: 'q1', type: 'short_text', label: 'Registered Business Name', required: true },
          { id: 'q2', type: 'short_text', label: 'RC / Registration Number', required: true },
          { id: 'q3', type: 'dropdown', label: 'Business Type', required: true, options: [{ id: 'o1', label: 'LLC' }, { id: 'o2', label: 'Sole Proprietorship' }, { id: 'o3', label: 'Partnership' }, { id: 'o4', label: 'Public Company' }] },
          { id: 'q4', type: 'address', label: 'Registered Business Address', required: true },
          { id: 'q5', type: 'short_text', label: 'Tax Identification Number', required: true }
        ]
      },
      {
        id: 'sec-2', title: 'Directors & Beneficial Owners',
        questions: [
          { id: 'q6', type: 'short_text', label: 'Director Full Name', required: true },
          { id: 'q7', type: 'id_document', label: 'Director ID Document', required: true },
          { id: 'q8', type: 'number', label: 'Percentage Ownership', required: true }
        ]
      },
      {
        id: 'sec-3', title: 'Business Documents',
        questions: [
          { id: 'q9', type: 'file_upload', label: 'Certificate of Incorporation', required: true, acceptedFileTypes: '.pdf' },
          { id: 'q10', type: 'file_upload', label: 'Memorandum & Articles of Association', required: true, acceptedFileTypes: '.pdf' },
          { id: 'q11', type: 'file_upload', label: 'Proof of Address (Utility Bill)', required: false, acceptedFileTypes: '.pdf,.jpg' }
        ]
      }
    ]
  },
  {
    id: 'form-003',
    name: 'Agent Network Onboarding',
    type: 'Combined',
    status: 'in_review',
    sourceTemplateId: 'fin-ptsp-agent',
    createdAt: '2026-08-01',
    updatedAt: '2026-09-02',
    submissionsCount: 0,
    completedCount: 0,
    pendingReviewCount: 0,
    webhookEnabled: false,
    sections: [
      {
        id: 'sec-1', title: 'Agent Details',
        questions: [
          { id: 'q1', type: 'short_text', label: 'Full Name', required: true },
          { id: 'q2', type: 'phone', label: 'Phone Number', required: true },
          { id: 'q3', type: 'address', label: 'Business Location', required: true }
        ]
      }
    ]
  },
  {
    id: 'form-004',
    name: 'Investor Enhanced Due Diligence',
    type: 'AML',
    status: 'paused',
    sourceTemplateId: 'fin-cm-edd',
    createdAt: '2026-04-19',
    updatedAt: '2026-07-30',
    submissionsCount: 64,
    completedCount: 58,
    pendingReviewCount: 3,
    webhookEnabled: true,
    sections: [
      {
        id: 'sec-1', title: 'Investor Profile',
        questions: [
          { id: 'q1', type: 'short_text', label: 'Full Name', required: true },
          { id: 'q2', type: 'number', label: 'Estimated Net Worth (USD)', required: true },
          { id: 'q3', type: 'radio', label: 'Is source of wealth verifiable?', required: true, options: [{ id: 'o1', label: 'Yes' }, { id: 'o2', label: 'No' }] }
        ]
      }
    ]
  },
  {
    id: 'form-005',
    name: 'Vendor Supplier KYB',
    type: 'KYB',
    status: 'archived',
    sourceTemplateId: 'ecom-retail-vendor',
    createdAt: '2026-01-11',
    updatedAt: '2026-03-05',
    submissionsCount: 38,
    completedCount: 38,
    pendingReviewCount: 0,
    webhookEnabled: false,
    sections: [
      {
        id: 'sec-1', title: 'Supplier Information',
        questions: [
          { id: 'q1', type: 'short_text', label: 'Company Name', required: true },
          { id: 'q2', type: 'file_upload', label: 'Business Registration Document', required: true }
        ]
      }
    ]
  },
  {
    id: 'form-006',
    name: 'Merchant Settlement Onboarding',
    type: 'KYB',
    status: 'draft',
    sourceTemplateId: 'fin-ptsp-merchant',
    createdAt: '2026-09-05',
    updatedAt: '2026-09-06',
    submissionsCount: 0,
    completedCount: 0,
    pendingReviewCount: 0,
    webhookEnabled: false,
    sections: [
      {
        id: 'sec-1', title: 'Settlement Details',
        questions: [
          { id: 'q1', type: 'short_text', label: 'Settlement Bank Account Name', required: true },
          { id: 'q2', type: 'short_text', label: 'Settlement Bank Account Number', required: true },
          { id: 'q3', type: 'file_upload', label: 'Bank Verification Letter', required: true }
        ]
      }
    ]
  }
];
