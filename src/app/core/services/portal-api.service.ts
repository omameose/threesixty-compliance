import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { FormSection } from '../models/models';

export interface PortalBranding {
  displayName?: string; tagline?: string; logoUrl?: string; backgroundUrl?: string; primaryColor?: string; secondaryColor?: string;
  backgroundColor?: string; textColor?: string; fontFamily?: string; buttonStyle?: string; welcomeTitle?: string; welcomeMessage?: string;
  completionMessage?: string; footerText?: string; supportEmail?: string; showProgressBar?: boolean; logoAlignment?: string;
}

/** A question as the customer's browser receives it: the builder's fields plus conditional visibility and checks. */
export interface PortalQuestion {
  id: string; type: string; label: string; placeholder?: string; helpText?: string; required: boolean;
  options?: { id: string; label: string }[]; acceptedFileTypes?: string; maxFileSizeMb?: number;
  visibleWhen?: { questionId: string; equals: string }; verification?: { type: string };
}

export interface PortalSection { id: string; title: string; description?: string; questions: PortalQuestion[]; }

export interface PortalForm {
  linkCode: string; name: string; type: string; description?: string; companyName: string; branding: PortalBranding;
  settings: { requireEmailVerification: boolean; allowSaveAndResume: boolean; consentText?: string };
  sections: PortalSection[]; poweredBy?: { text: string; url?: string };
}

export interface PortalFile { fileId: string; questionId: string; fileName: string; sizeBytes: number; }

export interface PortalSubmission {
  submissionId: string; status: string; progress: number; answers: Record<string, unknown>; files: PortalFile[];
  moreInfo?: { message: string; questionIds?: string[] }; customer?: { fullName: string; email: string }; editable: boolean;
  submittedAt?: string; decisionReason?: string;
}

export interface PortalSession { token: string; expiresAt: string; submission: PortalSubmission; }
export interface StartResponse { otpRequired: boolean; message: string; session?: PortalSession; }

/** The customer-facing verification portal. No login: the link code plus a per-customer session token are the credentials. */
@Injectable({ providedIn: 'root' })
export class PortalApiService {
  constructor(private api: ApiService) {}

  private tok = (token: string) => ({ 'X-Submission-Token': token });

  form(code: string): Observable<PortalForm> {
    return this.api.get(`/public/kyc/${code}`);
  }
  start(code: string, body: { fullName: string; email: string; phone?: string; country?: string }): Observable<StartResponse> {
    return this.api.post(`/public/kyc/${code}/start`, body);
  }
  verifyOtp(code: string, email: string, otp: string): Observable<PortalSession> {
    return this.api.post(`/public/kyc/${code}/verify-otp`, { email, code: otp });
  }
  submission(code: string, token: string): Observable<PortalSubmission> {
    return this.api.get(`/public/kyc/${code}/submission`, { headers: this.tok(token) });
  }
  saveAnswers(code: string, token: string, answers: Record<string, unknown>): Observable<{ submission: PortalSubmission; errors: Record<string, string> }> {
    return this.api.put(`/public/kyc/${code}/answers`, { answers }, { headers: this.tok(token) });
  }
  uploadFile(code: string, token: string, questionId: string, file: File): Observable<PortalFile> {
    const form = new FormData();
    form.append('file', file);
    return this.api.upload(`/public/kyc/${code}/files`, form, { params: { questionId }, headers: this.tok(token) });
  }
  deleteFile(code: string, token: string, fileId: string): Observable<unknown> {
    return this.api.delete(`/public/kyc/${code}/files/${fileId}`, { headers: this.tok(token) });
  }
  verifyId(code: string, token: string, questionId: string): Observable<{ status: string; matchScore?: number; message: string }> {
    return this.api.post(`/public/kyc/${code}/verify-id`, { questionId }, { headers: this.tok(token) });
  }
  submit(code: string, token: string): Observable<{ submission: PortalSubmission; completionMessage: string }> {
    return this.api.post(`/public/kyc/${code}/submit`, {}, { headers: this.tok(token) });
  }
}

export type { FormSection };
