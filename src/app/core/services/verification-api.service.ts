import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../http/api.service';
import { PageData } from './compliance-api.service';

export type VerificationType = 'BVN' | 'NIN' | 'INTERNATIONAL_PASSPORT' | 'DRIVERS_LICENCE' | 'VOTERS_CARD' | 'TIN' | 'CAC' | 'BANK_ACCOUNT' | 'PHONE_NUMBER' | 'DOCUMENT';

export interface VerificationView {
  id: string;
  type: VerificationType;
  subject: string;
  maskedNumber: string;
  /** VERIFIED, REVIEW (partial match) or FAILED. */
  status: string;
  matchScore?: number | null;
  provider: string;
  message: string;
  result?: Record<string, unknown> | null;
  submissionId?: string | null;
  createdAt: string;
}

export interface VerifyRequest {
  type: VerificationType;
  idNumber: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  extra?: Record<string, string>;
}

/** compliance-service: ID and business checks run through the third-party-service (BVN, NIN, passport, CAC, TIN, bank account...). */
@Injectable({ providedIn: 'root' })
export class VerificationApiService {
  constructor(private api: ApiService) {}

  list(size = 100): Observable<PageData<VerificationView>> {
    return this.api.get('/verifications', { params: { size } });
  }

  run(body: VerifyRequest): Observable<VerificationView> {
    return this.api.post('/verifications', body);
  }
}
