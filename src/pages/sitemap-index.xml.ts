import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';

export const GET: APIRoute = () => {
  const sitemaps = [
    'sitemap-calculators.xml',
    'sitemap-cost.xml',
    'sitemap-guides.xml',
    'sitemap-pages.xml',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps
  .map(
    (sm) => `  <sitemap>
    <loc>${siteConfig.url}/${sm}</loc>
    <lastmod>${siteConfig.lastUpdatedDefault}</lastmod>
  </sitemap>`
  )
  .join('\n')}
</sitemapindex>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
