import type { APIRoute } from 'astro';
import { siteConfig } from '../config/site';

export const GET: APIRoute = () => {
  const txt = `User-agent: *
Allow: /
Disallow: /go/
Disallow: /my-project/

Sitemap: ${siteConfig.url}/sitemap-index.xml
`;

  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
