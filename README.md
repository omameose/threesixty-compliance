# 360Compliance — Compliance Verification Platform (Angular)

A production-grade, mobile-responsive Angular 17 application for **360Compliance**, a KYC/KYB/AML compliance-as-a-service platform. This build is fully wired with realistic mock/dummy data so every screen is explorable end-to-end; wire up the real backend endpoints in `src/app/core/services/*.ts` when ready.

## What's included

- **Public marketing site** — landing page with services, pricing teaser, how-it-works.
- **Auth** — Login, Register (2-step), Forgot Password, and email-based 2FA verification screen.
- **Dashboard** — stats, charts (Chart.js via ng2-charts), recent activity.
- **Compliance Templates** — Sector → Industry → Template drill-down (Finance, Education, Health, HR, Agriculture, Real Estate, Logistics, E-commerce, and more) with a live preview and "Use Template" flow.
- **Compliance Form Builder** — Google-Forms-style canvas: sections, 14 question types (text, dropdown, radio, checkboxes, file upload, ID document, signature, address, etc.), required toggles, live preview, draft/publish.
- **My Compliance** — list of created forms (draft/live/archived), submissions table per form, KYC/KYB link generator.
- **My Clients** — global customer list across all forms with filters (status, form, risk, search) and a full submission review screen (approve / reject / request more info, with simulated webhook + email notices).
- **Verification Tools** — Sanctions Screening, PEP Screening, ID Verification, Business Verification, Document Verification, Risk Scoring, Customer Due Diligence, Ongoing Monitoring.
- **Developer Console** — API key pairs (test/live) with regenerate, webhook URL/signing secret/encryption key configuration, subscribed events, webhook delivery logs.
- **Teams** — invite members, 7-level role system (1 = Viewer … 7 = Super Admin).
- **Subscription** — Free / Basic / Standard / Enterprise plans, usage meter, billing history, change/cancel plan.
- **Settings** — company branding (name, logo, brand color) that flows through to the customer-facing KYC form, security (2FA toggle, password), notification preferences.
- **Profile** — personal account details.
- **Public KYC/KYB Portal** (`/verify/:formId?cid=...`) — the link your customers receive: branded with your company logo/name, a compliance-ID + email + password gate, then a multi-step wizard rendering whatever form you built, ending in a submission confirmation.

## Getting started

```bash
npm install
npm start                # serves on http://localhost:4200 using the "development" environment
```

Demo login: any password works. The email field is pre-filled. 2FA is mocked — enter any 6 digits.

## Environments

Three environments are wired via Angular file replacements:

| Environment | File                              | Command                    |
|-------------|------------------------------------|-----------------------------|
| Development | `src/environments/environment.ts`         | `npm start` / `npm run build:dev` |
| Staging     | `src/environments/environment.staging.ts` | `npm run start:staging` / `npm run build:staging` |
| Production  | `src/environments/environment.prod.ts`    | `npm run start:prod` / `npm run build:prod` |

Each environment file exposes `apiBaseUrl`, `kycPortalUrl`, feature flags, etc. Point `apiBaseUrl` at your real backend per environment.

## Wiring up your real backend

All mock data and simulated network calls live in:

- `src/app/core/mock/*.ts` — dummy data (sectors/templates, forms, customers, org/team/plans/dev console).
- `src/app/core/services/data.service.ts` — replace the bodies of these methods with real `HttpClient` calls to `environment.apiBaseUrl`. The method names/signatures are already shaped like a real API (`getForms`, `saveForm`, `getCustomer`, `updateCustomerStatus`, `generateComplianceLink`, `getApiKeys`, `getWebhookConfig`, etc.) so most components won't need to change.
- `src/app/core/services/auth.service.ts` — replace mock `login`/`verify2fa`/`register` with real endpoints; keep the same `Observable` return shapes to avoid touching components.

## Notable architectural choices

- **Standalone components** throughout (no NgModules), lazy-loaded per route for a lean initial bundle.
- **Signals** for local reactive state (sidebar collapse, modals, in-memory "database" in `DataService`).
- Global design system in `src/styles.scss` (`.btn-primary`, `.card`, `.badge-*`, `.input`, etc.) built on Tailwind CSS, using the green/white palette from the reference designs (`brand-*` scale in `tailwind.config.js`).
- A single reusable `<app-icon name="...">` component (no external icon package) covering every icon used in the app.
- Company branding (logo/name/brand color) set in **Settings → Company Profile** is read by the public KYC portal (`kyc-portal.component.ts`) so every customer-facing form is white-labeled per client.

## Project structure

```
src/app/
  core/
    models/        // shared TypeScript interfaces
    mock/           // dummy data sets
    services/       // AuthService, DataService
    guards/         // authGuard, guestGuard
  shared/
    components/     // Icon, StatCard, Modal, PageHeader, EmptyState, Avatar
  features/
    landing/
    auth/           // login, register, forgot-password, verify-2fa, shared shell
    dashboard-layout/  // sidebar + topbar shell
    dashboard-home/
    templates/      // sector-list, industry-list, template-list, template-preview
    form-builder/
    my-compliance/  // list, detail (submissions)
    my-clients/     // list, customer-detail (review)
    tools/          // single adaptive tool-page component, config-driven
    developer-console/
    teams/
    subscription/
    settings/
    profile/
    kyc-portal/     // public customer-facing verification flow
```

## Build for production

```bash
npm run build:prod
```

Output goes to `dist/threesixty-compliance/browser`, ready to deploy to any static host / CDN behind your API gateway.
