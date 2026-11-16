const envSiteUrl =
  typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SITE_URL
    ? String(import.meta.env.PUBLIC_SITE_URL).replace(/\/$/, '')
    : 'https://buildmath.kabir-23bce10815.workers.dev';

const envDomain = envSiteUrl.replace(/^https?:\/\//, '');

const envWeb3FormsKey =
  typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_WEB3FORMS_KEY
    ? String(import.meta.env.PUBLIC_WEB3FORMS_KEY)
    : '933d47c2-bc8e-48d3-aeb0-c86f522ebe5c';

export const siteConfig = {
  name: 'BuildMath',
  legalName: 'BuildMath Media',
  tagline: 'Free DIY & Home-Improvement Calculators for US Homeowners',
  description:
    'Fast, source-cited DIY home-improvement material calculators and localized US construction cost guides. Get exact quantities and cost ranges in under 10 seconds.',
  domain: envDomain,
  url: envSiteUrl,
  locale: 'en-US',
  repoName: 'BuildMath',
  githubRepoUrl: 'https://github.com/Kabirroy12345/BuildMath',
  email: 'hello@buildmath.com',
  contactEmail: 'hello@buildmath.com',
  web3FormsAccessKey: envWeb3FormsKey,
  author: {
    name: 'BuildMath Editorial',
    role: 'Source-Cited Material & Cost Estimation',
    credentials: 'Formulas cite ACI 318, ARMA, NRCA, NWFA, TCNA, USG Handbook & 2024 IRC published specifications',
    bio: 'BuildMath calculators and cost guides are derived from published manufacturer technical data sheets, 2024 International Residential Code (IRC) tables, retail packaging specs, and US Bureau of Labor Statistics (BLS OEWS) occupational wage datasets. Every default coverage rate and waste factor is visible and editable by the user.',
  },
  lastReviewedMonthYear: 'November 2026',
  defaultLastReviewed: '2026-11-15',
  lastUpdatedDefault: '2026-11-15',
  verification: {
    googleSearchConsole: 'GOOGLE_SEARCH_CONSOLE_VERIFICATION_TOKEN',
    bingWebmaster: 'BING_WEBMASTER_VERIFICATION_TOKEN',
    indexNowKey: 'buildmath-indexnow-key-2026',
  },
  analytics: {
    cloudflareBeaconToken: '',
    plausibleDomain: '',
    ga4MeasurementId: '',
  },
} as const;

export type SiteConfig = typeof siteConfig;
