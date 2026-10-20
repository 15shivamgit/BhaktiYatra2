import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './helpers';

test.describe('home page', () => {
  test('shows the hero, featured circuits and temples, and states', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Explore the sacred heart of India',
    );
    await expect(page).toHaveTitle(/BhaktiYatra/);

    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'Char Dham (Uttarakhand)' })).toBeVisible();
    // Up to eight featured temples, most recently published first.
    const featured = main
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Featured temples' }) });
    await expect(featured.getByRole('article')).toHaveCount(8);
    await expect(
      featured.getByRole('link', { name: 'Golden Temple (Harmandir Sahib)' }),
    ).toBeVisible();
    await expect(main.getByRole('link', { name: /Uttarakhand\s*4/ })).toBeVisible();

    // Design tokens are applied: warm off-white background.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(255, 252, 247)');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('hero search leads to matching temples', async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Search temples, cities or deities').fill('kedar');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/temples\?q=kedar/);
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Kedarnath Temple' }),
    ).toBeVisible();
  });

  test('skip link moves focus to main content', async ({ page, browserName }) => {
    await page.goto('/');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    if (browserName === 'webkit') {
      // Safari's Tab skips links unless "Press Tab to highlight each item" is turned on; check
      // that the link itself works once focused.
      await skip.focus();
    } else {
      await page.keyboard.press('Tab');
    }
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('unknown route shows the 404 page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });

  test('robots.txt allows public pages, hides private ones and links the sitemap', async ({
    request,
  }) => {
    const body = await (await request.get('/robots.txt')).text();
    expect(body).toMatch(/Allow: \//);
    expect(body).toMatch(/Disallow: \/admin/);
    expect(body).toMatch(/Disallow: \/account/);
    expect(body).toMatch(/Sitemap: http:\/\/localhost:3100\/sitemap\.xml/);
  });

  test('sends security headers and loads key pages without Content Security Policy errors', async ({
    page,
    request,
  }) => {
    const headers = (await request.get('/')).headers();
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['content-security-policy']).toContain("object-src 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['x-frame-options']).toBe('DENY');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    const blocked = [];
    page.on('console', (message) => {
      if (/Content[- ]Security[- ]Policy/i.test(message.text())) blocked.push(message.text());
    });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.goto('/temples/kedarnath-temple-rudraprayag');
    await page.locator('#map').scrollIntoViewIfNeeded();
    // Map tiles are requested (a blocked request would log a policy error above).
    await expect
      .poll(() => page.locator('.leaflet-tile').count(), { timeout: 15_000 })
      .toBeGreaterThan(0);
    await page.goto('/tours/char-dham-yatra-haridwar');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(blocked).toEqual([]);
  });

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Char Dham (Uttarakhand)' }),
    ).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });
});

test.describe('page load progress bar', () => {
  test('shows while a page loads and hides when it is ready', async ({ page }) => {
    await page.goto('/');
    const bar = page.getByTestId('route-progress');
    await expect(bar).toHaveAttribute('data-state', 'idle');
    // Record every state the bar goes through during the navigation.
    await page.evaluate(() => {
      window.__progressStates = [];
      const el = document.querySelector('[data-testid="route-progress"]');
      new MutationObserver(() => window.__progressStates.push(el.dataset.state)).observe(el, {
        attributes: true,
        attributeFilter: ['data-state'],
      });
    });
    await page.getByRole('main').getByRole('link', { name: 'View tours' }).first().click();
    await expect(page).toHaveURL('/tours');
    await expect(bar).toHaveAttribute('data-state', 'idle');
    expect(await page.evaluate(() => window.__progressStates)).toContain('loading');
  });
});
