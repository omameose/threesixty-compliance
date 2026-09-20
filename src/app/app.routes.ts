import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
      { path: 'register', loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent) },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
      { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email.component').then(m => m.VerifyEmailComponent) },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
      { path: 'accept-invite', loadComponent: () => import('./features/auth/accept-invite/accept-invite.component').then(m => m.AcceptInviteComponent) },
      { path: 'verify-2fa', loadComponent: () => import('./features/auth/verify-2fa/verify-2fa.component').then(m => m.Verify2faComponent) }
    ]
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard-layout/dashboard-layout.component').then(m => m.DashboardLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent), title: 'Dashboard' },
      { path: 'verification-kyc', loadComponent: () => import('./features/kyc/kyc-wizard.component').then(m => m.KycWizardComponent), title: 'Company Verification' },
      { path: 'templates', loadComponent: () => import('./features/templates/sector-list/sector-list.component').then(m => m.SectorListComponent), title: 'Compliance Templates' },
      { path: 'templates/:sectorId', loadComponent: () => import('./features/templates/industry-list/industry-list.component').then(m => m.IndustryListComponent), title: 'Industries' },
      { path: 'templates/:sectorId/:industryId', loadComponent: () => import('./features/templates/template-list/template-list.component').then(m => m.TemplateListComponent), title: 'Templates' },
      { path: 'templates/:sectorId/:industryId/:templateId', loadComponent: () => import('./features/templates/template-preview/template-preview.component').then(m => m.TemplatePreviewComponent), title: 'Preview Template' },
      { path: 'form-builder', loadComponent: () => import('./features/form-builder/form-builder.component').then(m => m.FormBuilderComponent), title: 'Form Builder' },
      { path: 'form-builder/:formId', loadComponent: () => import('./features/form-builder/form-builder.component').then(m => m.FormBuilderComponent), title: 'Form Builder' },
      { path: 'my-compliance', loadComponent: () => import('./features/my-compliance/my-compliance-list/my-compliance-list.component').then(m => m.MyComplianceListComponent), title: 'My Compliance' },
      { path: 'my-compliance/:formId', loadComponent: () => import('./features/my-compliance/my-compliance-detail/my-compliance-detail.component').then(m => m.MyComplianceDetailComponent), title: 'Compliance Form' },
      { path: 'my-compliance/:formId/submissions/:customerId', loadComponent: () => import('./features/my-clients/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent), title: 'Submission Review' },
      { path: 'my-clients', loadComponent: () => import('./features/my-clients/my-clients-list/my-clients-list.component').then(m => m.MyClientsListComponent), title: 'My Clients' },
      { path: 'my-clients/:customerId', loadComponent: () => import('./features/my-clients/customer-detail/customer-detail.component').then(m => m.CustomerDetailComponent), title: 'Client Detail' },
      // KNOW — Customer Intelligence (dedicated analyst workbenches)
      { path: 'screening/sanctions', loadComponent: () => import('./features/screening/sanctions-screening/sanctions-screening.component').then(m => m.SanctionsScreeningComponent), title: 'Sanctions Screening' },
      { path: 'screening/pep', loadComponent: () => import('./features/screening/pep-screening/pep-screening.component').then(m => m.PepScreeningComponent), title: 'PEP Screening' },
      { path: 'screening/adverse-media', loadComponent: () => import('./features/screening/adverse-media/adverse-media.component').then(m => m.AdverseMediaComponent), title: 'Adverse Media Intelligence' },
      { path: 'kyb', loadComponent: () => import('./features/kyb/kyb-verification.component').then(m => m.KybVerificationComponent), title: 'KYB & Beneficial Ownership' },
      { path: 'verification/id', loadComponent: () => import('./features/verification/id-verification/id-verification.component').then(m => m.IdVerificationComponent), title: 'ID Verification' },
      { path: 'verification/business', loadComponent: () => import('./features/verification/business-verification/business-verification.component').then(m => m.BusinessVerificationComponent), title: 'Business Verification' },
      { path: 'verification/document', loadComponent: () => import('./features/verification/document-verification/document-verification.component').then(m => m.DocumentVerificationComponent), title: 'Document Verification' },
      // UNDERSTAND — Risk & Detection (dedicated)
      { path: 'detection/risk-engine', loadComponent: () => import('./features/detection/customer-risk-engine/customer-risk-engine.component').then(m => m.CustomerRiskEngineComponent), title: 'Customer Risk Engine' },
      { path: 'detection/transaction-monitoring', loadComponent: () => import('./features/detection/transaction-monitoring/transaction-monitoring.component').then(m => m.TransactionMonitoringComponent), title: 'Transaction Monitoring' },
      { path: 'detection/fraud', loadComponent: () => import('./features/detection/fraud-detection/fraud-detection.component').then(m => m.FraudDetectionComponent), title: 'Fraud Detection' },
      { path: 'detection/merchant-risk', loadComponent: () => import('./features/detection/merchant-risk/merchant-risk.component').then(m => m.MerchantRiskComponent), title: 'Merchant Risk & Fraud' },
      { path: 'detection/device-intelligence', loadComponent: () => import('./features/detection/device-intelligence/device-intelligence.component').then(m => m.DeviceIntelligenceComponent), title: 'Device & Digital Intelligence' },
      { path: 'detection/network-analytics', loadComponent: () => import('./features/detection/network-analytics/network-analytics.component').then(m => m.NetworkAnalyticsComponent), title: 'Network / Graph Analytics' },
      // ACT — Investigation & Response
      { path: 'alerts', loadComponent: () => import('./features/alerts/alert-list/alert-list.component').then(m => m.AlertListComponent), title: 'Alert Management' },
      { path: 'cases', loadComponent: () => import('./features/cases/case-list/case-list.component').then(m => m.CaseListComponent), title: 'Case Management' },
      { path: 'cases/:caseId', loadComponent: () => import('./features/cases/case-detail/case-detail.component').then(m => m.CaseDetailComponent), title: 'Case Detail' },
      { path: 'cdd', loadComponent: () => import('./features/cdd/cdd.component').then(m => m.CddComponent), title: 'Customer Due Diligence' },
      { path: 'edd', loadComponent: () => import('./features/edd/edd.component').then(m => m.EddComponent), title: 'Enhanced Due Diligence' },
      { path: 'continuous-monitoring', loadComponent: () => import('./features/continuous-monitoring/continuous-monitoring.component').then(m => m.ContinuousMonitoringComponent), title: 'Continuous Monitoring' },
      { path: 'str-sar', loadComponent: () => import('./features/str-sar/str-sar-list.component').then(m => m.StrSarListComponent), title: 'STR/SAR Management' },
      { path: 'ctr-itr', loadComponent: () => import('./features/ctr-itr/ctr-itr-list.component').then(m => m.CtrItrListComponent), title: 'CTR/ITR Reporting' },
      // DECISION — Risk appetite & rules
      { path: 'decision-engine', loadComponent: () => import('./features/decision-engine/decision-engine.component').then(m => m.DecisionEngineComponent), title: 'Risk Appetite & Decision Engine' },
      // GOVERN — Governance & Management
      { path: 'rules-studio', loadComponent: () => import('./features/rules-studio/rules-studio.component').then(m => m.RulesStudioComponent), title: 'Compliance Rules Studio' },
      { path: 'model-governance', loadComponent: () => import('./features/model-governance/model-governance.component').then(m => m.ModelGovernanceComponent), title: 'Model Governance' },
      { path: 'audit-trail', loadComponent: () => import('./features/audit-trail/audit-trail.component').then(m => m.AuditTrailComponent), title: 'Audit Trail' },
      { path: 'regulatory-calendar', loadComponent: () => import('./features/regulatory-calendar/regulatory-calendar.component').then(m => m.RegulatoryCalendarComponent), title: 'Regulatory Calendar' },
      { path: 'compliance-programme', loadComponent: () => import('./features/compliance-programme/compliance-programme.component').then(m => m.ComplianceProgrammeComponent), title: 'AML Compliance Programme' },
      { path: 'board-dashboard', loadComponent: () => import('./features/board-dashboard/board-dashboard.component').then(m => m.BoardDashboardComponent), title: 'Board Dashboard' },
      { path: 'war-room', loadComponent: () => import('./features/war-room/war-room.component').then(m => m.WarRoomComponent), title: 'Executive War Room' },
      { path: 'developer-console', loadComponent: () => import('./features/developer-console/developer-console.component').then(m => m.DeveloperConsoleComponent), title: 'Developer Console' },
      { path: 'teams', loadComponent: () => import('./features/teams/teams.component').then(m => m.TeamsComponent), title: 'Teams' },
      { path: 'subscription', loadComponent: () => import('./features/subscription/subscription.component').then(m => m.SubscriptionComponent), title: 'Subscription' },
      { path: 'settings', loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent), title: 'Settings' },
      { path: 'profile', loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent), title: 'Profile' }
    ]
  },
  {
    path: 'verify/:formId',
    loadComponent: () => import('./features/kyc-portal/kyc-portal.component').then(m => m.KycPortalComponent)
  },
  { path: '**', redirectTo: '' }
];
