import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiError } from '../../core/http/api.service';
import { ApiKeyView, DeveloperApiService, WebhookConfigView, WebhookDelivery } from '../../core/services/developer-api.service';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

/**
 * API keys, the webhook endpoint and its delivery log. Secrets are only ever shown in full once, right after they are created or
 * rotated; after that the server only returns a masked value, so the screen keeps the fresh one in `revealed` until it is closed.
 */
@Component({
  selector: 'app-developer-console',
  standalone: true,
  imports: [CommonModule, FormsModule, PageHeaderComponent, IconComponent, ModalComponent],
  templateUrl: './developer-console.component.html'
})
export class DeveloperConsoleComponent implements OnInit {
  activeTab: 'keys' | 'webhooks' | 'logs' = 'keys';
  keys: ApiKeyView[] = [];
  config?: WebhookConfigView;
  deliveries: WebhookDelivery[] = [];
  loading = true;
  error = signal('');
  notice = signal('');
  busy = signal(false);
  copiedKey = signal<string | null>(null);
  regenModalOpen = signal(false);
  regenTargetEnv: 'test' | 'live' = 'test';
  /** A secret that was just issued, shown once with a copy button. */
  revealed = signal<{ title: string; value: string } | null>(null);

  // editable copy of the webhook settings
  url = '';
  enabled = false;
  encryptPayload = false;
  events: string[] = [];

  constructor(private dev: DeveloperApiService) {}

  ngOnInit() {
    this.dev.keys().subscribe({ next: k => { this.keys = k.filter(x => !x.revoked); this.loading = false; }, error: (e: ApiError) => this.fail(e) });
    this.dev.webhook().subscribe({ next: c => this.applyConfig(c), error: (e: ApiError) => this.fail(e) });
    this.loadDeliveries();
  }

  private fail(e: ApiError) {
    this.loading = false;
    this.error.set(e.httpStatus === 403 ? 'Only the company owner (Super Admin) can use the developer console.' : e.userMessage);
  }

  private applyConfig(c: WebhookConfigView) {
    this.config = c;
    this.url = c.url ?? '';
    this.enabled = c.enabled;
    this.encryptPayload = c.encryptPayload;
    this.events = [...c.events];
  }

  keyFor(env: 'test' | 'live'): ApiKeyView | undefined {
    return this.keys.find(k => k.environment === env);
  }

  copy(text: string | undefined, key: string) {
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => undefined);
    this.copiedKey.set(key);
    setTimeout(() => this.copiedKey.set(null), 1500);
  }

  openRegen(env: 'test' | 'live') {
    this.regenTargetEnv = env;
    this.regenModalOpen.set(true);
  }

  confirmRegen() {
    this.busy.set(true);
    this.error.set('');
    this.dev.regenerateKey(this.regenTargetEnv).subscribe({
      next: n => {
        this.busy.set(false);
        this.regenModalOpen.set(false);
        this.keys = [...this.keys.filter(k => k.environment !== n.key.environment), n.key];
        this.revealed.set({ title: `New ${n.key.environment} secret key`, value: n.secretKey });
      },
      error: (e: ApiError) => { this.busy.set(false); this.regenModalOpen.set(false); this.error.set(e.userMessage); }
    });
  }

  toggleEvent(event: string) {
    this.events = this.events.includes(event) ? this.events.filter(e => e !== event) : [...this.events, event];
  }

  saveWebhook() {
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    this.dev.saveWebhook({ url: this.url.trim(), enabled: this.enabled, encryptPayload: this.encryptPayload, events: this.events }).subscribe({
      next: r => {
        this.busy.set(false);
        this.applyConfig(r.config);
        this.notice.set('Webhook settings saved.');
        if (r.signingSecret) this.revealed.set({ title: 'Your webhook signing secret', value: r.signingSecret });
        else if (r.encryptionKey) this.revealed.set({ title: 'Your payload encryption key', value: r.encryptionKey });
      },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  rotate(kind: 'secret' | 'encryption') {
    if (!confirm(kind === 'secret' ? 'Rotate the signing secret? Deliveries signed with the old one will no longer verify.' : 'Rotate the encryption key? Your receiver must use the new key to decrypt payloads.')) return;
    this.busy.set(true);
    this.error.set('');
    (kind === 'secret' ? this.dev.rotateSecret() : this.dev.rotateEncryptionKey()).subscribe({
      next: r => {
        this.busy.set(false);
        this.applyConfig(r.config);
        this.revealed.set(kind === 'secret' ? { title: 'New signing secret', value: r.signingSecret ?? '' } : { title: 'New encryption key', value: r.encryptionKey ?? '' });
      },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  sendTest() {
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    this.dev.testWebhook().subscribe({
      next: d => {
        this.busy.set(false);
        this.notice.set(d.status === 'DELIVERED' || d.status === 'delivered' ? 'Test event delivered.' : `Test event ${d.status.toLowerCase()}${d.lastError ? ': ' + d.lastError : ''}.`);
        this.loadDeliveries();
      },
      error: (e: ApiError) => { this.busy.set(false); this.error.set(e.userMessage); }
    });
  }

  loadDeliveries() {
    this.dev.deliveries().subscribe({ next: p => this.deliveries = p.items, error: () => undefined });
  }

  redeliver(d: WebhookDelivery) {
    this.dev.redeliver(d.id).subscribe({
      next: () => { this.notice.set('Delivery retried.'); this.loadDeliveries(); },
      error: (e: ApiError) => this.error.set(e.userMessage)
    });
  }

  statusBadge(s: string) {
    const v = s.toLowerCase();
    return v === 'delivered' ? 'badge-green' : v === 'failed' ? 'badge-red' : 'badge-yellow';
  }
}
