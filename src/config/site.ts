const envSiteUrl =
  typeof import.meta !== 'undefined' && import.meta.env?.PUBLIC_SITE_URL
    ? String(import.meta.env.PUBLIC_SITE_URL).replace(/\/$/, '')
    : 'https://buildmath.com';

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
    'Fast, trade-verified DIY home-improvement material calculators and localized US construction cost guides. Get exact quantities and cost ranges in under 10 seconds.',
  domain: envDomain,
  url: envSiteUrl,
  locale: 'en-US',
  repoName: 'BuildMath',
  githubRepoUrl: 'https://github.com/Kabirroy12345/BuildMath',
  email: 'hello@buildmath.com',
  contactEmail: 'hello@buildmath.com',
  web3FormsAccessKey: envWeb3FormsKey,
  author: {
    name: 'Alex Rivera',
    role: 'Licensed General Contractor & Residential Estimator',
    experienceYears: 18,
    credentials: '18+ Years Residential Remodeling & Material Takeoff Experience (ACI, NRCA, NWFA, IRC)',
    bio: 'Alex Rivera is a residential general contractor and construction estimator who has managed over 300 home remodeling, concrete, roofing, and flooring projects across the United States. Every BuildMath formula is verified against manufacturer technical data sheets, IRC building codes, and real job-site waste factors.',
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
