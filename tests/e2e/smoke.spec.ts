import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

const calculators = JSON.parse(readFileSync('src/data/calculators.json', 'utf-8')) as {
  slug: string;
  name: string;
}[];
const categories = JSON.parse(readFileSync('src/data/categories.json', 'utf-8')) as {
  slug: string;
  name: string;
}[];

test.describe('BuildMath Comprehensive E2E & UI Audit Suite', () => {
  test('Homepage renders search box, categories, popular calculators, and zero console errors or overflow', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Accurate Home-Improvement Math');
    await expect(page.locator('#hero-search-input')).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);

    // Search suggestion dropdown test
    await page.fill('#hero-search-input', 'drywall');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('listbox')).toContainText('Drywall');

    // Theme toggle switches dark class cleanly
    await page.click('#theme-toggle-btn');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.click('#theme-toggle-btn');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    expect(errors).toEqual([]);
  });

  test('Directory search, category filters, and empty search state work across all 32 calculators', async ({
    page,
  }) => {
    await page.goto('/calculators/');
    await expect(page.locator('h1')).toContainText('All DIY');
    const hubSearch = page.locator('#hub-search-input');
    await expect(hubSearch).toBeVisible();

    await hubSearch.fill('roof pitch');
    await expect(page.locator('main')).toContainText('Roof Pitch');

    await hubSearch.fill('zzzz-no-match-999');
    await expect(page.locator('main')).toContainText('No calculators matched');
    await page.getByRole('button', { name: /Show All 32 Tools/i }).click();
    await expect(hubSearch).toHaveValue('');

    // Verify all 8 category pages load cleanly without overflow
    for (const cat of categories) {
      await page.goto(`/calculators/${cat.slug}/`);
      await expect(page.locator('h1')).toContainText(cat.name);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `Overflow on /calculators/${cat.slug}/`).toBe(false);
    }
  });

  test('All 32 calculators render, compute live outputs, and have zero horizontal overflow or console errors', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    for (const calc of calculators) {
      await page.goto(`/calculators/${calc.slug}/`);
      await expect(page.locator('h1')).toBeVisible();
      const resultEl = page.getByTestId('primary-result-value');
      await expect(resultEl).toBeVisible();
      const text = await resultEl.textContent();
      expect(text?.trim().length, `Empty result on ${calc.slug}`).toBeGreaterThan(0);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `Horizontal overflow on /calculators/${calc.slug}/`).toBe(false);
    }

    expect(errors).toEqual([]);
  });

  test('Calculator interactive controls: unit toggle, validation, reset, My Project persistence, and Recently Used', async ({
    page,
  }) => {
    await page.goto('/calculators/paint-calculator/?roomLength=20&roomWidth=15');
    const resultEl = page.getByTestId('primary-result-value');
    await expect(resultEl).toBeVisible();
    const initialVal = await resultEl.textContent();

    // Unit switch Metric -> Imperial hides feet/inches split and displays meters
    await page.getByRole('button', { name: 'm / cm' }).click();
    await expect(page.locator('#field-roomLength-in')).toBeHidden();
    await expect(page.locator('#field-roomLength').locator('..')).toContainText('m');
    await page.getByRole('button', { name: 'ft / in' }).click();
    await expect(page.locator('#field-roomLength-in')).toBeVisible();

    // Validation alert appears on invalid negative or over-max input
    const doorsInput = page.locator('#field-doors');
    await doorsInput.fill('-2');
    await expect(page.locator('#err-doors')).toBeVisible();

    // Reset button clears query/inputs & errors cleanly
    await page.getByTestId('reset-btn').click();
    await expect(page.locator('#err-doors')).toBeHidden();
    const resetVal = await resultEl.textContent();
    expect(resetVal).not.toBe('');
    expect(initialVal).not.toBe('');

    // Save to My Project List and confirm persistence
    const addBtn = page.getByTestId('add-to-project-btn');
    await addBtn.click();
    await expect(addBtn).toContainText('Saved to My Project List');

    await page.goto('/my-project/');
    await expect(page.locator('h1')).toContainText('My Project Shopping List');
    await expect(page.locator('body')).toContainText('Interior Paint Calculator');

    // Recently Used shelf shows Paint Calculator back on Homepage
    await page.goto('/');
    await expect(page.locator('main')).toContainText('Recently Used Instruments');
    await expect(page.locator('main')).toContainText('Interior Paint');
  });

  test('Info, cost, and guide routes load cleanly without overflow and keep SEO noindex rules', async ({
    page,
  }) => {
    const routes = [
      '/cost/',
      '/cost/roof-replacement/',
      '/cost/roof-replacement/texas/',
      '/guides/',
      '/guides/how-to-measure-a-room-for-flooring/',
      '/methodology/',
      '/about/',
      '/contact/',
    ];

    for (const r of routes) {
      await page.goto(r);
      await expect(page.locator('h1')).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth
      );
      expect(overflow, `Overflow on ${r}`).toBe(false);
    }

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
