import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yViolations } from './helpers';

const CHAR_DHAM = '/tours/char-dham-yatra-haridwar';
const count = (page) => page.getByRole('status').filter({ hasText: /tours?$/ });

/** On phones the filter panel is collapsed behind a button. */
async function openFilters(page) {
  const toggle = page.getByRole('button', { name: /^Filters/ });
  if ((await toggle.isVisible()) && (await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
}

test.describe('tour list', () => {
  test('lists sample tours with prices and next dates', async ({ page }) => {
    await page.goto('/tours');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pilgrimage tours');
    await expect(count(page)).toHaveText(/^\d+ tours$/);
    const card = page
      .getByRole('main')
      .getByRole('article')
      .filter({ hasText: 'Char Dham Yatra from Haridwar' })
      .filter({ visible: true });
    await expect(card).toContainText('10 Days / 9 Nights');
    await expect(card).toContainText('₹32,999');
    await expect(card).toContainText(/36 seats left/);
  });

  test('filters by destination and duration, and sorts by price', async ({ page }) => {
    await page.goto('/tours');
    await openFilters(page);
    await page.getByLabel('Destination').selectOption('Kedarnath');
    await expect(page).toHaveURL(/destination=Kedarnath/);
    await expect(count(page)).toHaveText('1 tour');

    await page.goto('/tours?days=1-3&sort=price');
    // The admin journey may add its own short "E2E Yatra" tour while tests run in parallel.
    const titles = page
      .getByRole('main')
      .getByRole('article')
      .getByRole('heading', { level: 3 })
      .filter({ visible: true })
      .filter({ hasNotText: /^E2E / });
    await expect(titles).toHaveText([
      'Ujjain and Omkareshwar Jyotirlinga Yatra',
      'Puri Jagannath Darshan',
    ]);
  });

  test('has no serious accessibility violations and no horizontal scroll', async ({ page }) => {
    await page.goto('/tours');
    await expect(page.getByRole('main').getByRole('article').first()).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('tour detail', () => {
  test('shows itinerary, inclusions, temples and dates, and the booking panel', async ({
    page,
  }) => {
    await page.goto(CHAR_DHAM);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Char Dham Yatra from Haridwar',
    );
    await expect(page).toHaveTitle('Char Dham Yatra from Haridwar — Dates, Price & Itinerary');

    const itinerary = page.locator('#itinerary');
    await expect(itinerary.getByRole('listitem')).toHaveCount(10);
    await expect(
      itinerary.getByText('Ganga aarti at Har Ki Pauri', { exact: false }).first(),
    ).toBeVisible();

    await expect(page.locator('#inclusions')).toContainText(
      'Tour coordinator throughout the yatra',
    );
    await expect(
      page.locator('#temples').getByRole('link', { name: 'Kedarnath Temple' }),
    ).toBeVisible();
    await expect(page.locator('#departures tbody tr')).toHaveCount(3);

    const panel = page.locator('#book');
    await expect(panel).toContainText('₹32,999');
    await panel.getByRole('radio').nth(1).check();
    await expect(panel).toContainText('₹34,999');
    // Guests are sent to log in first, then straight to the booking page for that date.
    await expect(panel.getByRole('link', { name: 'Book now' })).toHaveAttribute(
      'href',
      /^\/login\?next=%2Ftours%2Fchar-dham-yatra-haridwar%2Fbook%3Fdeparture%3D[a-f0-9]{24}$/,
    );
  });

  test('an enquiry link opens the contact form with the subject filled in', async ({ page }) => {
    await page.goto('/contact?subject=Enquiry%3A%20Char%20Dham%20Yatra');
    await expect(page.getByLabel('Subject (optional)')).toHaveValue('Enquiry: Char Dham Yatra');
  });

  test('ships TouristTrip, FAQ and breadcrumb structured data', async ({ request }) => {
    const html = await (await request.get(CHAR_DHAM)).text();
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(
      (m) => JSON.parse(m[1]),
    );
    const trip = blocks.find((b) => b['@type'] === 'TouristTrip');
    expect(trip).toMatchObject({ name: 'Char Dham Yatra from Haridwar' });
    expect(trip.itinerary.numberOfItems).toBe(10);
    expect(trip.offers).toHaveLength(3);
    expect(trip.offers[0]).toMatchObject({
      priceCurrency: 'INR',
      price: 32999,
      availability: 'https://schema.org/InStock',
    });
    expect(blocks.some((b) => b['@type'] === 'FAQPage')).toBe(true);
    expect(blocks.some((b) => b['@type'] === 'BreadcrumbList')).toBe(true);
    expect(html).toMatch(
      /<link rel="canonical" href="http:\/\/localhost:3100\/tours\/char-dham-yatra-haridwar"/,
    );
  });

  test('phones get a sticky bar that jumps to the date picker', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The bar is for small screens');
    await page.goto(CHAR_DHAM);
    const bar = page.locator('a[href="#book"]');
    await expect(bar).toBeVisible();
    await bar.click();
    await expect(page).toHaveURL(/#book$/);
    await expect(page.locator('#book')).toBeInViewport();
  });

  test('unknown tour shows the not-found page', async ({ page }) => {
    await page.goto('/tours/no-such-tour');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page not found');
  });

  test('has no serious accessibility violations and no horizontal scroll', async ({ page }) => {
    await page.goto(CHAR_DHAM);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('tours elsewhere on the site', () => {
  test('temple page lists tours that visit it', async ({ page }) => {
    await page.goto('/temples/kedarnath-temple-rudraprayag');
    const section = page.locator('#tours');
    await expect(section.getByRole('heading', { level: 2 })).toHaveText(
      'Tours covering this temple',
    );
    await expect(
      section.getByRole('link', { name: 'Char Dham Yatra from Haridwar' }),
    ).toBeVisible();
  });

  test('home shows upcoming tours and the navigation links to tours', async ({ page }) => {
    await page.goto('/');
    const upcoming = page
      .getByRole('main')
      .locator('div')
      .filter({ has: page.getByRole('heading', { name: 'Upcoming tours' }) })
      .filter({ has: page.getByRole('article') })
      .last();
    await expect(upcoming.getByRole('article').filter({ visible: true })).toHaveCount(3);
    await expect(
      page.getByRole('main').getByRole('link', { name: 'View tours' }).first(),
    ).toBeVisible();
  });

  test('sitemap lists tours', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    expect(xml).toContain('http://localhost:3100/tours/char-dham-yatra-haridwar');
    expect(xml).toContain('<loc>http://localhost:3100/tours</loc>');
  });
});
