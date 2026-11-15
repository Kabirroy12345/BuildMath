# BuildMath (`buildmath.com`) — DIY Home-Improvement Calculator & Cost Guide Site

A fast, pre-rendered static HTML collection of **32 free DIY & residential construction calculators** plus **25 national and 1,275 state-level ("Cost to [job] in [state]") price guides** built with **Astro 5 + TypeScript + Preact Islands + Tailwind CSS**.

---

## 1. Quick Start

```bash
# Install dependencies
npm install

# Run unit tests (100 formula tests across all 32 calculators + state cost math)
npm test

# Verify data integrity, SEO title/description lengths, and unverified cost safeguards
npm run data:check

# Start local dev server (http://localhost:4321)
npm run dev

# Build static production site into dist/
npm run build

# Audit built HTML for orphan pages and broken internal links
npm run orphan:check
```

---

## 2. Architecture & Key Directories

```text
├── public/                     Static assets: robots.txt, ads.txt, llms.txt, _headers, _redirects
├── scripts/
│   ├── data-check.ts           Validates JSON datasets, formula coverage, and SEO character limits
│   ├── orphan-check.ts         Crawls built dist/ HTML to ensure 0 broken links and 0 orphan pages
│   └── indexnow.ts             IndexNow ping script for Bing/Yandex on deploy
├── src/
│   ├── components/             Preact interactive islands (CalculatorWidget, SearchBox, StateCostEstimator, ProjectListManager) & Astro components
│   ├── config/
│   │   ├── site.ts             Brand name, domain, contact email, author credentials, Web3Forms key
│   │   ├── seo.ts              Batch indexing controls (indexedStates) and IndexNow settings
│   │   └── monetization.ts     Feature flags: adsEnabled, affiliateEnabled, leadGenEnabled, cmpEnabled
│   ├── data/
│   │   ├── categories.json     8 calculator categories
│   │   ├── calculators.json    32 complete calculator configurations, fields, worked examples, tips & FAQs
│   │   ├── prices.json         National default unit prices with lastReviewed dates
│   │   ├── products.json       Affiliate product catalog routed through /go/[id]/
│   │   ├── guides.json         5 comprehensive DIY measurement how-to articles
│   │   └── costs/
│   │       ├── jobs.json       25 home improvement jobs (verified flag, laborShare, BLS SOC codes)
│   │       └── states.json     50 US states + DC (BLS trade wages, climate zones, licensing boards)
│   ├── layouts/                BaseLayout, CalculatorLayout, CostLayout, ArticleLayout
│   ├── lib/
│   │   ├── formulas/           32 pure TypeScript calculator formulas + state-cost.ts (0 DOM code)
│   │   └── seo/                JSON-LD schema builders & canonical/meta helpers
│   └── pages/                  Pre-rendered static routes, XML sitemaps, and build-time SVG OG images
└── tests/
    ├── unit/formulas.test.ts   100 Vitest unit tests covering all 32 calculators
    └── e2e/smoke.spec.ts       Playwright E2E smoke test suite
```

---

## 3. How to Add a New Calculator in 5 Steps

1. **Create the Pure Formula Module**: Add `src/lib/formulas/my-new-calculator.ts` exporting a calculation function `(input) => CalculatorOutput` and a quick-reference table function `() => QuickReferenceTable`.
2. **Register the Formula**: Import and register both functions under the slug `'my-new-calculator'` in `src/lib/formulas/index.ts`.
3. **Add Unit Tests**: Add at least 3 test cases (standard, edge, and rounding) in `tests/unit/formulas.test.ts` and run `npm test`.
4. **Add the Calculator Metadata**: Append the calculator entry (fields, `formulaText`, `workedExample`, `tips`, `faqs`, `relatedCalculators`) to `src/data/calculators.json`.
5. **Run Verification & Build**: Run `npm run data:check && npm run build && npm run orphan:check`. Astro will automatically generate `/calculators/my-new-calculator/`, its `/og/calculators-my-new-calculator.svg` social card, and include it in `/sitemap-calculators.xml`.

---

## 4. How to Verify & Index Cost Guide Pages

By default, all 25 jobs in `src/data/costs/jobs.json` are marked `"verified": false` so that no unverified cost numbers get indexed by Google:
- While `"verified": false`, `/cost/[job]/` and `/cost/[job]/[state]/` render with `<meta name="robots" content="noindex, follow">` and are excluded from `sitemap-cost.xml`.
- Once you verify a job's national cost range and state multipliers against current RSMeans / BLS OEWS data, change `"verified": true` in `src/data/costs/jobs.json` and update `"lastReviewed"`.
- In `src/config/seo.ts`, `indexedStates` controls batch rollout (starts with the 10 most populous states; add more state slugs as Search Console confirms indexing).
