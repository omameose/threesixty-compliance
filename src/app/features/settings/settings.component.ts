import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
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
  logoPreview: string | ArrayBuffer | null = null;

  twoFactorEnabled = false;
  notifPrefs = { newSubmission: true, highRisk: true, weeklyDigest: true, webhookFailures: true };

  constructor(private data: DataService, public auth: AuthService) {}

  ngOnInit() {
    this.data.getCompany().subscribe(c => { this.company = { ...c }; this.logoPreview = c.logoUrl || null; });
    this.twoFactorEnabled = this.auth.currentUser()?.twoFactorEnabled || false;
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { this.logoPreview = reader.result; };
    reader.readAsDataURL(file);
  }

  save() {
    if (!this.company) return;
    this.saving = true;
    this.company.logoUrl = typeof this.logoPreview === 'string' ? this.logoPreview : this.company.logoUrl;
    this.data.updateCompany(this.company).subscribe(() => {
      this.saving = false;
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2500);
    });
  }
}
