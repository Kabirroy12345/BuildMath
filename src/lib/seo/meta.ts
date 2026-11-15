import { siteConfig } from '../../config/site';
import { seoConfig } from '../../config/seo';

export interface PageMetaInput {
  title: string;
  description: string;
  pathname: string;
  noindex?: boolean;
  ogType?: 'website' | 'article';
  ogImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export function ensureTrailingSlash(pathname: string): string {
  if (!pathname) return '/';
  const [path, query] = pathname.split('?');
  if (path.endsWith('/') || /\.[a-zA-Z0-9]+$/.test(path)) {
    return query ? `${path}?${query}` : path;
  }
  const normalized = `${path}/`;
  return query ? `${normalized}?${query}` : normalized;
}

export function buildCanonicalUrl(pathname: string): string {
  const cleanPath = ensureTrailingSlash(pathname.split('?')[0]);
  return `${siteConfig.url}${cleanPath}`;
}

export function clampTitle(title: string): string {
  if (title.length <= seoConfig.maxTitleLength) return title;
  return `${title.slice(0, seoConfig.maxTitleLength - 3).trim()}...`;
}

export function clampDescription(description: string): string {
  if (description.length <= seoConfig.maxDescriptionLength) return description;
  return `${description.slice(0, seoConfig.maxDescriptionLength - 3).trim()}...`;
}

export function buildPageMeta(input: PageMetaInput) {
  const canonicalUrl = buildCanonicalUrl(input.pathname);
  const title = clampTitle(input.title);
  const description = clampDescription(input.description);
  const robots = input.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const ogImage = input.ogImage
    ? (input.ogImage.startsWith('http') ? input.ogImage : `${siteConfig.url}${input.ogImage}`)
    : `${siteConfig.url}${seoConfig.defaultOgImage}`;

  return {
    title,
    description,
    canonicalUrl,
    robots,
    ogType: input.ogType || 'website',
    ogImage,
    publishedTime: input.publishedTime,
    modifiedTime: input.modifiedTime || siteConfig.lastUpdatedDefault,
  };
}
