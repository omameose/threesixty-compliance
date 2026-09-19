import { AdverseMediaCase, KybCompany, PepCase, SanctionsCase } from '../models/models';

export const MOCK_SANCTIONS_CASES: SanctionsCase[] = [
  {
    id: 'sx-1', subjectName: 'Ibrahim Musa', subjectType: 'Individual', dob: '1978-11-02', nationality: 'Nigerian', country: 'Nigeria',
    identifiers: ['BVN-22104487399', 'Passport A09213487'], verdict: 'MATCH', matchScore: 94,
    matchedList: 'OFAC SDN List', matchedListVersion: 'v2026.09.01', matchedEntityName: 'Ibrahim A. Moussa',
    matchedAliases: ['Ibrahim Al-Moussa', 'I.A. Musa'], matchedCountry: 'Nigeria',
    evidenceSummary: 'Name and date-of-birth proximity match (94%) against an SDN entry linked to a designated trade-based money-laundering network.',
    screenedAt: '2026-09-08 08:10 AM', reviewStatus: 'escalated', reviewedBy: 'Temitope Oduwole', reviewedAt: '2026-09-08 09:00 AM',
    notes: [{ id: 'n1', author: 'Temitope Oduwole', date: '2026-09-08 09:00 AM', text: 'High-confidence match on name and DOB. Escalating to case management for STR/SAR consideration.' }]
  },
  {
    id: 'sx-2', subjectName: 'Grace Effiong', subjectType: 'Individual', dob: '1985-06-21', nationality: 'Nigerian', country: 'Nigeria',
    identifiers: ['BVN-22104487321'], verdict: 'POTENTIAL_MATCH', matchScore: 58,
    matchedList: 'UN Consolidated List', matchedListVersion: 'v2026.08.28', matchedEntityName: 'Grace E. Effiong-Bassey',
    matchedAliases: ['G. Effiong'], matchedCountry: 'Nigeria',
    evidenceSummary: 'Partial surname match only; first name and DOB do not align closely with the listed entry.',
    screenedAt: '2026-09-07 04:22 PM', reviewStatus: 'pending', notes: []
  },
  {
    id: 'sx-3', subjectName: 'Samuel Etim', subjectType: 'Individual', dob: '1992-01-30', nationality: 'Ghanaian', country: 'Ghana',
    identifiers: ['GHA-901224871-3'], verdict: 'CLEAR', matchScore: 4,
    matchedList: 'UN Consolidated List', matchedListVersion: 'v2026.08.28',
    screenedAt: '2026-09-07 02:00 PM', reviewStatus: 'pending', notes: []
  },
  {
    id: 'sx-4', subjectName: 'Harvestly Agro Exports Limited', subjectType: 'Business', nationality: 'Nigerian', country: 'Nigeria',
    identifiers: ['RC-2210934'], verdict: 'POTENTIAL_MATCH', matchScore: 66,
    matchedList: 'EU Consolidated Sanctions List', matchedListVersion: 'v2026.09.02', matchedEntityName: 'Harvest Agro Trading Co.',
    matchedAliases: ['Harvest Agro Ltd'], matchedCountry: 'Nigeria',
    evidenceSummary: 'Fuzzy business-name match (66%) — trading name overlap but different registration number and directors.',
    screenedAt: '2026-09-06 09:45 AM', reviewStatus: 'false_positive', reviewedBy: 'Ronke Odusanya', reviewedAt: '2026-09-06 10:30 AM',
    notes: [{ id: 'n2', author: 'Ronke Odusanya', date: '2026-09-06 10:30 AM', text: 'Confirmed different entity — registration numbers and director lists do not overlap. Dismissed as false positive.' }]
  },
  {
    id: 'sx-5', subjectName: 'Fatima Bello', subjectType: 'Individual', dob: '1990-09-18', nationality: 'South African', country: 'South Africa',
    identifiers: ['ZA-9009185800086'], verdict: 'CLEAR', matchScore: 12,
    matchedList: 'UK HMT Sanctions List', matchedListVersion: 'v2026.09.01',
    screenedAt: '2026-09-06 11:45 AM', reviewStatus: 'pending', notes: []
  }
];

export const MOCK_PEP_CASES: PepCase[] = [
  {
    id: 'pep-1', subjectName: 'Grace Effiong', verdict: 'PEP_MATCH', confidenceScore: 88, position: 'Special Adviser, Ministry of Trade',
    country: 'Nigeria', category: 'Domestic PEP', relationship: 'Self', source: 'Global PEP Database', dataSourceVersion: 'v2026.09.01',
    screenedAt: '2026-09-07 04:22 PM', reviewStatus: 'confirmed_match', reviewedBy: 'Temitope Oduwole', reviewedAt: '2026-09-07 05:00 PM',
    eddRequested: true, notes: [{ id: 'n1', author: 'Temitope Oduwole', date: '2026-09-07 05:00 PM', text: 'Confirmed newly-appointed domestic PEP. EDD checklist opened automatically.' }]
  },
  {
    id: 'pep-2', subjectName: 'Emeka Obi', verdict: 'POTENTIAL_PEP', confidenceScore: 54, position: 'Local Government Councillor (former)',
    country: 'Nigeria', category: 'Domestic PEP', relationship: 'Family Member', relatedPepName: 'Chuka Obi (brother)',
    source: 'Global PEP Database', dataSourceVersion: 'v2026.09.01', screenedAt: '2026-09-06 09:30 AM', reviewStatus: 'pending', eddRequested: false, notes: []
  },
  {
    id: 'pep-3', subjectName: 'Ibrahim Musa', verdict: 'CLEAR', confidenceScore: 6, source: 'Global PEP Database', dataSourceVersion: 'v2026.09.01',
    screenedAt: '2026-09-08 08:10 AM', reviewStatus: 'pending', eddRequested: false, notes: []
  },
  {
    id: 'pep-4', subjectName: 'Chidinma Nwosu', verdict: 'POTENTIAL_PEP', confidenceScore: 41, position: 'Aide to State Commissioner',
    country: 'Nigeria', category: 'Domestic PEP', relationship: 'Close Associate', relatedPepName: 'Hon. Uzoma Nwosu',
    source: 'Nigeria PEP Intelligence Feed', dataSourceVersion: 'v2026.08.20', screenedAt: '2026-09-05 03:10 PM', reviewStatus: 'false_positive',
    reviewedBy: 'Ronke Odusanya', reviewedAt: '2026-09-05 04:00 PM', eddRequested: false,
    notes: [{ id: 'n2', author: 'Ronke Odusanya', date: '2026-09-05 04:00 PM', text: 'Shared surname coincidence only — no verified familial or associate relationship found.' }]
  }
];

export const MOCK_ADVERSE_MEDIA_CASES: AdverseMediaCase[] = [
  {
    id: 'am-1', subjectName: 'Ibrahim Musa', verdict: 'POTENTIAL_RISK', riskScore: 76, screenedAt: '2026-09-08 08:12 AM', reviewStatus: 'escalated',
    reviewedBy: 'Temitope Oduwole', reviewedAt: '2026-09-08 09:05 AM',
    articles: [
      { headline: 'Lagos businessman named in trade-invoicing probe', url: 'https://example-news.ng/trade-invoicing-probe', source: 'The Nation Nigeria', sourceCredibility: 'high', publishedDate: '2026-07-14', themes: ['Trade-Based Money Laundering', 'Customs Fraud'], stage: 'Investigation', confidence: 81, excerpt: 'Anti-graft agencies are investigating a Lagos-based trading firm over allegations of invoice manipulation used to move funds offshore...' },
      { headline: 'EFCC questions company director over forex round-tripping allegations', url: 'https://example-news.ng/efcc-forex-roundtrip', source: 'Premium Times', sourceCredibility: 'high', publishedDate: '2026-05-02', themes: ['Money Laundering', 'Forex Fraud'], stage: 'Allegation', confidence: 68, excerpt: 'The Economic and Financial Crimes Commission has invited a company director for questioning regarding suspected forex round-tripping...' }
    ],
    notes: [{ id: 'n1', author: 'Temitope Oduwole', date: '2026-09-08 09:05 AM', text: 'Two independent high-credibility sources corroborate ongoing investigation. Escalating alongside sanctions match.' }]
  },
  {
    id: 'am-2', subjectName: 'Harvestly Agro Exports Limited', verdict: 'POTENTIAL_RISK', riskScore: 52, screenedAt: '2026-09-06 09:50 AM', reviewStatus: 'pending',
    articles: [
      { headline: 'Agro-export firm flagged for SCUML compliance gap in industry report', url: 'https://example-news.ng/scuml-compliance-gap', source: 'BusinessDay', sourceCredibility: 'medium', publishedDate: '2026-06-20', themes: ['Regulatory Non-Compliance'], stage: 'Regulatory Action', confidence: 47, excerpt: 'An industry compliance report highlighted gaps in SCUML registration renewal among mid-sized agro-export operators, naming several firms...' }
    ], notes: []
  },
  {
    id: 'am-3', subjectName: 'Fatima Bello', verdict: 'CLEAR', riskScore: 8, screenedAt: '2026-09-06 11:50 AM', reviewStatus: 'pending', articles: [], notes: []
  },
  {
    id: 'am-4', subjectName: 'Samuel Etim', verdict: 'CLEAR', riskScore: 3, screenedAt: '2026-09-07 02:05 PM', reviewStatus: 'pending', articles: [], notes: []
  }
];

export const MOCK_KYB_COMPANIES: KybCompany[] = [
  {
    id: 'kyb-1', legalName: 'PayFlux Technologies Limited', registrationNumber: 'RC-1487321', country: 'Nigeria', status: 'Active',
    incorporationDate: '2021-03-12', registeredAddress: '14 Adeola Odeku Street, Victoria Island, Lagos', industry: 'Payment Gateway',
    directors: [
      { name: 'Rukayat Yaro', role: 'Managing Director', nationality: 'Nigerian' },
      { name: 'Tolulope Oke', role: 'Director', nationality: 'Nigerian' }
    ],
    shareholders: [
      { name: 'Rukayat Yaro', type: 'Person', ownershipPct: 60 },
      { name: 'Tolulope Oke', type: 'Person', ownershipPct: 40 }
    ],
    ownershipTree: {
      id: 'n-root', name: 'PayFlux Technologies Limited', type: 'company', children: [
        { id: 'n-1', name: 'Rukayat Yaro', type: 'person', ownershipPct: 60, isUbo: true },
        { id: 'n-2', name: 'Tolulope Oke', type: 'person', ownershipPct: 40, isUbo: true }
      ]
    },
    ubos: [{ name: 'Rukayat Yaro', effectiveOwnershipPct: 60, nationality: 'Nigerian' }, { name: 'Tolulope Oke', effectiveOwnershipPct: 40, nationality: 'Nigerian' }],
    riskFlags: [], dataSources: ['CAC Registry'], verificationStatus: 'verified', verifiedAt: '2026-04-05', verifiedBy: 'Rukayat Yaro', notes: []
  },
  {
    id: 'kyb-2', legalName: 'Harvestly Agro Exports Limited', registrationNumber: 'RC-2210934', country: 'Nigeria', status: 'Active',
    incorporationDate: '2019-08-01', registeredAddress: '22 Awolowo Way, Ikeja, Lagos', industry: 'Agricultural Exports',
    directors: [{ name: 'Chika Obiora', role: 'Managing Director', nationality: 'Nigerian' }],
    shareholders: [
      { name: 'Chika Obiora', type: 'Person', ownershipPct: 70 },
      { name: 'Meridian Holdings BVI Ltd', type: 'Company', ownershipPct: 30, country: 'British Virgin Islands' }
    ],
    ownershipTree: {
      id: 'n-root', name: 'Harvestly Agro Exports Limited', type: 'company', children: [
        { id: 'n-1', name: 'Chika Obiora', type: 'person', ownershipPct: 70, isUbo: true },
        {
          id: 'n-2', name: 'Meridian Holdings BVI Ltd', type: 'company', ownershipPct: 30, flag: 'offshore', children: [
            { id: 'n-2-1', name: 'Meridian Trust (Nominee)', type: 'company', ownershipPct: 100, flag: 'nominee', children: [
              { id: 'n-2-1-1', name: 'Unidentified Beneficial Owner', type: 'person', ownershipPct: 100, flag: 'complex' }
            ] }
          ]
        }
      ]
    },
    ubos: [{ name: 'Chika Obiora', effectiveOwnershipPct: 70, nationality: 'Nigerian' }],
    riskFlags: ['Offshore shareholder (British Virgin Islands)', 'Nominee arrangement detected in ownership chain', 'Ultimate beneficial owner behind 30% stake not yet disclosed'],
    dataSources: ['CAC Registry', 'BVI Corporate Registry (manual lookup)'], verificationStatus: 'review_required', notes: [
      { id: 'n1', author: 'Ronke Odusanya', date: '2026-09-06 10:45 AM', text: 'Requested beneficial-ownership declaration for the BVI shareholder before final sign-off.' }
    ]
  },
  {
    id: 'kyb-3', legalName: 'Nimbus Bank Plc', registrationNumber: 'RC-88213', country: 'Nigeria', status: 'Active',
    incorporationDate: '2005-02-18', registeredAddress: '9 Marina Road, Lagos Island, Lagos', industry: 'Banking',
    directors: [{ name: 'Adaeze Nwankwo', role: 'Chairman', nationality: 'Nigerian' }, { name: 'James Attah', role: 'Non-Executive Director', nationality: 'Nigerian' }],
    shareholders: [{ name: 'Nimbus Holdings Ltd', type: 'Company', ownershipPct: 100 }],
    ownershipTree: {
      id: 'n-root', name: 'Nimbus Bank Plc', type: 'company', children: [
        { id: 'n-1', name: 'Nimbus Holdings Ltd', type: 'company', ownershipPct: 100, children: [
          { id: 'n-1-1', name: 'Adaeze Nwankwo', type: 'person', ownershipPct: 55, isUbo: true },
          { id: 'n-1-2', name: 'Public Shareholders (NGX Listed)', type: 'company', ownershipPct: 45 }
        ] }
      ]
    },
    ubos: [{ name: 'Adaeze Nwankwo', effectiveOwnershipPct: 55, nationality: 'Nigerian' }],
    riskFlags: [], dataSources: ['CAC Registry', 'NGX Disclosures'], verificationStatus: 'verified', verifiedAt: '2026-03-01', verifiedBy: 'Rukayat Yaro', notes: []
  }
];
