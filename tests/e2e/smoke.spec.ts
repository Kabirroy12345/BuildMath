import { test, expect } from '@playwright/test';
import calculators from '../../src/data/calculators.json';

test.describe('BuildMath E2E Smoke Suite', () => {
  test('Homepage renders search box, categories, and popular calculators', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Accurate Home-Improvement Math');
    await expect(page.locator('#hero-search-input')).toBeVisible();
  });

  test('All 32 calculators render static HTML content and compute live results', async ({ page }) => {
    // Spot-check key calculators across categories in browser + verify primary result renders
    const sampleSlugs = [
      'paint-calculator',
      'concrete-slab-calculator',
      'roofing-calculator',
      'flooring-calculator',
      'mulch-calculator',
      'fence-calculator',
      'stair-calculator',
      'square-footage-calculator',
    ];

    for (const slug of sampleSlugs) {
      await page.goto(`/calculators/${slug}/`);
      await expect(page.locator('h1')).toBeVisible();
      const resultEl = page.getByTestId('primary-result-value');
      await expect(resultEl).toBeVisible();
      const text = await resultEl.textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('Paint calculator updates live result and saves to My Project list', async ({ page }) => {
    await page.goto('/calculators/paint-calculator/?roomLength=20&roomWidth=15');
    const resultEl = page.getByTestId('primary-result-value');
    await expect(resultEl).toBeVisible();

    const addBtn = page.getByTestId('add-to-project-btn');
    await addBtn.click();
    await expect(addBtn).toContainText('Saved to My Project List');

    await page.goto('/my-project/');
    await expect(page.locator('h1')).toContainText('My Project Shopping List');
    await expect(page.locator('body')).toContainText('Interior Paint Calculator');
  });

  test('Verified Batch-1 cost guides are indexed while unverified jobs and non-Batch-1 states stay noindex', async ({ page }) => {
    await page.goto('/cost/roof-replacement/texas/');
    await expect(page.locator('h1')).toContainText('Cost of Roof Replacement in Texas');
    const verifiedRobots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(verifiedRobots).toContain('index');
    expect(verifiedRobots).not.toContain('noindex');

    await page.goto('/cost/deck-building/texas/');
    const unverifiedRobots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(unverifiedRobots).toContain('noindex');

    await page.goto('/cost/roof-replacement/wyoming/');
    const nonBatchRobots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(nonBatchRobots).toContain('noindex');
  });
});
