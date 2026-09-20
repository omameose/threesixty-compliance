import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
import { CompanyApiService } from '../../core/services/company-api.service';
import { AuthService } from '../../core/services/auth.service';
import { CompanyProfile } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent],
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  activeTab: 'company' | 'security' | 'notifications' = 'company';
  company?: CompanyProfile;
  saving = false;
  saved = signal(false);
  error = signal('');
  logoPreview: string | null = null;

  twoFactorEnabled = false;
  notifPrefs = { newSubmission: true, highRisk: true, weeklyDigest: true, webhookFailures: true };

  constructor(private companies: CompanyApiService, public auth: AuthService) {}

  ngOnInit() {
    this.companies.profile().subscribe({
      next: c => { this.company = { ...c }; this.logoPreview = c.logoUrl || null; },
      error: (e: ApiError) => this.error.set(e.userMessage)
    });
    this.twoFactorEnabled = this.auth.currentUser()?.twoFactorEnabled || false;
  }

  /** The logo is a web address: a picture pasted into the settings would be far too large to store. */
  onLogoUrl(url: string) {
    if (this.company) this.company.logoUrl = url.trim();
    this.logoPreview = url.trim() || null;
  }

  save() {
    if (!this.company) return;
    this.saving = true;
    this.error.set('');
    this.companies.saveProfile(this.company).subscribe({
      next: c => {
        this.saving = false;
        this.company = { ...c };
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), 2500);
      },
      error: (e: ApiError) => { this.saving = false; this.error.set(e.userMessage); }
    });
  }
}
