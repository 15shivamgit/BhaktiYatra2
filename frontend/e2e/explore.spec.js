import { expect, test } from '@playwright/test';
import { contentAlert, expectNoSeriousA11yViolations } from './helpers';

const KEDARNATH = '/temples/kedarnath-temple-rudraprayag';

/** On phones the filter panel is collapsed behind a button. */
async function openFilters(page) {
  const toggle = page.getByRole('button', { name: /^Filters/ });
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
}

test.describe('temple list (J1)', () => {
  test('filters combine, live in the URL and survive a reload', async ({ page }) => {
    await page.goto('/temples');
    // 22 seeded temples, plus any the admin journey publishes while tests run in parallel.
    await expect(page.getByRole('status').filter({ hasText: /temples$/ })).toHaveText(
      /^2\d temples$/,
    );

    await openFilters(page);
    await page.getByLabel('State').selectOption('Uttarakhand');
    await expect(page).toHaveURL(/state=Uttarakhand/);
    await expect(page.getByRole('status').filter({ hasText: /temples$/ })).toHaveText('4 temples');

    await openFilters(page);
    await page.getByLabel('Deity').selectOption('Shiva');
    await expect(page).toHaveURL(/deity=Shiva/);
    const results = page.getByRole('main').getByRole('list').last();
    await expect(results.getByRole('link', { name: 'Kedarnath Temple' })).toBeVisible();
    await expect(page.getByRole('status').filter({ hasText: /temple/ })).toHaveText('1 temple');

    await page.reload();
    await expect(page.getByRole('status').filter({ hasText: /temple/ })).toHaveText('1 temple');
  });

  test('map view shows the results on a map', async ({ page }) => {
    await page.goto('/temples?circuit=char-dham&view=map');
    await expect(page.getByRole('region', { name: 'Map of temples' })).toBeVisible();
    await expect(page.locator('.leaflet-interactive')).toHaveCount(4);
  });

  test('an empty search explains what to do', async ({ page }) => {
    await page.goto('/temples?q=zzzzzz');
    // Streaming can briefly leave a hidden copy of the content; match only the visible one.
    await expect(
      page.getByRole('main').getByText('No temples match these filters.').filter({ visible: true }),
    ).toBeVisible();
  });

  test('has no serious accessibility violations and no horizontal scroll', async ({ page }) => {
    await page.goto('/temples');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('main').getByRole('article').first()).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('temple detail', () => {
  test('answers the practical questions and links related content', async ({ page }) => {
    await page.goto(KEDARNATH);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kedarnath Temple');
    await expect(page).toHaveTitle('Kedarnath Temple, Kedarnath — Timings, History & How to Reach');

    await expect(page.getByRole('heading', { name: 'Darshan timings' })).toBeVisible();
    await expect(page.getByRole('row', { name: /Morning darshan/ })).toContainText(
      '6:00 am – 3:00 pm',
    );
    await expect(page.getByRole('heading', { name: 'How to reach' })).toBeVisible();
    await expect(
      page
        .getByRole('main')
        .getByText(/Jolly Grant Airport/)
        .filter({ visible: true }),
    ).toBeVisible();

    const circuits = page.locator('#circuits');
    await expect(circuits.getByRole('link', { name: 'Char Dham (Uttarakhand)' })).toBeVisible();
    await expect(circuits.getByRole('link', { name: '12 Jyotirlingas' })).toBeVisible();

    const nearby = page.locator('#nearby');
    await expect(nearby.getByRole('link', { name: 'Badrinath Temple' })).toBeVisible();

    await page.locator('#map').scrollIntoViewIfNeeded();
    await expect(page.getByRole('region', { name: 'Map: Kedarnath Temple' })).toBeVisible();
  });

  test('ships structured data and social metadata in the HTML', async ({ request }) => {
    const html = await (await request.get(KEDARNATH)).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1]),
    );
    const place = blocks.find((b) => b['@type'] === 'HinduTemple');
    expect(place).toMatchObject({
      name: 'Kedarnath Temple',
      geo: { latitude: 30.7352, longitude: 79.0669 },
    });
    expect(place.openingHoursSpecification.length).toBeGreaterThan(0);
    expect(blocks.some((b) => b['@type'] === 'BreadcrumbList')).toBe(true);
    expect(html).toMatch(
      /<link rel="canonical" href="http:\/\/localhost:3100\/temples\/kedarnath-temple-rudraprayag"/,
    );
    expect(html).toMatch(
      /property="og:image" content="https:\/\/res\.cloudinary\.com\/[^"]+w_1200,h_630/,
    );
  });

  test('photo lightbox opens, moves between photos and closes with Escape', async ({ page }) => {
    await page.goto(KEDARNATH);
    await page.getByRole('button', { name: 'Open photo 1' }).click();
    const dialog = page.getByRole('dialog', { name: 'Photo gallery' });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText('Photo 1 of 4')).toBeVisible();
    await dialog.getByRole('button', { name: 'Next photo' }).click();
    await expect(dialog.getByText('Photo 2 of 4')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();
  });

  test('unknown temple shows the not-found page', async ({ page }) => {
    await page.goto('/temples/no-such-temple');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });

  test('has no serious accessibility violations and no horizontal scroll', async ({ page }) => {
    await page.goto(KEDARNATH);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('circuits (J2)', () => {
  test('lists circuits and shows a route in traditional order', async ({ page }) => {
    await page.goto('/circuits');
    await page.getByRole('main').getByRole('link', { name: 'Char Dham (Uttarakhand)' }).click();
    await expect(page).toHaveURL('/circuits/char-dham');
    const route = page.getByRole('list').filter({ hasText: 'Stop 1' });
    await expect(route.getByRole('heading', { level: 3 })).toHaveText([
      'Yamunotri Temple',
      'Gangotri Temple',
      'Kedarnath Temple',
      'Badrinath Temple',
    ]);
    await page.locator('[data-map-slot]').scrollIntoViewIfNeeded();
    await expect(page.locator('path.leaflet-interactive').first()).toBeAttached();
  });

  test('has no serious accessibility violations', async ({ page }) => {
    await page.goto('/circuits/12-jyotirlingas');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('12 Jyotirlingas');
    await expectNoSeriousA11yViolations(page);
  });
});

test.describe('contact and static pages', () => {
  test('contact form sends a message', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel('Your name').fill('Ramesh Kumar');
    await page.getByLabel('Email').fill('ramesh@example.com');
    await page
      .getByLabel('Message')
      .fill('We are a group of 20 from Patna planning Char Dham in May.');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Thank you. We will get back to you soon.')).toBeVisible();
  });

  test('contact form validates before sending', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByText('Enter a valid email address')).toBeVisible();
    await expect(contentAlert(page)).toHaveCount(0);
  });

  for (const [path, heading] of [
    ['/about', 'About us'],
    ['/privacy', 'Privacy policy'],
    ['/terms', 'Terms of use'],
    ['/refund-policy', 'Cancellation and refund policy'],
  ]) {
    test(`${path} renders`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(heading);
    });
  }

  test('sitemap lists temples and circuits', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('http://localhost:3100/temples/kedarnath-temple-rudraprayag');
    expect(xml).toContain('http://localhost:3100/circuits/char-dham');
    expect((xml.match(/<url>/g) ?? []).length).toBeGreaterThanOrEqual(22 + 3 + 8);
  });
});
