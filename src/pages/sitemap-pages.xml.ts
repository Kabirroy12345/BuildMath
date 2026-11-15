import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';

export const GET: APIRoute = () => {
  const staticPaths = [
    '/',
    '/about/',
    '/contact/',
    '/methodology/',
    '/privacy-policy/',
    '/cookie-policy/',
    '/terms/',
    '/disclaimer/',
    '/affiliate-disclosure/',
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPaths
  .map(
    (p) => `  <url>
    <loc>${siteConfig.url}${p}</loc>
    <lastmod>${siteConfig.lastUpdatedDefault}</lastmod>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
