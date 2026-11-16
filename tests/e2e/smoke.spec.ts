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
  test('Homepage, Global Search Modal, and Theme Switcher work with zero console errors or overflow', async ({
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

    // Interactive 4-mode Hero Specimen Console switcher check
    await expect(page.locator('main')).toContainText('1.63 yd³');
    await page.getByRole('tab', { name: '02 Paint' }).click();
    await expect(page.locator('main')).toContainText('2 gallons');
    await page.getByRole('tab', { name: '03 Roof' }).click();
    await expect(page.locator('main')).toContainText('74 bundles');
    await page.getByRole('tab', { name: '04 Drywall' }).click();
    await expect(page.locator('main')).toContainText('16 sheets');
    await expect(page.locator('#bm-back-to-top')).toBeAttached();

    // Search suggestion dropdown test
    await page.fill('#hero-search-input', 'drywall');
    await expect(page.getByRole('listbox')).toBeVisible();
    await expect(page.getByRole('listbox')).toContainText('Drywall');

    // Global Command Search Modal test (header button + /search-index.json)
    await page.click('#global-search-open-btn');
    await expect(page.locator('#global-search-modal')).toBeVisible();
    await page.fill('#global-search-input', 'concrete slab');
    await expect(page.locator('#global-search-results')).toContainText('Concrete Slab');
    await page.click('#global-search-close-btn');
    await expect(page.locator('#global-search-modal')).toBeHidden();

    // Theme toggle switches dark class cleanly
    await page.click('#theme-toggle-btn');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.click('#theme-toggle-btn');
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    expect(errors).toEqual([]);
  });

  test('Directory search, suggestions, sorting (Popular / A-Z / Recent), 3-part cards, and 8 categories work', async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto('/calculators/');
    await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
    await expect(page.locator('h1')).toContainText('Precision Calculators');
    const hubSearch = page.locator('#hub-search-input');
    await expect(hubSearch).toBeVisible();

    // Verify 3-part card structure (Inputs / Outputs)
    await expect(page.locator('main')).toContainText('Inputs:');
    await expect(page.locator('main')).toContainText('Outputs:');

    // Verify sorting controls work
    await page.getByRole('button', { name: 'A–Z' }).click();
    await expect(page.getByRole('button', { name: 'A–Z' })).toHaveAttribute('aria-pressed', 'true');
    await page.getByRole('button', { name: 'Popular' }).click();

    // Verify suggestion click & search filter + empty state
    await page.getByRole('button', { name: 'Drywall', exact: true }).click();
    await expect(hubSearch).toHaveValue('Drywall');
    await expect(page.locator('main')).toContainText('Drywall Calculator');

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
    test.setTimeout(90000);
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

  test('Concrete Slab shows thickness upfront, editable waste input, separate bag & truck options, and workspace tabs work', async ({
    page,
  }) => {
    test.setTimeout(60000);
    // 1. Concrete Slab specific audit checks
    await page.goto('/calculators/concrete-slab-calculator/');
    await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
    await expect(page.locator('#field-lengthFeet')).toBeVisible();
    await expect(page.locator('#field-widthFeet')).toBeVisible();
    await expect(page.locator('#field-thicknessInches')).toBeVisible();
    await expect(page.locator('#field-bagSizeLbs')).toBeVisible();
    await expect(page.locator('#field-wastePercent')).toBeVisible();

    // Verify Purchasing Options comparison & clear net vs waste labels are visible
    await expect(page.locator('main')).toContainText('Material Purchasing Options');
    await expect(page.locator('main')).toContainText('Bagged Material');
    await expect(page.locator('main')).toContainText('Ready-Mix Truck');
    await expect(page.locator('main')).toContainText('Incl. 10% waste');
    await expect(page.locator('main')).toContainText('Net pre-waste base:');

    // Editable numeric waste input updates calculation live
    await page.fill('#field-wastePercent', '0');
    await expect(page.locator('main')).not.toContainText('Incl. 10% waste');

    // Save scenario for comparison & confirm Calculate records history
    await page.getByRole('button', { name: /Compare Scenario/i }).click();
    await page.getByTestId('calculate-btn').click();

    // 2. Interactive Paint Calculator: unit switch, validation, reset, My Project, Recently Used
    await page.goto('/calculators/paint-calculator/?roomLength=20&roomWidth=15');
    await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
    const resultEl = page.getByTestId('primary-result-value');
    await expect(resultEl).toBeVisible();

    await page.getByRole('button', { name: 'm / cm' }).click();
    await expect(page.locator('#field-roomLength-in')).toBeHidden();
    await expect(page.locator('#field-roomLength').locator('..')).toContainText('m');
    await page.getByRole('button', { name: 'ft / in' }).click();
    await expect(page.locator('#field-roomLength-in')).toBeVisible();

    const doorsInput = page.locator('#field-doors');
    await doorsInput.fill('-2');
    await expect(page.locator('#err-doors')).toBeVisible();

    await page.getByTestId('reset-btn').click();
    await expect(page.locator('#err-doors')).toBeHidden();

    const addBtn = page.getByTestId('add-to-project-btn');
    await addBtn.click();
    await expect(addBtn).toContainText('Saved to My Project List');

    // 3. Full Project Workspace (/my-project/) BOM, Consolidated Table, Compare & History tabs
    await page.goto('/my-project/');
    await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
    await expect(page.locator('h1')).toContainText('My Project Shopping List');
    await expect(page.locator('body')).toContainText('Interior Paint Calculator');
    await expect(page.locator('main')).toContainText('Consolidated Hardware Store Shopping List');
    await expect(page.locator('main')).toContainText('Grouped Calculations by Trade');
    await expect(page.locator('main')).toContainText('Trade Subtotal:');

    await page.getByRole('tab', { name: /Compare Scenarios/i }).click();
    await expect(page.locator('main')).toContainText('Concrete Slab Calculator');

    await page.getByRole('tab', { name: /Calculation History/i }).click();
    await expect(page.locator('main')).toContainText('Restore');

    // 4. Recently Used shelf shows on Homepage
    await page.goto('/');
    await expect(page.locator('main')).toContainText('Recently Used Instruments');
    await expect(page.locator('main')).toContainText('Interior Paint');
    await expect(page.locator('#workspace-showcase-heading')).toBeVisible();
    await expect(page.locator('main')).toContainText('LIVE BROWSER WORKSPACE');

    // Tablet viewport layout check (768x1024): zero horizontal overflow on Homepage & Workspace
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(150);
    const homeTabletOk = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(homeTabletOk).toBe(true);

    await page.goto('/my-project/');
    await expect(page.locator('astro-island').first()).not.toHaveAttribute('ssr');
    const workspaceTabletOk = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth
    );
    expect(workspaceTabletOk).toBe(true);
    await expect(page.locator('main')).toContainText('Grouped Calculations by Trade');
    await expect(page.locator('main')).toContainText('Trade Subtotal:');
  });

  test('Info, cost, and guide routes load cleanly without overflow and keep SEO noindex rules', async ({
    page,
  }) => {
    test.setTimeout(60000);
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
