import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { ApiCode, ApiError, ApiService } from '../http/api.service';
import { AppUser, TeamRoleLevel } from '../models/models';

const ACCESS_KEY = '360c_access_token';
const REFRESH_KEY = '360c_refresh_token';
const USER_KEY = '360c_current_user';
const PENDING_VERIFICATION_KEY = '360c_pending_verification';
const PENDING_2FA_KEY = '360c_pending_2fa';

/** What the backend returns for a signed-in user (UserProfileResponse). */
interface BackendUser {
  userId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone?: string;
  photoUrl?: string;
  roleLevel: number;
  twoFaEnabled: boolean;
  lastLoginAt?: string;
  company?: { companyId: string; name: string; approved: boolean; status: string };
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: BackendUser;
}

/** A sign-up verification code: when it stops working, and when another one may be requested. */
export interface VerificationState {
  email: string;
  expiresAt: number;
  resendAt: number;
}

export interface VerificationChallenge {
  email?: string;
  codeSent: boolean;
  resendAvailableInSeconds: number;
  expiresInMinutes: number;
}

export interface SignupResult {
  companyId: string;
  userId: string;
  email: string;
  otpExpiresInMinutes: number;
  resendAvailableInSeconds: number;
}

export interface InvitationPreview {
  email: string;
  firstName?: string;
  lastName?: string;
  roleName: string;
  companyName?: string;
  category: string;
  expiresAt: string;
}

export type LoginResult =
  | { kind: 'authenticated' }
  | { kind: '2fa'; sessionId: string; destination: string; expiresIn: number }
  | { kind: 'verify-email'; challenge: VerificationChallenge; email: string };

export interface SignupPayload {
  companyName: string;
  industry: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  country?: string;
  password: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AppUser | null>(this.readStoredUser());
  isAuthenticated = signal<boolean>(!!localStorage.getItem(ACCESS_KEY) && !!this.readStoredUser());
  private refreshing$: Observable<string> | null = null;

  constructor(private api: ApiService, private router: Router) {}

  // ---------------------------------------------------------------- sign-up and email verification

  register(payload: SignupPayload): Observable<SignupResult> {
    return this.api.post<SignupResult>('/auth/company/signup', this.clean(payload)).pipe(
      tap(res => this.rememberVerification(res.email, res.otpExpiresInMinutes, res.resendAvailableInSeconds))
    );
  }

  verifyEmail(email: string, code: string): Observable<AppUser> {
    return this.api.post<AuthResponse>('/auth/company/signup/verify-email', { email, code }).pipe(
      map(res => this.completeLogin(res)),
      tap(() => sessionStorage.removeItem(PENDING_VERIFICATION_KEY))
    );
  }

  /** Asks for a new code. The server allows one every 5 minutes and says how long is left when it is too soon. */
  resendVerification(email: string): Observable<VerificationChallenge> {
    return this.api.post<VerificationChallenge>('/auth/company/signup/resend-code', { email }).pipe(
      tap(c => this.rememberVerification(email, c.expiresInMinutes, c.resendAvailableInSeconds, c.codeSent))
    );
  }

  pendingVerification(): VerificationState | null {
    try {
      const raw = sessionStorage.getItem(PENDING_VERIFICATION_KEY);
      return raw ? (JSON.parse(raw) as VerificationState) : null;
    } catch {
      return null;
    }
  }

  private rememberVerification(email: string, expiresInMinutes: number, resendInSeconds: number, codeSent = true) {
    const previous = this.pendingVerification();
    const now = Date.now();
    const state: VerificationState = {
      email,
      // A new code restarts the 15-minute clock; if none was sent the old one keeps running.
      expiresAt: codeSent || !previous || previous.email !== email ? now + expiresInMinutes * 60_000 : previous.expiresAt,
      resendAt: now + resendInSeconds * 1000
    };
    sessionStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(state));
  }

  // ---------------------------------------------------------------- sign-in

  login(email: string, password: string): Observable<LoginResult> {
    return this.api.envelope<any>('POST', '/auth/company/signin', { email, password }).pipe(
      map((res): LoginResult => {
        if (res.code === ApiCode.TWO_FA_REQUIRED) {
          const challenge = res.data;
          sessionStorage.setItem(PENDING_2FA_KEY, JSON.stringify({ sessionId: challenge.sessionId, destination: challenge.destination, email }));
          return { kind: '2fa', sessionId: challenge.sessionId, destination: challenge.destination, expiresIn: challenge.expiresIn };
        }
        if (res.code === ApiCode.EMAIL_NOT_VERIFIED) {
          const c = res.data as VerificationChallenge;
          this.rememberVerification(email, c.expiresInMinutes, c.resendAvailableInSeconds, c.codeSent);
          return { kind: 'verify-email', challenge: c, email };
        }
        this.completeLogin(res.data as AuthResponse);
        return { kind: 'authenticated' };
      })
    );
  }

  pending2fa(): { sessionId: string; destination: string; email: string } | null {
    try {
      const raw = sessionStorage.getItem(PENDING_2FA_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  verify2fa(sessionId: string, code: string): Observable<AppUser> {
    return this.api.post<AuthResponse>('/auth/company/signin/2fa/verify', { sessionId, code }).pipe(
      map(res => this.completeLogin(res)),
      tap(() => sessionStorage.removeItem(PENDING_2FA_KEY))
    );
  }

  resend2fa(sessionId: string): Observable<{ destination: string }> {
    return this.api.post<{ destination: string }>('/auth/company/signin/2fa/resend', { sessionId });
  }

  // ---------------------------------------------------------------- password

  forgotPassword(email: string): Observable<void> {
    return this.api.post<void>('/auth/company/password/forgot', { email });
  }

  resetPassword(token: string, newPassword: string): Observable<void> {
    return this.api.post<void>('/auth/company/password/reset', { token, newPassword });
  }

  // ---------------------------------------------------------------- invitations

  previewInvitation(token: string): Observable<InvitationPreview> {
    return this.api.get<InvitationPreview>('/auth/invitations/preview', { params: { token } });
  }

  /** Accepting an invitation sets the password and signs the person in. */
  completeInvitation(token: string, password: string, firstName?: string, lastName?: string): Observable<AppUser> {
    return this.api.post<AuthResponse>('/auth/invitations/complete', this.clean({ token, password, firstName, lastName })).pipe(
      map(res => this.completeLogin(res))
    );
  }

  // ---------------------------------------------------------------- session

  /** Stores the tokens and the signed-in user, and returns the user. */
  private completeLogin(res: AuthResponse): AppUser {
    localStorage.setItem(ACCESS_KEY, res.accessToken);
    localStorage.setItem(REFRESH_KEY, res.refreshToken);
    const user = this.toAppUser(res.user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
    return user;
  }

  /** One refresh at a time: requests that fail together wait for the same new token. */
  refreshAccessToken(): Observable<string> {
    if (this.refreshing$) return this.refreshing$;
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return throwError(() => new ApiError(401, '30', 'Session expired'));
    this.refreshing$ = this.api.post<AuthResponse>('/auth/company/token/refresh', { refreshToken }).pipe(
      map(res => this.completeLogin(res) && res.accessToken),
      finalize(() => (this.refreshing$ = null)),
      shareReplay(1)
    );
    return this.refreshing$;
  }

  /** Reloads the profile (for example after the company is approved, so the token and flags are current). */
  reloadProfile(): Observable<AppUser> {
    return this.api.get<BackendUser>('/profile/me').pipe(
      map(u => {
        const user = this.toAppUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        return user;
      })
    );
  }

  /** Saves the signed-in user's own details (PUT /profile/me) and refreshes the stored copy. */
  updateProfile(fields: { firstName: string; lastName: string; phone?: string }): Observable<AppUser> {
    return this.api.put<BackendUser>('/profile/me', this.clean(fields)).pipe(
      map(u => {
        const user = this.toAppUser(u);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
        this.currentUser.set(user);
        return user;
      })
    );
  }

  logout() {
    const refreshToken = this.getRefreshToken();
    const done = () => this.forceLogout();
    if (!refreshToken) return done();
    this.api.post<void>('/auth/company/signout', { refreshToken }).pipe(catchError(() => of(null))).subscribe(done);
  }

  /** Clears the session without calling the server (it already rejected the tokens). */
  forceLogout() {
    [ACCESS_KEY, REFRESH_KEY, USER_KEY].forEach(k => localStorage.removeItem(k));
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  hasMinRole(level: number): boolean {
    return (this.currentUser()?.role ?? 0) >= level;
  }

  getToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  private toAppUser(u: BackendUser): AppUser {
    return {
      id: u.userId,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone ?? '',
      avatarUrl: u.photoUrl ?? '',
      role: Math.min(7, Math.max(1, u.roleLevel)) as TeamRoleLevel,
      twoFactorEnabled: u.twoFaEnabled,
      companyId: u.company?.companyId ?? '',
      companyName: u.company?.name,
      companyApproved: u.company?.approved ?? false,
      lastLoginAt: u.lastLoginAt ?? ''
    };
  }

  private readStoredUser(): AppUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? (JSON.parse(raw) as AppUser) : null;
    } catch {
      return null;
    }
  }

  private clean<T extends object>(payload: T): T {
    // The API treats blank optional fields as missing; send trimmed values and drop empty optionals.
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(payload)) {
      const value = typeof v === 'string' ? v.trim() : v;
      if (value !== '' && value !== undefined && value !== null) out[k] = value;
    }
    return out as T;
  }
}
