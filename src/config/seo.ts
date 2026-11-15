export const seoConfig = {
  indexedStates: [
    'california',
    'texas',
    'florida',
    'new-york',
    'pennsylvania',
    'illinois',
    'ohio',
    'georgia',
    'north-carolina',
    'michigan',
  ] as string[],

  maxTitleLength: 60,
  maxDescriptionLength: 155,
  defaultOgImage: '/og-default.svg',
  indexNowEnabled: false,
  indexNowKey: 'buildmath-indexnow-key-2026',
} as const;

export function shouldIndexCostPage(jobVerified: boolean, stateSlug?: string): boolean {
  if (!jobVerified) {
    return false;
  }
  if (!stateSlug) {
    return true;
  }
  return seoConfig.indexedStates.includes(stateSlug);
}
