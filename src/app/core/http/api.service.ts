import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

/** Every backend response uses this envelope. */
export interface ApiEnvelope<T> {
  code: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'REQUIRES_ACTION';
  message: string;
  details?: string;
  data?: T;
  timestamp?: string;
  traceId?: string;
}

/** Business codes the UI reacts to. */
export const ApiCode = {
  TWO_FA_REQUIRED: '34',
  KYC_REQUIRED: '35',
  SUBSCRIPTION_REQUIRED: '36',
  EMAIL_NOT_VERIFIED: '37'
} as const;

/** A failed request, with the fields a screen needs to show a helpful message. */
export class ApiError extends Error {
  constructor(
    public httpStatus: number,
    public code: string,
    message: string,
    public details?: string,
    public traceId?: string,
    public retryAfterSeconds?: number
  ) {
    super(message);
  }

  /** The most specific text to show a person. */
  get userMessage(): string {
    return this.details || this.message || 'Something went wrong. Please try again.';
  }
}

export interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined | null>;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /** Returns the whole envelope (needed where the business code matters, e.g. sign-in). */
  envelope<T>(method: string, path: string, body?: unknown, options: RequestOptions = {}): Observable<ApiEnvelope<T>> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(options.params ?? {})) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http
      .request<ApiEnvelope<T>>(method, this.base + path, {
        body,
        params,
        headers: new HttpHeaders(options.headers ?? {})
      })
      .pipe(catchError(err => throwError(() => this.toApiError(err))));
  }

  get<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.envelope<T>('GET', path, undefined, options).pipe(map(r => r.data as T));
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.envelope<T>('POST', path, body ?? {}, options).pipe(map(r => r.data as T));
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.envelope<T>('PUT', path, body ?? {}, options).pipe(map(r => r.data as T));
  }

  /** Multipart upload (documents, logos). The browser sets the boundary, so no Content-Type header is added. */
  upload<T>(path: string, form: FormData, options: RequestOptions = {}): Observable<T> {
    let params = new HttpParams();
    for (const [k, v] of Object.entries(options.params ?? {})) {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    }
    return this.http
      .post<ApiEnvelope<T>>(this.base + path, form, { params })
      .pipe(
        map(r => r.data as T),
        catchError(err => throwError(() => this.toApiError(err)))
      );
  }

  delete<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.envelope<T>('DELETE', path, undefined, options).pipe(map(r => r.data as T));
  }

  private toApiError(err: unknown): ApiError {
    if (err instanceof ApiError) return err;
    const e = err as HttpErrorResponse;
    if (e.status === 0) {
      return new ApiError(0, 'NETWORK', 'Cannot reach the server', 'We could not reach the server. Check your connection and try again.');
    }
    const body = e.error as Partial<ApiEnvelope<unknown>> | null;
    const retry = Number(e.headers?.get('Retry-After'));
    return new ApiError(e.status, body?.code ?? String(e.status), body?.message ?? e.statusText, body?.details, body?.traceId,
      Number.isFinite(retry) && retry > 0 ? retry : undefined);
  }
}
