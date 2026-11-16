import { siteConfig } from '../../config/site';
import { buildCanonicalUrl } from './meta';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: `${siteConfig.url}/`,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteConfig.url}/calculators/?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.legalName,
    url: `${siteConfig.url}/`,
    email: siteConfig.email,
    logo: `${siteConfig.url}/favicon.svg`,
  };
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: buildCanonicalUrl(item.href),
    })),
  };
}

export function buildWebApplicationSchema(params: {
  name: string;
  description: string;
  pathname: string;
  category: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: params.name,
    description: params.description,
    url: buildCanonicalUrl(params.pathname),
    applicationCategory: 'UtilitiesApplication',
    applicationSubCategory: params.category,
    operatingSystem: 'All',
    browserRequirements: 'Requires HTML5 and JavaScript for interactive calculation',
    dateModified: params.dateModified || siteConfig.lastUpdatedDefault,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    author: {
      '@type': 'Organization',
      name: siteConfig.author.name,
      description: siteConfig.author.credentials,
    },
  };
}

export function buildFAQPageSchema(faqs: FAQItem[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

export function buildArticleSchema(params: {
  headline: string;
  description: string;
  pathname: string;
  datePublished?: string;
  dateModified?: string;
  omitDates?: boolean;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: params.headline,
    description: params.description,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': buildCanonicalUrl(params.pathname),
    },
    ...(!params.omitDates
      ? {
          datePublished: params.datePublished || siteConfig.lastUpdatedDefault,
          dateModified: params.dateModified || siteConfig.lastUpdatedDefault,
        }
      : {}),
    author: {
      '@type': 'Organization',
      name: siteConfig.author.name,
      description: siteConfig.author.credentials,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/favicon.svg`,
      },
    },
  };
}
