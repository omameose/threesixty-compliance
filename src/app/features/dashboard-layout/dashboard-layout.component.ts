import { CommonModule } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { AuthService } from '../../core/services/auth.service';
import { DataService } from '../../core/services/data.service';
import { SubscriptionApiService } from '../../core/services/subscription-api.service';

interface NavItem { label: string; icon: string; path?: string; children?: { label: string; path: string }[]; }
interface NavGroup { label: string; items: NavItem[]; }

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, IconComponent, AvatarComponent],
  templateUrl: './dashboard-layout.component.html'
})
export class DashboardLayoutComponent {
  sidebarCollapsed = signal(false);
  mobileSidebarOpen = signal(false);
  profileMenuOpen = signal(false);
  notifOpen = signal(false);
  isMobile = signal(window.innerWidth < 1024);
  currentTitle = signal('Dashboard');
  trialBannerVisible = signal(true);
  expandedGroups = signal<Record<string, boolean>>({
    'Customer Intelligence': true,
    'Risk & Detection': false,
    'Decision': false,
    'Investigation & Response': false,
    'Governance & Reporting': false,
    'Executive': false
  });

  mainNav: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/app/dashboard' },
    { label: 'Compliance Templates', icon: 'templates', path: '/app/templates' },
    { label: 'Form Builder', icon: 'form-builder', path: '/app/form-builder' },
    { label: 'My Compliance', icon: 'compliance', path: '/app/my-compliance' },
    { label: 'My Clients (Customer 360)', icon: 'clients', path: '/app/my-clients' },
  ];

  // KNOW — Customer Intelligence
  knowNav: NavItem[] = [
    { label: 'Sanctions Screening', icon: 'shield', path: '/app/screening/sanctions' },
    { label: 'PEP Screening', icon: 'user-check', path: '/app/screening/pep' },
    { label: 'Adverse Media Intelligence', icon: 'newspaper', path: '/app/screening/adverse-media' },
    { label: 'KYB & Beneficial Ownership', icon: 'building', path: '/app/kyb' },
    { label: 'ID Verification', icon: 'id-card', path: '/app/verification/id' },
    { label: 'Business Verification', icon: 'briefcase', path: '/app/verification/business' },
    { label: 'Document Verification', icon: 'file-check', path: '/app/verification/document' },
  ];

  // UNDERSTAND — Risk & Detection
  understandNav: NavItem[] = [
    { label: 'Customer Risk Engine', icon: 'gauge', path: '/app/detection/risk-engine' },
    { label: 'Transaction Monitoring', icon: 'activity', path: '/app/detection/transaction-monitoring' },
    { label: 'Fraud Detection', icon: 'alert-triangle', path: '/app/detection/fraud' },
    { label: 'Merchant Risk & Fraud', icon: 'store', path: '/app/detection/merchant-risk' },
    { label: 'Device & Digital Intelligence', icon: 'smartphone', path: '/app/detection/device-intelligence' },
    { label: 'Network / Graph Analytics', icon: 'network', path: '/app/detection/network-analytics' },
  ];

  // DECISION — Risk Appetite + Rules Studio (policy layer sitting between Intelligence and Operations)
  decisionNav: NavItem[] = [
    { label: 'Risk Appetite & Decision Engine', icon: 'sliders', path: '/app/decision-engine' },
    { label: 'Compliance Rules Studio', icon: 'layers', path: '/app/rules-studio' },
  ];

  // ACT — Investigation & Response (Operations layer)
  actNav: NavItem[] = [
    { label: 'Alert Management', icon: 'bell', path: '/app/alerts' },
    { label: 'Case Management', icon: 'folder', path: '/app/cases' },
    { label: 'Customer Due Diligence', icon: 'users-check', path: '/app/cdd' },
    { label: 'Enhanced Due Diligence (EDD)', icon: 'file-check', path: '/app/edd' },
    { label: 'Continuous Monitoring', icon: 'eye', path: '/app/continuous-monitoring' },
    { label: 'STR/SAR Management', icon: 'flag', path: '/app/str-sar' },
    { label: 'CTR/ITR Reporting', icon: 'scale', path: '/app/ctr-itr' },
  ];

  // GOVERN — Governance & Reporting
  governNav: NavItem[] = [
    { label: 'Model Governance', icon: 'cpu', path: '/app/model-governance' },
    { label: 'Audit Trail', icon: 'lock', path: '/app/audit-trail' },
    { label: 'Regulatory Calendar', icon: 'calendar', path: '/app/regulatory-calendar' },
    { label: 'AML Compliance Programme', icon: 'academic-cap', path: '/app/compliance-programme' },
  ];

  // EXECUTIVE — Management & Board reporting
  executiveNav: NavItem[] = [
    { label: 'Board Dashboard', icon: 'grid', path: '/app/board-dashboard' },
    { label: 'Executive War Room', icon: 'activity', path: '/app/war-room' },
  ];

  navGroups: NavGroup[] = [
    { label: 'Customer Intelligence', items: this.knowNav },
    { label: 'Risk & Detection', items: this.understandNav },
    { label: 'Decision', items: this.decisionNav },
    { label: 'Investigation & Response', items: this.actNav },
    { label: 'Governance & Reporting', items: this.governNav },
    { label: 'Executive', items: this.executiveNav },
  ];

  accountNav: NavItem[] = [
    { label: 'Developer Console', icon: 'code', path: '/app/developer-console' },
    { label: 'Teams', icon: 'users', path: '/app/teams' },
    { label: 'Subscription', icon: 'credit-card', path: '/app/subscription' },
  ];

  bottomNav: NavItem[] = [
    { label: 'Settings', icon: 'settings', path: '/app/settings' },
    { label: 'Profile', icon: 'user', path: '/app/profile' },
  ];

  toggleGroup(label: string) {
    this.expandedGroups.update(g => ({ ...g, [label]: !g[label] }));
  }

  /** The real plan and usage (subscription-service); hidden until it loads or if it cannot be loaded. */
  plan = signal<{ name: string; status: string; used: number; included: number; percent: number } | null>(null);

  company = this.dataService.company;
  user = this.auth.currentUser;

  /** Screens whose data comes from the real backend. Anything else still shows built-in sample data and says so. */
  private static readonly LIVE = ['/app/dashboard', '/app/templates', '/app/form-builder', '/app/my-compliance', '/app/my-clients', '/app/subscription',
    '/app/teams', '/app/settings', '/app/profile', '/app/developer-console', '/app/verification-kyc'];

  showingSampleData(): boolean {
    const url = this.router.url;
    return !DashboardLayoutComponent.LIVE.some(p => url === p || url.startsWith(p + '/') || url.startsWith(p + '?'));
  }

  onVerificationPage(): boolean {
    return this.router.url.startsWith('/app/verification-kyc');
  }

  constructor(public auth: AuthService, private dataService: DataService, private router: Router, private subscriptions: SubscriptionApiService) {
    this.subscriptions.getSubscription().subscribe({
      next: s => this.subscriptions.getPlans().subscribe({
        next: plans => this.plan.set({
          name: plans.find(p => p.id === s.planId)?.name ?? s.planId, status: s.status, used: s.usage.used, included: s.usage.included,
          percent: s.usage.included > 0 ? Math.min(100, Math.round((100 * s.usage.used) / s.usage.included)) : 0
        }),
        error: () => {}
      }),
      error: () => {}
    });
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.mobileSidebarOpen.set(false);
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.isMobile.set(window.innerWidth < 1024);
  }

  toggleSidebar() { this.sidebarCollapsed.update(v => !v); }
  toggleMobileSidebar() { this.mobileSidebarOpen.update(v => !v); }
  toggleProfileMenu() { this.profileMenuOpen.update(v => !v); this.notifOpen.set(false); }
  toggleNotif() { this.notifOpen.update(v => !v); this.profileMenuOpen.set(false); }

  logout() { this.auth.logout(); }
}
