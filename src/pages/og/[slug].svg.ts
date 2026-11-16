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
  const category = escapeXml(String(props.category || 'DIY Calculator').toUpperCase());
  const subtitle = escapeXml(String(props.subtitle || '').slice(0, 88));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#242A32" stroke-width="1" />
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="#171B20" />
  <rect width="1200" height="630" fill="url(#grid)" />
  <rect x="56" y="56" width="1088" height="518" rx="14" fill="#171B20" fill-opacity="0.94" stroke="#2E3540" stroke-width="2" />
  <rect x="104" y="108" width="380" height="40" rx="6" fill="#1F262F" stroke="#4779A8" stroke-width="1.5" />
  <text x="124" y="134" font-family="ui-monospace, monospace" font-size="16" font-weight="700" fill="#6FA3D2">${category}</text>
  <text x="104" y="246" font-family="Inter, system-ui, sans-serif" font-size="48" font-weight="800" fill="#F8F8F5">${title}</text>
  <text x="104" y="324" font-family="ui-monospace, monospace" font-size="22" fill="#9CA3AF">${subtitle}</text>
  <line x1="104" y1="448" x2="1096" y2="448" stroke="#282E37" stroke-width="1.5" />
  <rect x="104" y="482" width="14" height="14" rx="2" fill="#C6F36A" />
  <text x="132" y="496" font-family="Inter, system-ui, sans-serif" font-size="24" font-weight="700" fill="#F8F8F5">${escapeXml(siteConfig.name)}</text>
  <text x="275" y="496" font-family="ui-monospace, monospace" font-size="20" fill="#747981">// ${escapeXml(siteConfig.domain)}</text>
</svg>`;

  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
  });
};
