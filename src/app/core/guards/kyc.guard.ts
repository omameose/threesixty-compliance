import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Pages a company can use before its verification (KYC) is approved: the verification form itself, the person's own profile,
 * company settings (including password and two-factor), the team, and the subscription page (the billing service lets a company choose a plan before it is approved). Everything else offers the platform's services and waits for approval.
 * Keep this list in step with `approval-exempt-paths` in the backend services.
 */
export const KYC_EXEMPT_PREFIXES = ['/app/verification-kyc', '/app/profile', '/app/settings', '/app/teams', '/app/subscription'];

export const isKycExempt = (url: string): boolean =>
  KYC_EXEMPT_PREFIXES.some(p => url === p || url.startsWith(p + '/') || url.startsWith(p + '?') || url.startsWith(p + '#'));

/**
 * Sends a company that is not approved to the verification form from every service page. If the locally stored flag says "not
 * approved" it asks the server once first (the company may have been approved since the person signed in) and, when it has been,
 * renews the access token so the backend agrees too.
 */
export const kycGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (isKycExempt(state.url) || auth.currentUser()?.companyApproved) return true;
  const toKyc = router.parseUrl('/app/verification-kyc');
  return auth.reloadProfile().pipe(
    switchMap(user => (user.companyApproved ? auth.refreshAccessToken().pipe(map(() => true)) : of(toKyc))),
    catchError(() => of(toKyc))
  );
};
