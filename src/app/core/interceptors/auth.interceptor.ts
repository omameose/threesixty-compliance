import { isKycExempt } from '../guards/kyc.guard';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/**
 * Adds the access token to API calls. When the API answers 401 the token has expired: refresh it once (all parallel requests wait
 * for the same refresh), retry the request, and sign the user out if the refresh fails too.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const isApi = req.url.startsWith(environment.apiBaseUrl);
  const isAuthCall = req.url.includes('/auth/') || req.url.includes('/public/'); // public data needs no token, and the approval gate would reject it for unapproved companies
  if (!isApi || isAuthCall) return next(req);

  const withToken = (token: string | null) => (token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req);
  return next(withToken(auth.getToken())).pipe(
    catchError((err: HttpErrorResponse) => {
      // Code 35: the company is not approved yet, so send people to the verification form instead of leaving a dead screen.
      if (err.status === 403 && (err.error as { code?: string } | null)?.code === '35' && !isKycExempt(router.url)) {
        router.navigate(['/app/verification-kyc']);
      }
      if (err.status !== 401 || !auth.getRefreshToken()) return throwError(() => err);
      return auth.refreshAccessToken().pipe(
        switchMap(token => next(withToken(token))),
        catchError(refreshErr => {
          auth.forceLogout();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
