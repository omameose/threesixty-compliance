import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiService } from '../http/api.service';

export type KycStatus = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'MORE_INFO_REQUIRED' | 'APPROVED' | 'REJECTED';

export interface KycStep {
  number: number;
  step: string;
  label: string;
  completed: boolean;
  current: boolean;
}

export interface KycDocument {
  documentId: string;
  documentType: string;
  documentTypeLabel: string;
  description?: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  status: string;
  reviewerComment?: string;
  uploadedAt: string;
}

export interface KycInfoRequest {
  requestId: string;
  message: string;
  items?: string[];
  deadline?: string;
  status: string;
  requestedAt: string;
}

export interface KycRequiredDocument {
  documentType: string;
  label: string;
  satisfied: boolean;
}

/** The company's own view of its verification record. `sections` holds what was saved for each step, keyed as below. */
export interface KycRecord {
  kycId: string;
  status: KycStatus;
  currentStep: string;
  progressPercentage: number;
  editable: boolean;
  submissionCount: number;
  submittedAt?: string;
  decidedAt?: string;
  decisionReason?: string;
  sections: Record<string, any>;
  documents: KycDocument[];
  infoRequests: KycInfoRequest[];
  timeline: { type: string; message: string; at: string }[];
  requiredDocuments: KycRequiredDocument[];
  steps: KycStep[];
}

export interface KycProgress {
  status: KycStatus;
  progressPercentage: number;
  editable: boolean;
  steps: KycStep[];
  requiredDocuments: KycRequiredDocument[];
  openInfoRequest?: KycInfoRequest | null;
}

export interface StepSaveResult {
  step: number;
  submitted: boolean;
  progress: KycProgress;
}

export interface KycOptions {
  businessTypes: string[];
  licenceTypes: string[];
  licenceCategories: string[];
  industrySectors: string[];
  countryCounts: string[];
  transactionCountRanges: string[];
  paymentForms: string[];
  foreignLicencePresence: string[];
  customerRegistrationMethods: string[];
  documentTypes: { value: string; label: string }[];
}

/** Section name in `KycRecord.sections` for each step number. */
export const STEP_SECTION: Record<number, string> = {
  1: 'companyDetails', 2: 'directors', 3: 'shareholders', 4: 'ubos', 5: 'contactDetails', 6: 'amlQuestionnaire',
  7: 'amlRegulatoryAction', 8: 'amlAdditionalQuestions', 9: 'businessOperations', 10: 'documentsConfirmation', 11: 'declaration'
};

/** company-service: the 11-step KYC/KYB verification a company completes before it is approved. */
@Injectable({ providedIn: 'root' })
export class KycApiService {
  constructor(private api: ApiService, private http: HttpClient) {}

  record(): Observable<KycRecord> {
    return this.api.get('/company/kyc');
  }
  progress(): Observable<KycProgress> {
    return this.api.get('/company/kyc/progress');
  }
  options(): Observable<KycOptions> {
    return this.api.get('/company/kyc/options');
  }
  saveStep(step: number, body: unknown): Observable<StepSaveResult> {
    return this.api.put(`/company/kyc/steps/${step}`, body);
  }
  resubmit(note?: string): Observable<KycProgress> {
    return this.api.post('/company/kyc/resubmit', note ? { note } : {});
  }
  documents(): Observable<KycDocument[]> {
    return this.api.get('/company/kyc/documents');
  }
  upload(file: File, documentType: string, description?: string): Observable<KycDocument> {
    const form = new FormData();
    form.append('file', file);
    return this.api.upload('/company/kyc/documents', form, { params: { documentType, description } });
  }
  /** The file itself (not JSON), so it bypasses the envelope handling. */
  download(id: string): Observable<Blob> {
    return this.http.get(`${environment.apiBaseUrl}/company/kyc/documents/${id}/download`, { responseType: 'blob' });
  }
  deleteDocument(id: string): Observable<void> {
    return this.api.delete(`/company/kyc/documents/${id}`);
  }
}
