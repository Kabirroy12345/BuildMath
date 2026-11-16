import type { APIRoute } from 'astro';
import calculators from '../data/calculators.json';
import categories from '../data/categories.json';
import jobs from '../data/costs/jobs.json';
import { CALCULATOR_CATALOG_META } from '../lib/calculator-catalog';

export const GET: APIRoute = () => {
  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c.name]));

  const payload = [
    ...calculators.map((calc) => {
      const meta = CALCULATOR_CATALOG_META[calc.slug];
      return {
        slug: calc.slug,
        title: calc.name,
        shortTitle: calc.shortName,
        category: calc.category,
        categoryName: categoryMap[calc.category] || calc.category,
        description: meta?.summaryDesc || calc.intro,
        inputsLabel: meta?.inputsLabel || '',
        outputsLabel: meta?.outputsLabel || '',
        popularityRank: meta?.popularityRank ?? 99,
        href: `/calculators/${calc.slug}/`,
        type: 'calculator' as const,
      };
    }),
    ...jobs.map((job) => ({
      slug: job.slug,
      title: `${job.name} Cost Guide`,
      shortTitle: job.name,
      category: 'cost',
      categoryName: 'Cost Guide',
      description: `Typical national cost: $${Math.round(job.nationalTypicalPerUnit * job.typicalProjectSize).toLocaleString()} ($${job.nationalLowPerUnit}–$${job.nationalHighPerUnit}/${job.unit}).`,
      popularityRank: 100,
      href: `/cost/${job.slug}/`,
      type: 'cost' as const,
    })),
  ];

  return new Response(JSON.stringify(payload), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
