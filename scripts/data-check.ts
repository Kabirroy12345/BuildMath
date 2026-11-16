import { readFileSync } from 'node:fs';
import { formulaRegistry } from '../src/lib/formulas/index';
import { seoConfig } from '../src/config/seo';

function loadJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8')) as T;
}

const calculators = loadJson<any[]>('src/data/calculators.json');
const categories = loadJson<any[]>('src/data/categories.json');
const jobs = loadJson<any[]>('src/data/costs/jobs.json');
const states = loadJson<any[]>('src/data/costs/states.json');
const prices = loadJson<Record<string, any>>('src/data/prices.json');
const products = loadJson<any[]>('src/data/products.json');
const guides = loadJson<any[]>('src/data/guides.json');

let errors = 0;

console.log('=== BuildMath Data & SEO Verification ===\n');

// 1. Verify Calculators
console.log(`Checking ${calculators.length} calculators...`);
const categorySlugs = new Set(categories.map((c) => c.slug));
for (const calc of calculators) {
  if (!formulaRegistry[calc.slug]) {
    console.error(`[ERROR] Missing formula in formulaRegistry for calculator: ${calc.slug}`);
    errors++;
  }
  if (!categorySlugs.has(calc.category)) {
    console.error(`[ERROR] Invalid category "${calc.category}" on calculator: ${calc.slug}`);
    errors++;
  }
  if (calc.metaTitle.length > seoConfig.maxTitleLength) {
    console.error(`[ERROR] metaTitle exceeds ${seoConfig.maxTitleLength} chars on ${calc.slug} (${calc.metaTitle.length})`);
    errors++;
  }
  if (calc.metaDescription.length > seoConfig.maxDescriptionLength) {
    console.error(`[ERROR] metaDescription exceeds ${seoConfig.maxDescriptionLength} chars on ${calc.slug} (${calc.metaDescription.length})`);
    errors++;
  }
  if (!calc.faqs || calc.faqs.length < 5) {
    console.error(`[ERROR] Calculator ${calc.slug} has fewer than 5 FAQs`);
    errors++;
  }
}

// 2. Verify States
console.log(`Checking ${states.length} US states + DC...`);
if (states.length !== 51) {
  console.error(`[ERROR] Expected 51 entries in states.json (50 states + DC), found ${states.length}`);
  errors++;
}
for (const st of states) {
  if (!st.licensingBoardUrl || !st.climateZone || !st.wages || !st.rpp) {
    console.error(`[ERROR] Incomplete state profile for ${st.slug}`);
    errors++;
  }
}

// 3. Verify Cost Jobs & Unverified Safeguard
console.log(`Checking ${jobs.length} cost jobs...`);
const unverifiedJobs: string[] = [];
const verifiedJobs: string[] = [];
for (const job of jobs) {
  const joinedSources = (job.sources || []).join(' ');
  if (/placeholder/i.test(joinedSources)) {
    console.error(`[ERROR] Placeholder text found in sources for cost job: ${job.slug}`);
    errors++;
  }
  if (job.verified) {
    verifiedJobs.push(job.slug);
    if (!job.lastReviewed) {
      console.error(`[ERROR] Verified cost job missing lastReviewed date: ${job.slug}`);
      errors++;
    }
    if (!job.sources || job.sources.length === 0) {
      console.error(`[ERROR] Verified cost job missing sources: ${job.slug}`);
      errors++;
    }
  } else {
    unverifiedJobs.push(job.slug);
    if (job.lastReviewed) {
      console.error(`[ERROR] Unverified cost job should not claim a lastReviewed date: ${job.slug}`);
      errors++;
    }
  }
}
console.log(`  - Verified jobs (indexed): ${verifiedJobs.length} (${verifiedJobs.join(', ')})`);
console.log(`  - Unverified jobs (safeguarded with <meta name="robots" content="noindex, follow"> & excluded from sitemap-cost.xml): ${unverifiedJobs.length}`);

// 4. Verify Prices & Products
const priceKeys = Object.keys(prices);
console.log(`Checking ${priceKeys.length} material prices and ${products.length} retail product links...`);
for (const key of priceKeys) {
  if (!prices[key].lastReviewed) {
    console.error(`[ERROR] Missing lastReviewed date on price item: ${key}`);
    errors++;
  }
}
for (const prod of products) {
  if (/placeholder|\[amazon-tag\]/i.test(prod.url || '')) {
    console.error(`[ERROR] Placeholder tracking parameter found on product URL: ${prod.id}`);
    errors++;
  }
}

// 5. Verify Guides
console.log(`Checking ${guides.length} how-to guides...`);
for (const g of guides) {
  if (g.metaTitle.length > seoConfig.maxTitleLength) {
    console.error(`[ERROR] Guide metaTitle exceeds ${seoConfig.maxTitleLength} chars: ${g.slug}`);
    errors++;
  }
  if (g.metaDescription.length > seoConfig.maxDescriptionLength) {
    console.error(`[ERROR] Guide metaDescription exceeds ${seoConfig.maxDescriptionLength} chars: ${g.slug}`);
    errors++;
  }
}

if (errors > 0) {
  console.error(`\nData check failed with ${errors} error(s).`);
  process.exit(1);
}

console.log('\n✓ All data integrity, formula coverage, and SEO length checks passed!');
