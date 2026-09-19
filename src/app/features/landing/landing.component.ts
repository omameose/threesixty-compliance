import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface Service { icon: string; title: string; desc: string; }
interface Pillar { key: string; title: string; tagline: string; icon: string; items: string[]; }
interface Role { name: string; use: string; }
interface RiskDriver { label: string; points: number; }
interface Faq { q: string; a: string; }

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './landing.component.html'
})
export class LandingComponent {
  mobileMenuOpen = false;
  activeServiceTab: 'know' | 'understand' | 'act' | 'govern' = 'know';

  pillars: Pillar[] = [
    { key: 'know', title: 'KNOW', tagline: 'Customer Intelligence', icon: 'user-check', items: ['KYC / KYB', 'PEP Screening', 'Sanctions Screening', 'Adverse Media', 'Beneficial Ownership'] },
    { key: 'understand', title: 'UNDERSTAND', tagline: 'Risk & Detection', icon: 'gauge', items: ['Customer Risk', 'Transaction Risk', 'Behavioural Analytics', 'Fraud Analytics', 'Network Intelligence'] },
    { key: 'act', title: 'ACT', tagline: 'Investigation & Response', icon: 'folder', items: ['Alerts', 'Investigations & Cases', 'EDD', 'STR/SAR, CTR/ITR', 'Blocking / Review'] },
    { key: 'govern', title: 'GOVERN', tagline: 'Governance & Management', icon: 'scale', items: ['Audit', 'Model Governance', 'Compliance Testing', 'Regulatory Reporting', 'Board Reporting'] }
  ];

  servicesByPillar: Record<string, Service[]> = {
    know: [
      { icon: 'user-check', title: 'KYC — Digital Onboarding', desc: 'Verify individual identities in seconds with document, OCR, liveness and face-match checks.' },
      { icon: 'building', title: 'KYB & Beneficial Ownership', desc: 'Validate registered businesses and trace layered ownership chains to the true UBO.' },
      { icon: 'users-check', title: 'PEP Screening', desc: 'Identify politically exposed persons, family and close associates, with change monitoring.' },
      { icon: 'shield', title: 'Sanctions & Watchlist Screening', desc: 'Real-time fuzzy matching against OFAC, UN, EU, UK and Nigerian/local lists.' },
      { icon: 'newspaper', title: 'Adverse Media Intelligence', desc: 'Detect corruption, fraud and AML themes — with source and confidence, never a guilt verdict.' },
      { icon: 'id-card', title: 'ID & Document Verification', desc: 'Government ID authentication and document tamper-detection with liveness checks.' }
    ],
    understand: [
      { icon: 'gauge', title: 'Customer Risk Engine', desc: 'Configurable inherent / control / residual risk scoring, converted from your existing methodology.' },
      { icon: 'activity', title: 'Transaction Monitoring (TMS)', desc: 'Rule-based detection of structuring, rapid movement, dormant reactivation and mule behaviour.' },
      { icon: 'alert-triangle', title: 'Fraud Detection Engine', desc: 'Account takeover, mule accounts, social engineering and collusive-merchant typologies.' },
      { icon: 'store', title: 'Merchant Risk & Fraud', desc: 'Onboarding risk scoring and ongoing monitoring for transaction laundering and chargeback abuse.' },
      { icon: 'smartphone', title: 'Device & Digital Intelligence', desc: 'Device, IP and session fingerprinting to surface shared-device fraud and mule networks.' },
      { icon: 'network', title: 'Network / Graph Analytics', desc: 'Model relationships across customers, accounts, devices and merchants to surface hidden exposure.' }
    ],
    act: [
      { icon: 'bell', title: 'Alert Management', desc: 'Every detection becomes a structured, prioritised alert with assign, escalate and merge actions.' },
      { icon: 'folder', title: 'Case Management', desc: 'The operating-system spine — Alert → Investigate → Decision → STR/SAR or Close, fully auditable.' },
      { icon: 'users-check', title: 'CDD & Enhanced Due Diligence', desc: 'Automatic EDD triggers with a checklist workflow — activation blocked until EDD is complete.' },
      { icon: 'eye', title: 'Continuous Monitoring', desc: 'Onboarding is never "finished" — screen, monitor, re-screen and re-rate on every material change.' },
      { icon: 'flag', title: 'STR/SAR Management', desc: 'Drafting, maker/checker approval and filing tracking through a configurable NFIU connector.' },
      { icon: 'scale', title: 'CTR/ITR Regulatory Reporting', desc: 'Automated identification of qualifying cash transactions and international transfers.' },
      { icon: 'sliders', title: 'Risk Appetite & Decision Engine', desc: 'Configure your own approval matrix — Low to Very High risk routes to the right approver.' }
    ],
    govern: [
      { icon: 'sliders', title: 'Compliance Rules Studio', desc: 'Configure thresholds, weights and alert rules yourself — no developer deployment required.' },
      { icon: 'cpu', title: 'Model Governance & AI Governance', desc: 'Every model tracked for precision, recall, drift and explainability — never a black box.' },
      { icon: 'lock', title: 'Audit Trail', desc: 'Immutable, permanent record of who did what, when and why — no one can delete evidence.' },
      { icon: 'calendar', title: 'Regulatory Calendar', desc: 'Track STR/CTR deadlines, reviews, training and licence renewals in one obligations dashboard.' },
      { icon: 'academic-cap', title: 'AML Compliance Programme', desc: 'Policy management, control testing, training completion and control self-assessment.' },
      { icon: 'grid', title: 'Board & Executive Dashboards', desc: 'Exposure, effectiveness and risk-concentration reporting built for the Board Risk Committee.' }
    ]
  };

  riskDrivers: RiskDriver[] = [
    { label: 'PEP match', points: 18 },
    { label: 'High-risk geography', points: 10 },
    { label: 'Transaction velocity', points: 15 },
    { label: 'Network exposure', points: 17 }
  ];

  lifecycleSteps = [
    { title: 'Onboard', desc: 'KYC → KYB → PEP → Sanctions → Adverse Media → Risk Rating → Approval.' },
    { title: 'Operate', desc: 'Transaction monitoring, fraud, behaviour, network and continuous re-screening.' },
    { title: 'Detect', desc: 'Alerts generated, prioritised and explained with contributing risk drivers.' },
    { title: 'Investigate', desc: 'Case opened, evidence reviewed, EDD applied, compliance decision made.' },
    { title: 'Report', desc: 'STR/SAR or CTR/ITR drafted, approved and filed through a regulatory connector.' },
    { title: 'Govern', desc: 'Board and management dashboards, model and compliance governance.' }
  ];

  roles: Role[] = [
    { name: 'Compliance Officer', use: 'Daily alert triage, investigations, EDD and KYC review.' },
    { name: 'MLRO', use: 'STR/SAR approval, regulatory filing oversight and escalations.' },
    { name: 'CCO', use: 'High-risk approvals, policy configuration, regulatory relationship.' },
    { name: 'Fraud Officer', use: 'Fraud alerts, merchant risk and device/network investigations.' },
    { name: 'Risk Officer', use: 'Risk appetite configuration and risk-model oversight.' },
    { name: 'Internal Audit', use: 'Read-only access to cases, decisions, models, rules and logs.' },
    { name: 'Management', use: 'Compliance dashboards, KPI and exposure reporting.' },
    { name: 'Board / Risk Committee', use: 'Executive war room and board-level exposure reporting.' }
  ];

  africaPacks = [
    { country: 'Nigeria', status: 'Live — first market', detail: 'CBN, NFIU reporting, Nigerian PEP intelligence, local regulatory lists and risk parameters.' },
    { country: 'Ghana', status: 'Roadmap', detail: 'Bank of Ghana / FIC-aligned regulatory pack, added as configuration — not a rebuild.' },
    { country: 'Kenya', status: 'Roadmap', detail: 'CBK / FRC-aligned regulatory pack for the East African market.' },
    { country: 'South Africa', status: 'Roadmap', detail: 'SARB / FIC-aligned regulatory pack for the Southern African market.' }
  ];

  faqs: Faq[] = [
    { q: 'Is this built specifically for Nigerian regulatory requirements?', a: 'Yes. 360Compliance ships with a Nigeria Compliance Pack by default — CBN-aligned risk parameters, NFIU-oriented STR/CTR/ITR filing workflows and Nigerian PEP intelligence — configured, not hard-coded, so it can adapt as circulars change.' },
    { q: 'Can we use only the screening and scoring APIs without the full portal?', a: 'Yes. The platform supports API-only consumption — screening, scoring, case and alert endpoints plus webhooks — so your own operations tooling can call it directly without ever using the UI.' },
    { q: 'How is the risk engine explainable to a regulator?', a: 'Every score carries a "Why?" breakdown decomposing the result into contributing drivers with point weights — deterministic rules, statistical/ML behaviour and relationship/network intelligence — combined into one traceable, auditable score.' },
    { q: 'What deployment models are available for regulated institutions?', a: 'Cloud SaaS for fast-moving fintechs and PSPs, Dedicated Cloud for larger institutions needing isolation, and On-Premise / Private Cloud for banks with strict data-residency requirements — all on the same codebase.' },
    { q: 'Is our data ever deleted or hidden from Internal Audit?', a: 'No. The audit trail is immutable and append-only — no user, including administrators, can silently delete historical compliance evidence.' }
  ];

  logos = ['PayFlux', 'Nimbus Bank', 'Harvestly', 'Medico Health', 'EduSpark', 'CargoLine'];

  toggleMenu() { this.mobileMenuOpen = !this.mobileMenuOpen; }
  setServiceTab(key: string) { this.activeServiceTab = key as 'know' | 'understand' | 'act' | 'govern'; }
}
