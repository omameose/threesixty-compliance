import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../http/api.service';
import { ComplianceForm, DashboardStats, ComplianceFormStatus, ComplianceTemplateSummary, Customer, FormSection, Industry, Sector } from '../models/models';

/** Shapes returned by compliance-service for the template catalogue. */
interface TemplateSummaryDto {
  key: string; name: string; type: ComplianceTemplateSummary['type']; description: string; popular: boolean;
  fieldsCount: number; source: string; usageCount: number; updatedAt: string;
}
interface IndustryDto { key: string; name: string; description: string; active: boolean; templates: TemplateSummaryDto[]; }
interface SectorDto { key: string; name: string; icon: string; description: string; active: boolean; industries: IndustryDto[]; }
interface TemplateDetailDto extends TemplateSummaryDto {
  sectorKey: string; sectorName: string; industryKey: string; industryName: string; tags: string[]; version: number; sections: FormSection[];
}

export interface TemplateDetail {
  template: ComplianceTemplateSummary;
  sectorKey: string;
  industryKey: string;
  sections: FormSection[];
}

export interface FormSummaryDto {
  id: string; name: string; type: ComplianceForm['type']; description?: string; status: ComplianceFormStatus; position: number;
  sourceTemplateId?: string; sectionCount: number; questionCount: number; submissionsCount: number; completedCount: number;
  pendingReviewCount: number; webhookEnabled: boolean; shareStatus?: string; createdAt: string; updatedAt: string;
}

export interface LinkView {
  linkCode: string; url: string; label?: string; enabled: boolean; expiresAt?: string; maxSubmissions?: number; usesCount: number; createdAt: string;
}

/** A form with everything the builder needs; `summary.id` is the form's id. */
export interface FormDetailDto {
  summary: FormSummaryDto;
  sections: FormSection[];
  branding?: Record<string, unknown>;
  settings?: Record<string, unknown>;
  links?: LinkView[];
}

/** Paged list envelope used by the backend. */
export interface PageData<T> { items: T[]; page: number; size: number; totalItems: number; totalPages: number; }

interface CustomerItemDto {
  id: string; complianceId: string; fullName: string; email: string; phone?: string; country?: string; formId: string; formName: string;
  status: Customer['status']; riskScore?: number; riskLevel?: string; progress: number; startedAt: string; completedAt?: string;
  sanctionsHit: boolean; pepHit: boolean;
}

interface AnswerDto { questionId: string; label: string; type: Customer['answers'][number]['type']; value: unknown; fileId?: string; fileName?: string; fileSize?: string; }
interface CustomerDetailDto {
  customer: CustomerItemDto; answers: AnswerDto[]; timeline: { label: string; date: string; note?: string }[];
  moreInfo?: { message: string }; decisionReason?: string;
}

/** Answers arrive as strings, numbers, booleans or lists depending on the question; the screens show text. */
const answerText = (v: unknown): string =>
  v === null || v === undefined ? '' : Array.isArray(v) ? v.join(', ') : typeof v === 'boolean' ? (v ? 'Yes' : 'No') : typeof v === 'object' ? JSON.stringify(v) : String(v);

const day = (iso: string) => (iso ?? '').slice(0, 10);
export const toForm = (f: FormSummaryDto): ComplianceForm => ({
  id: f.id, name: f.name, type: f.type, status: f.status, sourceTemplateId: f.sourceTemplateId, sections: [], sectionCount: f.sectionCount,
  createdAt: day(f.createdAt), updatedAt: day(f.updatedAt), submissionsCount: f.submissionsCount, completedCount: f.completedCount,
  pendingReviewCount: f.pendingReviewCount, webhookEnabled: f.webhookEnabled
});

export const toCustomer = (c: CustomerItemDto): Customer => ({
  id: c.id, complianceId: c.complianceId, fullName: c.fullName, email: c.email, phone: c.phone ?? '', formId: c.formId, formName: c.formName,
  status: c.status, riskScore: c.riskScore ?? 0, riskLevel: (c.riskLevel?.toLowerCase() as Customer['riskLevel']) ?? 'low',
  startedAt: day(c.startedAt), completedAt: c.completedAt ? day(c.completedAt) : undefined, progress: c.progress, country: c.country ?? '',
  answers: [], timeline: [], sanctionsHit: c.sanctionsHit, pepHit: c.pepHit
});

const toTemplate = (t: TemplateSummaryDto): ComplianceTemplateSummary => ({
  id: t.key, name: t.name, type: t.type, description: t.description, fieldsCount: t.fieldsCount, popular: t.popular, updatedAt: day(t.updatedAt)
});

/**
 * compliance-service: the template catalogue and (added below by later screens) forms, customers and the dashboard.
 * Responses are adapted to the models the screens already use, so a screen only swaps its data source.
 */
@Injectable({ providedIn: 'root' })
export class ComplianceApiService {
  /** The whole tree, fetched once per page load and shared by the four catalogue screens. */
  private catalog$?: Observable<Sector[]>;

  constructor(private api: ApiService, private http: HttpClient) {}

  sectors(): Observable<Sector[]> {
    this.catalog$ ??= this.api.get<SectorDto[]>('/templates/catalog').pipe(
      map(list => list.filter(s => s.active).map(s => ({
        id: s.key, name: s.name, icon: s.icon, description: s.description,
        industries: s.industries.filter(i => i.active).map(i => ({ id: i.key, name: i.name, description: i.description, templates: i.templates.map(toTemplate) }))
      } as Sector))),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.catalog$;
  }

  sector(id: string): Observable<Sector | undefined> {
    return this.sectors().pipe(map(list => list.find(s => s.id === id)));
  }

  industry(sectorId: string, industryId: string): Observable<Industry | undefined> {
    return this.sector(sectorId).pipe(map(s => s?.industries.find(i => i.id === industryId)));
  }

  template(key: string): Observable<TemplateDetail> {
    return this.api.get<TemplateDetailDto>(`/templates/${key}`).pipe(
      map(t => ({ template: toTemplate(t), sectorKey: t.sectorKey, industryKey: t.industryKey, sections: t.sections }))
    );
  }

  /** Copies a template into a new editable form of the company. Returns the new form's id. */
  useTemplate(key: string, name?: string): Observable<string> {
    return this.api.post<{ summary: { id: string } }>(`/templates/${key}/use`, name ? { name } : {}).pipe(map(f => f.summary.id));
  }

  // ------------------------------------------------------------------ forms

  forms(): Observable<FormSummaryDto[]> {
    return this.api.get('/forms');
  }

  form(id: string): Observable<FormDetailDto> {
    return this.api.get(`/forms/${id}`);
  }

  createForm(body: { name: string; type: ComplianceForm['type']; description?: string; sections: FormSection[] }): Observable<FormDetailDto> {
    return this.api.post('/forms', body);
  }

  updateForm(id: string, body: { name: string; description?: string; sections: FormSection[] }): Observable<FormDetailDto> {
    return this.api.put(`/forms/${id}`, body);
  }

  setFormStatus(id: string, status: ComplianceFormStatus): Observable<FormSummaryDto> {
    return this.api.put(`/forms/${id}/status`, { status });
  }

  duplicateForm(id: string): Observable<FormDetailDto> {
    return this.api.post(`/forms/${id}/duplicate`, {});
  }

  deleteForm(id: string): Observable<{ deleted: boolean; archived: boolean; message: string }> {
    return this.api.delete(`/forms/${id}`);
  }

  /** Saves the order of one board column. */
  reorderForms(status: ComplianceFormStatus, formIds: string[]): Observable<void> {
    return this.api.put('/forms/reorder', { status, formIds });
  }

  // ------------------------------------------------------------------ compliance links

  links(formId: string): Observable<LinkView[]> {
    return this.api.get(`/forms/${formId}/links`);
  }

  createLink(formId: string, body: { label?: string; expiresAt?: string; maxSubmissions?: number }): Observable<LinkView> {
    return this.api.post(`/forms/${formId}/links`, body);
  }

  updateLink(formId: string, code: string, body: { label?: string; enabled?: boolean; expiresAt?: string; maxSubmissions?: number }): Observable<LinkView> {
    return this.api.put(`/forms/${formId}/links/${code}`, body);
  }

  // ------------------------------------------------------------------ customers

  customers(params: { formId?: string; status?: string; riskLevel?: string; q?: string; page?: number; size?: number } = {}): Observable<PageData<Customer>> {
    return this.api.get<PageData<CustomerItemDto>>('/customers', { params: { size: 200, ...params } }).pipe(
      map(p => ({ ...p, items: p.items.map(toCustomer) }))
    );
  }

  customer(id: string): Observable<Customer> {
    return this.api.get<CustomerDetailDto>(`/customers/${id}`).pipe(map(d => ({
      ...toCustomer(d.customer),
      answers: d.answers.map(a => ({ questionId: a.questionId, label: a.label, type: a.type, value: answerText(a.value), fileId: a.fileId, fileName: a.fileName, fileSize: a.fileSize })),
      timeline: d.timeline.map(t => ({ label: t.label, date: day(t.date), note: t.note })),
      decisionReason: d.decisionReason, moreInfoMessage: d.moreInfo?.message
    })));
  }

  approveCustomer(id: string): Observable<unknown> {
    return this.api.post(`/customers/${id}/approve`, {});
  }

  rejectCustomer(id: string, reason: string): Observable<unknown> {
    return this.api.post(`/customers/${id}/reject`, { reason });
  }

  requestCustomerInfo(id: string, message: string): Observable<unknown> {
    return this.api.post(`/customers/${id}/request-info`, { message });
  }

  /** Board move: `status` is approved, rejected (needs `reason`) or more_info_required (needs `message`). */
  moveCustomer(id: string, status: string, note?: string): Observable<unknown> {
    return this.api.put(`/customers/${id}/status`, status === 'rejected' ? { status, reason: note } : status === 'more_info_required' ? { status, message: note } : { status });
  }

  /** Files sit behind the login, so they are fetched with the token and saved from memory. */
  downloadCustomerFile(id: string, fileId: string): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/customers/${id}/files/${fileId}`, { responseType: 'blob' });
  }

  dashboard(): Observable<DashboardStats> {
    interface Slice { label: string; value: number; color: string }
    interface Summary extends Omit<DashboardStats, 'statusBreakdown' | 'riskBreakdown' | 'recentActivity'> {
      statusBreakdown: Slice[]; riskBreakdown: Slice[]; recentActivity: { id: string; text: string; at: string; icon: string }[];
    }
    return this.api.get<Summary>('/dashboard/summary').pipe(map(d => ({
      ...d,
      statusBreakdown: d.statusBreakdown.map(s => ({ status: s.label, value: s.value, color: s.color })),
      riskBreakdown: d.riskBreakdown.map(r => ({ level: r.label, value: r.value, color: r.color })),
      recentActivity: d.recentActivity.map(a => ({ id: a.id, text: a.text, time: new Date(a.at).toLocaleString(), icon: a.icon }))
    })));
  }

  /** Forget the cached catalogue (after the company shares a form, for instance). */
  refreshCatalog() {
    this.catalog$ = undefined;
  }
}
