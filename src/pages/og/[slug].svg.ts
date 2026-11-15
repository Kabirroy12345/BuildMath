import type { APIRoute, GetStaticPaths } from 'astro';
import { siteConfig } from '../../config/site';
import calculators from '../../data/calculators.json';
import categories from '../../data/categories.json';

const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

export const getStaticPaths: GetStaticPaths = () => {
  return calculators.map((calc) => ({
    params: { slug: `calculators-${calc.slug}` },
    props: {
      title: calc.name,
      category: categoryMap[calc.category] || 'DIY Calculator',
      subtitle: calc.howToCalculate?.formula || calc.intro,
    },
  }));
};

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = ({ props }) => {
  const title = escapeXml(String(props.title || siteConfig.name));
  const category = escapeXml(String(props.category || 'DIY Calculator'));
  const subtitle = escapeXml(String(props.subtitle || '').slice(0, 90));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#082f49" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect x="60" y="60" width="1080" height="510" rx="24" fill="#1e293b" stroke="#0284c7" stroke-width="3" />
  <rect x="100" y="105" width="260" height="44" rx="8" fill="#0284c7" />
  <text x="230" y="134" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">${category}</text>
  <text x="100" y="250" font-family="system-ui, sans-serif" font-size="52" font-weight="800" fill="#ffffff">${title}</text>
  <text x="100" y="330" font-family="monospace" font-size="24" fill="#38bdf8">${subtitle}</text>
  <text x="100" y="495" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#f59e0b">${siteConfig.name} • ${siteConfig.domain}</text>
</svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
