import { Sector } from '../models/models';

function t(id: string, name: string, type: 'KYC' | 'KYB' | 'AML' | 'Combined', fields: number, popular = false): any {
  return {
    id, name, type,
    description: `Ready-to-use ${type} template covering identity, ${type === 'KYB' ? 'business' : 'personal'} data and risk checks for ${name.toLowerCase()}.`,
    fieldsCount: fields,
    popular,
    updatedAt: '2026-08-2' + (Math.floor(Math.random() * 8) + 1)
  };
}

export const SECTORS: Sector[] = [
  {
    id: 'finance',
    name: 'Finance & Banking',
    icon: 'bank',
    description: 'Templates for banks, fintechs, payment providers and financial infrastructure.',
    industries: [
      {
        id: 'banks',
        name: 'Commercial Banks',
        description: 'Full KYC/KYB suite for retail and corporate banking onboarding.',
        templates: [t('fin-bank-kyc', 'Bank Customer KYC', 'KYC', 24, true), t('fin-bank-kyb', 'Bank Corporate KYB', 'KYB', 32), t('fin-bank-aml', 'Bank AML Screening', 'AML', 12)]
      },
      {
        id: 'fintechs',
        name: 'Fintechs',
        description: 'Lightweight onboarding flows for digital-first financial products.',
        templates: [t('fin-fintech-kyc', 'Fintech Individual KYC', 'KYC', 18, true), t('fin-fintech-kyb', 'Fintech Business KYB', 'KYB', 26)]
      },
      {
        id: 'ptsp',
        name: 'Payment Terminal Service Providers (PTSP)',
        description: 'Merchant and agent verification for PTSP licensing.',
        templates: [t('fin-ptsp-kyb', 'PTSP Merchant KYB', 'KYB', 28), t('fin-ptsp-agent', 'PTSP Agent KYC', 'KYC', 16)]
      },
      {
        id: 'payment-gateways',
        name: 'Payment Gateways',
        description: 'Merchant risk profiling and business verification for gateways.',
        templates: [t('fin-gw-kyb', 'Payment Gateway Merchant KYB', 'KYB', 30, true), t('fin-gw-aml', 'Gateway Transaction AML', 'AML', 14)]
      },
      {
        id: 'switch',
        name: 'Switching Companies',
        description: 'Institutional due diligence for switch/interchange operators.',
        templates: [t('fin-switch-kyb', 'Switch Operator KYB', 'KYB', 34)]
      },
      {
        id: 'microfinance',
        name: 'Microfinance Banks',
        description: 'Simplified onboarding for micro-lending customers and agents.',
        templates: [t('fin-mfb-kyc', 'MFB Customer KYC', 'KYC', 20), t('fin-mfb-kyb', 'MFB Agent Network KYB', 'KYB', 22)]
      },
      {
        id: 'insurance',
        name: 'Insurance',
        description: 'Policyholder identity verification and claims due diligence.',
        templates: [t('fin-ins-kyc', 'Policyholder KYC', 'KYC', 19), t('fin-ins-claim', 'Claims Due Diligence', 'Combined', 15)]
      },
      {
        id: 'capital-markets',
        name: 'Capital Markets / Stockbroking',
        description: 'Investor onboarding with enhanced due diligence.',
        templates: [t('fin-cm-kyc', 'Investor KYC', 'KYC', 27, true), t('fin-cm-edd', 'Enhanced Due Diligence', 'Combined', 21)]
      },
      {
        id: 'crypto',
        name: 'Crypto & Digital Assets',
        description: 'VASP-compliant onboarding with travel-rule ready fields.',
        templates: [t('fin-crypto-kyc', 'Crypto Exchange KYC', 'KYC', 25, true), t('fin-crypto-kyb', 'VASP Business KYB', 'KYB', 29)]
      }
    ]
  },
  {
    id: 'education',
    name: 'Education',
    icon: 'academic-cap',
    description: 'Verification for schools, edtech platforms and student loan providers.',
    industries: [
      {
        id: 'higher-ed',
        name: 'Universities & Colleges',
        description: 'Staff and vendor onboarding compliance for institutions.',
        templates: [t('edu-uni-staff', 'Staff Background KYC', 'KYC', 17), t('edu-uni-vendor', 'Vendor KYB', 'KYB', 20)]
      },
      {
        id: 'edtech',
        name: 'EdTech Platforms',
        description: 'Learner and instructor identity verification.',
        templates: [t('edu-edtech-learner', 'Learner KYC', 'KYC', 12, true), t('edu-edtech-instructor', 'Instructor KYC', 'KYC', 14)]
      },
      {
        id: 'student-loans',
        name: 'Student Loan Providers',
        description: 'Applicant and guarantor verification for education finance.',
        templates: [t('edu-loan-kyc', 'Loan Applicant KYC', 'KYC', 22, true), t('edu-loan-guarantor', 'Guarantor Verification', 'KYC', 16)]
      }
    ]
  },
  {
    id: 'health',
    name: 'Health',
    icon: 'heart',
    description: 'Compliance for hospitals, telehealth, pharmacies and insurers.',
    industries: [
      {
        id: 'hospitals',
        name: 'Hospitals & Clinics',
        description: 'Practitioner licensing checks and patient identity verification.',
        templates: [t('health-hosp-practitioner', 'Practitioner License KYC', 'KYC', 18, true), t('health-hosp-patient', 'Patient Identity Verification', 'KYC', 10)]
      },
      {
        id: 'telehealth',
        name: 'Telehealth Platforms',
        description: 'Remote identity and provider credential verification.',
        templates: [t('health-tele-patient', 'Telehealth Patient KYC', 'KYC', 13), t('health-tele-provider', 'Provider Credential Check', 'Combined', 19)]
      },
      {
        id: 'pharma',
        name: 'Pharmacies & Pharma Distribution',
        description: 'Distributor and pharmacy business verification.',
        templates: [t('health-pharma-kyb', 'Pharmacy Business KYB', 'KYB', 24), t('health-pharma-dist', 'Distributor KYB', 'KYB', 26)]
      },
      {
        id: 'health-insurance',
        name: 'Health Insurance / HMOs',
        description: 'Enrollee onboarding and provider network verification.',
        templates: [t('health-hmo-enrollee', 'Enrollee KYC', 'KYC', 15, true), t('health-hmo-provider', 'Provider Network KYB', 'KYB', 23)]
      }
    ]
  },
  {
    id: 'hr',
    name: 'HR & Recruitment',
    icon: 'users',
    description: 'Employee background checks and staffing agency compliance.',
    industries: [
      {
        id: 'staffing',
        name: 'Staffing Agencies',
        description: 'Candidate and client business verification for agencies.',
        templates: [t('hr-staffing-candidate', 'Candidate Background KYC', 'KYC', 16, true), t('hr-staffing-client', 'Client Business KYB', 'KYB', 18)]
      },
      {
        id: 'corporate-hr',
        name: 'Corporate HR Departments',
        description: 'New hire verification and contractor onboarding.',
        templates: [t('hr-corp-hire', 'New Hire Verification', 'KYC', 14), t('hr-corp-contractor', 'Contractor KYC', 'KYC', 12)]
      },
      {
        id: 'gig-platforms',
        name: 'Gig / Freelance Platforms',
        description: 'Fast identity checks for gig workers and freelancers.',
        templates: [t('hr-gig-worker', 'Gig Worker KYC', 'KYC', 11, true)]
      }
    ]
  },
  {
    id: 'agric',
    name: 'Agriculture',
    icon: 'sprout',
    description: 'Verification for agribusiness cooperatives, exporters and agtech.',
    industries: [
      {
        id: 'cooperatives',
        name: 'Farmer Cooperatives',
        description: 'Member and cooperative business verification.',
        templates: [t('agric-coop-member', 'Cooperative Member KYC', 'KYC', 13), t('agric-coop-kyb', 'Cooperative KYB', 'KYB', 19)]
      },
      {
        id: 'agtech',
        name: 'AgTech Platforms',
        description: 'Farmer onboarding for input finance and marketplace platforms.',
        templates: [t('agric-agtech-farmer', 'Farmer KYC', 'KYC', 15, true), t('agric-agtech-vendor', 'Input Vendor KYB', 'KYB', 17)]
      },
      {
        id: 'exporters',
        name: 'Agro Exporters & Traders',
        description: 'Trade compliance and business verification for exporters.',
        templates: [t('agric-export-kyb', 'Exporter Business KYB', 'KYB', 25, true), t('agric-export-aml', 'Trade AML Screening', 'AML', 14)]
      }
    ]
  },
  {
    id: 'real-estate',
    name: 'Real Estate',
    icon: 'building',
    description: 'Property buyers, agents and real estate investment platforms.',
    industries: [
      {
        id: 'agencies',
        name: 'Real Estate Agencies',
        description: 'Buyer/seller identity verification and source-of-funds checks.',
        templates: [t('re-agency-buyer', 'Buyer KYC + Source of Funds', 'Combined', 22, true), t('re-agency-agent', 'Agent Verification', 'KYC', 12)]
      },
      {
        id: 'proptech',
        name: 'PropTech / Real Estate Investment',
        description: 'Investor onboarding for fractional real estate platforms.',
        templates: [t('re-proptech-investor', 'Investor KYC', 'KYC', 20)]
      }
    ]
  },
  {
    id: 'logistics',
    name: 'Logistics & Transportation',
    icon: 'truck',
    description: 'Driver, fleet and freight partner verification.',
    industries: [
      {
        id: 'ride-hailing',
        name: 'Ride-hailing & Delivery',
        description: 'Driver background checks and vehicle documentation.',
        templates: [t('log-ride-driver', 'Driver KYC', 'KYC', 16, true), t('log-ride-vehicle', 'Vehicle Document Verification', 'Combined', 9)]
      },
      {
        id: 'freight',
        name: 'Freight & Haulage',
        description: 'Carrier business verification and AML screening.',
        templates: [t('log-freight-kyb', 'Carrier KYB', 'KYB', 21), t('log-freight-aml', 'Freight AML Check', 'AML', 11)]
      }
    ]
  },
  {
    id: 'ecommerce',
    name: 'E-commerce & Retail',
    icon: 'shopping-bag',
    description: 'Marketplace seller and buyer verification.',
    industries: [
      {
        id: 'marketplaces',
        name: 'Online Marketplaces',
        description: 'Seller KYB and buyer KYC for marketplace trust & safety.',
        templates: [t('ecom-mkt-seller', 'Marketplace Seller KYB', 'KYB', 23, true), t('ecom-mkt-buyer', 'Buyer KYC', 'KYC', 10)]
      },
      {
        id: 'retail-chains',
        name: 'Retail Chains',
        description: 'Vendor and supplier due diligence for large retailers.',
        templates: [t('ecom-retail-vendor', 'Supplier KYB', 'KYB', 20)]
      }
    ]
  }
];

export function findSector(id: string) {
  return SECTORS.find(s => s.id === id);
}
export function findIndustry(sectorId: string, industryId: string) {
  return findSector(sectorId)?.industries.find(i => i.id === industryId);
}
export function findTemplate(templateId: string) {
  for (const s of SECTORS) {
    for (const i of s.industries) {
      const tpl = i.templates.find(x => x.id === templateId);
      if (tpl) return { template: tpl, sector: s, industry: i };
    }
  }
  return undefined;
}
