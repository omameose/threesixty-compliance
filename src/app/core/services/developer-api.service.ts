import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { PageData } from './compliance-api.service';

export interface WebhookConfigView {
  url?: string; enabled: boolean; encryptPayload: boolean; events: string[]; signingSecretMasked?: string; encryptionKeyMasked?: string;
  availableEvents: string[]; updatedAt?: string;
}
/** Returned when a secret is created or rotated: the only time the full value is ever sent. */
export interface WebhookSecrets { config: WebhookConfigView; signingSecret?: string; encryptionKey?: string; }
export interface WebhookDelivery {
  id: string; event: string; url: string; status: string; attempts: number; statusCode?: number; responseBody?: string; lastError?: string;
  nextAttemptAt?: string; deliveredAt?: string; createdAt: string;
}
export interface ApiKeyView { id: string; environment: 'test' | 'live'; publicKey: string; secretKeyMasked: string; revoked: boolean; createdAt: string; lastUsed?: string; }
export interface NewApiKey { key: ApiKeyView; secretKey: string; }

/** compliance-service developer tools (Super Admin only): webhook endpoint, delivery log and API keys. */
@Injectable({ providedIn: 'root' })
export class DeveloperApiService {
  constructor(private api: ApiService) {}

  webhook(): Observable<WebhookConfigView> {
    return this.api.get('/developer/webhooks');
  }
  saveWebhook(body: { url?: string; enabled?: boolean; encryptPayload?: boolean; events?: string[] }): Observable<WebhookSecrets> {
    return this.api.put('/developer/webhooks', body);
  }
  rotateSecret(): Observable<WebhookSecrets> {
    return this.api.post('/developer/webhooks/rotate-secret');
  }
  rotateEncryptionKey(): Observable<WebhookSecrets> {
    return this.api.post('/developer/webhooks/rotate-encryption-key');
  }
  testWebhook(): Observable<WebhookDelivery> {
    return this.api.post('/developer/webhooks/test');
  }
  deliveries(page = 0, size = 20): Observable<PageData<WebhookDelivery>> {
    return this.api.get('/developer/webhooks/deliveries', { params: { page, size } });
  }
  redeliver(id: string): Observable<WebhookDelivery> {
    return this.api.post(`/developer/webhooks/deliveries/${id}/redeliver`);
  }
  keys(): Observable<ApiKeyView[]> {
    return this.api.get('/developer/api-keys');
  }
  regenerateKey(env: 'test' | 'live'): Observable<NewApiKey> {
    return this.api.post(`/developer/api-keys/${env}/regenerate`);
  }
}
