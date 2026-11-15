import { seoConfig } from '../src/config/seo';
import { siteConfig } from '../src/config/site';
import calculators from '../src/data/calculators.json';

async function runIndexNow() {
  if (!seoConfig.indexNowEnabled) {
    console.log('IndexNow ping is disabled in src/config/seo.ts (indexNowEnabled: false). Skipping.');
    return;
  }

  const urls = [
    `${siteConfig.url}/`,
    `${siteConfig.url}/calculators/`,
    ...calculators.map((c) => `${siteConfig.url}/calculators/${c.slug}/`),
  ];

  console.log(`Pinging IndexNow for ${urls.length} URLs...`);
  const res = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: siteConfig.domain,
      key: seoConfig.indexNowKey,
      urlList: urls,
    }),
  });

  console.log(`IndexNow response status: ${res.status}`);
}

runIndexNow().catch((err) => {
  console.error('IndexNow error:', err);
  process.exit(1);
});
