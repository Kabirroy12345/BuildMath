import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';
import guides from '../data/guides.json';

export const GET: APIRoute = () => {
  const urls = [
    {
      loc: `${siteConfig.url}/guides/`,
      lastmod: siteConfig.lastUpdatedDefault,
    },
    ...guides.map((g) => ({
      loc: `${siteConfig.url}/guides/${g.slug}/`,
      lastmod: g.lastReviewed || siteConfig.lastUpdatedDefault,
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
