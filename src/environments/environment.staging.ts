export const environment = {
  envName: 'staging',
  production: false,
  apiBaseUrl: 'https://api.staging.360compliance.io/api/v1',
  kycPortalUrl: 'https://verify.staging.360compliance.io',
  /** The admin dashboard (separate app). */
  adminPortalUrl: 'https://admin.staging.360compliance.io',
  appName: '360Compliance',
  sentryDsn: '',
  features: {
    debugBanner: true,
    mockData: true
  }
};
