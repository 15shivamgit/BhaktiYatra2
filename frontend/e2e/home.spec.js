import { expect, test } from '@playwright/test';

test.describe('Phase 1 home page', () => {
  test('renders the shell, design tokens and an API status', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Explore the sacred heart of India',
    );
    await expect(page).toHaveTitle(/BhaktiYatra/);

    // Status resolves to one of the three states whether or not the API is running.
    const status = page.locator('[role="status"][data-state]');
    await expect(status).toBeVisible({ timeout: 15_000 });
    await expect(status).toHaveAttribute('data-state', /^(ok|degraded|down)$/);

    // Design tokens are applied: page background is the warm off-white.
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).toBe('rgb(255, 252, 247)');

    // No horizontal scroll at this viewport (NFR-RESP-01).
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test('skip link moves focus to main content', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await skip.press('Enter');
    await expect(page).toHaveURL(/#main$/);
  });

  test('unknown route shows the 404 page', async ({ page }) => {
    const res = await page.goto('/this-page-does-not-exist');
    expect(res?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });

  test('robots.txt blocks crawling until Phase 3', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.ok()).toBe(true);
    expect(await res.text()).toMatch(/Disallow: \//);
  });
});
