import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';
import categories from '../data/categories.json';
import calculators from '../data/calculators.json';

export const GET: APIRoute = () => {
  const urls: { loc: string; lastmod: string }[] = [
    {
      loc: `${siteConfig.url}/calculators/`,
      lastmod: siteConfig.lastUpdatedDefault,
    },
    ...categories.map((cat) => ({
      loc: `${siteConfig.url}/calculators/${cat.slug}/`,
      lastmod: siteConfig.lastUpdatedDefault,
    })),
    ...calculators.map((calc) => ({
      loc: `${siteConfig.url}/calculators/${calc.slug}/`,
      lastmod: calc.lastReviewed || siteConfig.lastUpdatedDefault,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
