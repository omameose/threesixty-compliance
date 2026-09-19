import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/services/data.service';
import { ApiKeyPair, WebhookConfig, WebhookLog } from '../../core/models/models';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-developer-console',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent],
  templateUrl: './developer-console.component.html'
})
export class DeveloperConsoleComponent implements OnInit {
  activeTab: 'keys' | 'webhooks' | 'logs' = 'keys';
  apiKeys: ApiKeyPair[] = [];
  webhookConfig?: WebhookConfig;
  webhookLogs: WebhookLog[] = [];
  loading = true;
  visibleSecrets = new Set<string>();
  copiedKey = signal<string | null>(null);
  regenModalOpen = signal(false);
  regenTargetEnv: 'test' | 'live' = 'test';
  availableEvents = ['kyc.completed', 'kyb.completed', 'aml.flagged', 'submission.approved', 'submission.rejected', 'submission.more_info_required', 'sanctions.match_found', 'pep.match_found'];

  constructor(private data: DataService) {}

  ngOnInit() {
    this.data.getApiKeys().subscribe(k => this.apiKeys = k);
    this.data.getWebhookConfig().subscribe(w => this.webhookConfig = { ...w });
    this.data.getWebhookLogs().subscribe(l => { this.webhookLogs = l; this.loading = false; });
  }

  toggleSecretVisible(id: string) {
    this.visibleSecrets.has(id) ? this.visibleSecrets.delete(id) : this.visibleSecrets.add(id);
  }

  copy(text: string, key: string) {
    navigator.clipboard?.writeText(text).catch(() => {});
    this.copiedKey.set(key);
    setTimeout(() => this.copiedKey.set(null), 1500);
  }

  openRegen(env: 'test' | 'live') {
    this.regenTargetEnv = env;
    this.regenModalOpen.set(true);
  }

  confirmRegen() {
    this.apiKeys = this.apiKeys.map(k => k.environment === this.regenTargetEnv
      ? { ...k, secretKeyMasked: 'sk_' + k.environment + '_••••••••••••' + Math.random().toString(36).slice(-4), createdAt: new Date().toISOString().slice(0, 10) }
      : k);
    this.regenModalOpen.set(false);
  }

  toggleEvent(event: string) {
    if (!this.webhookConfig) return;
    const has = this.webhookConfig.events.includes(event);
    this.webhookConfig.events = has ? this.webhookConfig.events.filter(e => e !== event) : [...this.webhookConfig.events, event];
  }

  saved = signal(false);
  saveWebhook() {
    this.saved.set(true);
    setTimeout(() => this.saved.set(false), 2000);
  }
}
