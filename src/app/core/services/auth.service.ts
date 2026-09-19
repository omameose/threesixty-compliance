import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, delay, of, tap } from 'rxjs';
import { AppUser } from '../models/models';
import { MOCK_USER } from '../mock/org.mock';

export interface LoginResult {
  requires2fa: boolean;
  email: string;
}

const AUTH_KEY = '360c_auth_token';
const USER_KEY = '360c_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<AppUser | null>(this.readStoredUser());
  isAuthenticated = signal<boolean>(!!this.readStoredUser());

  constructor(private router: Router) {}

  private readStoredUser(): AppUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  login(email: string, password: string): Observable<LoginResult> {
    const requires2fa = MOCK_USER.twoFactorEnabled;
    return of({ requires2fa, email }).pipe(delay(700));
  }

  verify2fa(code: string): Observable<AppUser> {
    return of(MOCK_USER).pipe(
      delay(600),
      tap(user => this.completeLogin(user))
    );
  }

  completeLogin(user: AppUser = MOCK_USER) {
    localStorage.setItem(AUTH_KEY, 'mock-jwt-token-' + Date.now());
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUser.set(user);
    this.isAuthenticated.set(true);
  }

  register(payload: { companyName: string; email: string; password: string }): Observable<{ success: boolean }> {
    return of({ success: true }).pipe(delay(900));
  }

  logout() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/auth/login']);
  }

  hasMinRole(level: number): boolean {
    return (this.currentUser()?.role ?? 0) >= level;
  }

  getToken(): string | null {
    return localStorage.getItem(AUTH_KEY);
  }
}
