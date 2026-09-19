import { NetworkGraphData } from '../models/models';

export const MOCK_NETWORK_GRAPH: NetworkGraphData = {
  nodes: [
    { id: 'n-ibrahim', label: 'Ibrahim Musa', type: 'customer', risk: 'high', detail: 'Sanctions MATCH (94%) — CASE-2026-0091 escalated.', customerId: 'cust-1016' },
    { id: 'n-chidinma', label: 'Chidinma Nwosu', type: 'customer', risk: 'high', detail: 'Structuring alert — 6 deposits under ₦1,000,000 in 24h.' },
    { id: 'n-peter', label: 'Peter Okafor', type: 'customer', risk: 'high', detail: 'Account takeover alert — device first seen 1 day before login.' },
    { id: 'n-amaka', label: 'Amaka Chukwu', type: 'customer', risk: 'medium', detail: 'Mule-account behaviour hit — cleared after review.' },
    { id: 'n-uche', label: 'Uche Eze', type: 'customer', risk: 'high', detail: 'Collusive merchant activity — case escalated.' },
    { id: 'n-blessing', label: 'Blessing Adeyemi', type: 'customer', risk: 'medium', detail: 'Social engineering fraud hit under review.' },
    { id: 'n-chika', label: 'Chika Obiora', type: 'customer', risk: 'medium', detail: 'Managing Director, Harvestly Agro Exports — 70% shareholder.' },

    { id: 'n-dev1', label: 'DVC-8827-AA10', type: 'device', risk: 'medium', detail: 'Mobile — Android. New SIM registered in last 7 days.' },
    { id: 'n-dev2', label: 'DVC-4471-BB22', type: 'device', risk: 'high', detail: 'Shared across 3 unrelated customer profiles.' },
    { id: 'n-dev4', label: 'DVC-9931-DD44', type: 'device', risk: 'high', detail: 'First seen 1 day before account-takeover alert.' },
    { id: 'n-dev5', label: 'DVC-6602-EE55', type: 'device', risk: 'high', detail: 'POS terminal linked to 2 previously suspended merchants.' },

    { id: 'n-shadow', label: 'Shadow Trading Co.', type: 'merchant', risk: 'high', detail: 'Volume 17x expected — suspended for possible transaction laundering.' },
    { id: 'n-quickcash', label: 'QuickCash Exchange Kiosk', type: 'merchant', risk: 'high', detail: 'Volume 4.2x expected, chargeback rate above threshold — under review.' },

    { id: 'n-harvestly', label: 'Harvestly Agro Exports Ltd', type: 'business', risk: 'medium', detail: 'KYB review required — offshore shareholder and nominee arrangement.' },
    { id: 'n-meridian', label: 'Meridian Holdings BVI Ltd', type: 'business', risk: 'high', detail: 'Offshore entity — 30% shareholder in Harvestly, UBO undisclosed.' }
  ],
  edges: [
    { source: 'n-ibrahim', target: 'n-dev2', relation: 'Logged in from device' },
    { source: 'n-amaka', target: 'n-dev2', relation: 'Shared device fingerprint' },
    { source: 'n-uche', target: 'n-dev2', relation: 'Shared device fingerprint' },
    { source: 'n-blessing', target: 'n-dev2', relation: 'Shared device fingerprint' },

    { source: 'n-peter', target: 'n-dev4', relation: 'Primary device' },
    { source: 'n-chidinma', target: 'n-dev1', relation: 'Primary device' },

    { source: 'n-uche', target: 'n-dev5', relation: 'POS terminal used' },
    { source: 'n-dev5', target: 'n-shadow', relation: 'Terminal registered to merchant' },
    { source: 'n-dev5', target: 'n-quickcash', relation: 'Terminal previously linked' },
    { source: 'n-uche', target: 'n-shadow', relation: 'Director / beneficial owner' },

    { source: 'n-chika', target: 'n-harvestly', relation: 'Managing Director, 70% shareholder' },
    { source: 'n-harvestly', target: 'n-meridian', relation: '30% shareholder (offshore)' },

    { source: 'n-ibrahim', target: 'n-chidinma', relation: 'Shared beneficiary account (3 transfers)' },
    { source: 'n-chidinma', target: 'n-peter', relation: 'Shared beneficiary account (2 transfers)' },
    { source: 'n-amaka', target: 'n-blessing', relation: 'Family / associate relationship' }
  ]
};
