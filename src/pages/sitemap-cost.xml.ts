import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';
import { shouldIndexCostPage } from '../config/seo';
import jobs from '../data/costs/jobs.json';
import states from '../data/costs/states.json';

export const GET: APIRoute = () => {
  // Always include the main /cost/ hub; only include national & state cost pages when verified === true
  const urls: { loc: string; lastmod: string }[] = [
    {
      loc: `${siteConfig.url}/cost/`,
      lastmod: siteConfig.lastUpdatedDefault,
    },
  ];

  for (const job of jobs) {
    if (job.verified) {
      urls.push({
        loc: `${siteConfig.url}/cost/${job.slug}/`,
        lastmod: job.lastReviewed || siteConfig.lastUpdatedDefault,
      });

      for (const state of states) {
        if (shouldIndexCostPage(job.verified, state.slug)) {
          urls.push({
            loc: `${siteConfig.url}/cost/${job.slug}/${state.slug}/`,
            lastmod: job.lastReviewed || siteConfig.lastUpdatedDefault,
          });
        }
      }
    }
  }

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
