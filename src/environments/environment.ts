export const environment = {
  envName: 'development',
  production: false,
  apiBaseUrl: 'http://localhost:2394/api/v1',
  kycPortalUrl: 'https://verify.dev.360compliance.io',
  /** The admin dashboard (separate app). */
  adminPortalUrl: 'http://localhost:4300',
  appName: '360Compliance',
  sentryDsn: '',
  features: {
    debugBanner: true,
    mockData: true
  }
};
