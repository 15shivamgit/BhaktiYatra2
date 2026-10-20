import { expect, test } from '@playwright/test';
import { ACCOUNTS, expectNoSeriousA11yViolations, login } from './helpers';

/** 1×1 PNG: real image bytes, so the API's file-type sniffing accepts it. The e2e API stores
 * uploads in a fake image store. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const LONG_TEXT =
  'This small riverside shrine is visited by pilgrims on their way to Gaya. ' +
  'Devotees offer water and bilva leaves at dawn, and the evening aarti draws families from nearby villages. ' +
  'The courtyard holds an old banyan tree and a stepped tank used during festivals.';

const suffix = () => Math.random().toString(36).slice(2, 8);

test.describe('admin content (J8)', () => {
  test.skip(({ isMobile }) => isMobile, 'Admin journeys run on the desktop project');

  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await expect(page).toHaveURL('/admin');
  });

  test('creates a temple, sees what is missing, completes it and publishes it', async ({
    page,
    request,
  }) => {
    test.slow(); // long journey; the full suite runs four workers in parallel
    const name = `E2E Temple ${suffix()}`;
    await page
      .getByRole('navigation', { name: 'Admin panel' })
      .getByRole('link', { name: 'Temples' })
      .click();
    await page.getByRole('link', { name: 'New temple' }).click();

    await page.getByLabel('Name', { exact: true }).fill(name);
    await page.getByLabel('Deity').fill('Shiva');
    await page.getByLabel('State').selectOption('Bihar');
    await page.getByLabel('City / town').fill('Gaya');
    await page.getByLabel('Short description').fill('A quiet riverside Shiva shrine near Gaya.');
    await page.getByRole('button', { name: 'Create draft' }).click();
    await expect(page.getByText('Draft created.')).toBeVisible();

    await expect(page).toHaveURL(/\/admin\/temples\/[a-f0-9]{24}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    const missing = page.getByRole('status').filter({ hasText: 'Not ready to publish' });
    await expect(missing).toContainText('Set the temple location on the map');
    await expect(missing).toContainText('Upload at least one image');
    await expect(missing).toContainText('Description needs at least 200 characters');
    await expect(missing).toContainText('Add at least one darshan timing');

    // Publishing now is refused and explained.
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(missing).toBeVisible();

    await page.getByRole('tab', { name: 'Content' }).click();
    await page.getByRole('textbox', { name: 'Description', exact: true }).fill(LONG_TEXT);

    await page.getByRole('tab', { name: 'Timings & festivals' }).click();
    const timings = page.getByRole('group', { name: 'Darshan timings' });
    await timings.getByRole('button', { name: 'Add' }).click();
    await timings.getByLabel('Label').fill('Morning darshan');
    await timings.getByLabel('Opens').fill('06:00');
    await timings.getByLabel('Closes').fill('12:00');

    await page.getByRole('tab', { name: 'Location' }).click();
    await page.getByLabel('Latitude').fill('24.7955');
    await page.getByLabel('Longitude').fill('84.9994');

    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Saved.')).toBeVisible();
    await expect(missing).not.toContainText('darshan timing');
    await expect(missing).toContainText('Upload at least one image');

    await page.getByRole('tab', { name: 'Photos' }).click();
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: 'shrine.png', mimeType: 'image/png', buffer: PNG });
    await page.getByLabel('Alt text shrine.png').fill('Small white shrine beside a banyan tree');
    await page.getByRole('button', { name: 'Upload photos' }).click();
    await expect(page.getByText('1 photo(s) uploaded.')).toBeVisible();
    await expect(missing).toBeHidden();

    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText(/^Published\./)).toBeVisible();
    const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 1 }) });
    await expect(header.getByText('Published', { exact: true })).toBeVisible();

    const slug = (await header.getByText(/^\/temples\//).textContent()).replace('/temples/', '');
    await page.goto(`/temples/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
    await expect(page.getByRole('row', { name: /Morning darshan/ })).toContainText(
      '6:00 am – 12:00 pm',
    );

    // The API tells the site to revalidate, so the sitemap lists the new page shortly after.
    await expect
      .poll(
        async () => (await (await request.get('/sitemap.xml')).text()).includes(`/temples/${slug}`),
        { timeout: 15_000 },
      )
      .toBe(true);

    // Renaming the slug of a published temple keeps the old address working.
    await page.goBack();
    await page.getByLabel('URL slug').fill(`${slug}-renamed`);
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(header.getByText(`/temples/${slug}-renamed`)).toBeVisible();
    const api = await request.get(`http://localhost:5100/api/v1/temples/${slug}`, {
      maxRedirects: 0,
    });
    expect(api.status()).toBe(301);
    expect((await api.json()).data.redirect.slug).toBe(`${slug}-renamed`);
    await page.goto(`/temples/${slug}`);
    await expect(page).toHaveURL(`/temples/${slug}-renamed`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
  });

  test('builds a circuit with temples in route order and publishes it', async ({ page }) => {
    test.slow(); // the full suite runs several workers in parallel
    const name = `E2E Circuit ${suffix()}`;
    await page.goto('/admin/circuits/new');
    await page.getByLabel('Name', { exact: true }).fill(name);
    await page
      .getByLabel('Short description')
      .fill('A short test route through two Himalayan shrines.');

    await page.getByRole('tab', { name: 'Temples' }).click();
    const search = page.getByLabel('Find a temple to add');
    for (const temple of ['Kedarnath', 'Badrinath']) {
      await search.fill(temple);
      await search.press('Enter');
      await page.getByRole('button', { name: `Add temple: ${temple} Temple` }).click();
    }
    await page.getByRole('button', { name: 'Move up: Badrinath Temple' }).click();
    const route = page.getByRole('list', { name: 'Temples in route order' });
    await expect(route.getByRole('listitem')).toHaveText([/Badrinath Temple/, /Kedarnath Temple/]);

    await page.getByRole('button', { name: 'Create draft' }).click();
    await expect(page).toHaveURL(/\/admin\/circuits\/[a-f0-9]{24}$/, { timeout: 15_000 });
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText(/^Published\./)).toBeVisible();

    const header = page.locator('header').filter({ has: page.getByRole('heading', { level: 1 }) });
    const slug = (await header.getByText(/^\/circuits\//).textContent()).replace('/circuits/', '');
    await page.goto(`/circuits/${slug}`);
    const stops = page.getByRole('list').filter({ hasText: 'Stop 1' });
    await expect(stops.getByRole('heading', { level: 3 })).toHaveText([
      'Badrinath Temple',
      'Kedarnath Temple',
    ]);
  });

  test('reads a contact message and marks it replied', async ({ page, browser }) => {
    const subject = `Group yatra ${suffix()}`;
    const visitor = await browser.newPage();
    await visitor.goto('/contact');
    await visitor.getByLabel('Your name').fill('Sita Devi');
    await visitor.getByLabel('Email').fill('sita@example.com');
    await visitor.getByLabel('Subject (optional)').fill(subject);
    await visitor
      .getByLabel('Message')
      .fill('Can you arrange a Kashi trip for 12 people in March?');
    await visitor.getByRole('button', { name: 'Send message' }).click();
    await expect(visitor.getByText('Thank you. We will get back to you soon.')).toBeVisible();
    await visitor.close();

    await page.goto('/admin/contacts');
    const message = page.getByRole('article', { name: subject });
    await expect(message).toContainText('Can you arrange a Kashi trip');
    await expect(message.getByRole('link', { name: 'Reply by email' })).toHaveAttribute(
      'href',
      /^mailto:sita@example\.com/,
    );
    await message.getByRole('button', { name: 'Mark replied' }).click();
    await expect(message.getByText('Replied', { exact: true })).toBeVisible();
  });

  test('temple editor has no serious accessibility violations', async ({ page }) => {
    test.slow(); // two full axe scans of a large form while other workers run
    await page.goto('/admin/temples');
    await page.getByRole('searchbox', { name: 'Search by name, city or slug' }).fill('Kedarnath');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByRole('main').getByRole('link', { name: 'Kedarnath Temple' }).click();
    await expect(page).toHaveURL(/\/admin\/temples\/[a-f0-9]{24}$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Kedarnath Temple', {
      timeout: 15_000,
    });
    await expectNoSeriousA11yViolations(page);
    await page.getByRole('tab', { name: 'Timings & festivals' }).click();
    await expectNoSeriousA11yViolations(page);
  });
});

/** "YYYY-MM-DD" for today + n days in India. */
const dayFromToday = (n) =>
  new Date(Date.now() + 330 * 60_000 + n * 86_400_000).toISOString().slice(0, 10);

test.describe('admin tours (Phase 4)', () => {
  test.skip(({ isMobile }) => isMobile, 'Admin journeys run on the desktop project');

  test.beforeEach(async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await expect(page).toHaveURL('/admin');
  });

  test('creates a tour with itinerary and departures, publishes it, and manages seats', async ({
    page,
    request,
  }) => {
    test.slow(); // long journey; the full suite runs four workers in parallel
    // Work out the dates once: the test can run across midnight in India.
    const [d20, d30, d44] = [20, 30, 44].map(dayFromToday);
    const title = `E2E Yatra ${suffix()}`;
    await page
      .getByRole('navigation', { name: 'Admin panel' })
      .getByRole('link', { name: 'Tours' })
      .click();
    await page.getByRole('link', { name: 'New tour' }).click();
    await page.getByLabel('Title', { exact: true }).fill(title);
    await page.getByLabel('Summary').fill('Two calm days by the Ganga with aarti and darshan.');
    await page.getByLabel('Destinations').fill('Haridwar, Rishikesh');
    await page.getByLabel('Days', { exact: true }).fill('2');
    await page.getByLabel('Nights', { exact: true }).fill('1');
    await page.getByLabel('Base price (₹ per person)').fill('9999');
    await page.getByLabel('Pickup cities').fill('Haridwar');
    await page.getByRole('button', { name: 'Create draft' }).click();
    await expect(page).toHaveURL(/\/admin\/tours\/[a-f0-9]{24}$/);

    const missing = page.getByRole('status').filter({ hasText: 'Not ready to publish' });
    await expect(missing).toContainText('Upload at least one image');
    await expect(missing).toContainText('The itinerary needs exactly 2 days');
    await expect(missing).toContainText('Add at least one inclusion');

    await page.getByRole('tab', { name: 'Itinerary' }).click();
    await page
      .getByRole('group', { name: 'Day 1' })
      .getByLabel('Day title')
      .fill('Arrive in Haridwar');
    await page
      .getByRole('group', { name: 'Day 2' })
      .getByLabel('Day title')
      .fill('Rishikesh and return');
    await page.getByRole('tab', { name: 'Inclusions' }).click();
    await page.getByLabel('What is included').fill('Hotel stay\nAC transport');
    await page.getByRole('tab', { name: 'Temples' }).click();
    const search = page.getByLabel('Find a temple to add');
    await search.fill('Kedarnath');
    await search.press('Enter');
    await page.getByRole('button', { name: 'Add temple: Kedarnath Temple' }).click();
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Saved.')).toBeVisible();
    await expect(missing).not.toContainText('itinerary');

    await page.getByRole('tab', { name: 'Photos' }).click();
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: 'ghat.png', mimeType: 'image/png', buffer: PNG });
    await page.getByLabel('Alt text ghat.png').fill('Evening aarti on the ghat');
    await page.getByRole('button', { name: 'Upload photos' }).click();
    await expect(missing).toBeHidden();
    await page.getByRole('button', { name: 'Publish' }).click();
    await expect(page.getByText(/^Published\./)).toBeVisible();

    // Departures: one single date, then a weekly series.
    await page.getByRole('tab', { name: 'Departures' }).click();
    await page.getByRole('button', { name: 'Add departure' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Start date').fill(d20);
    await dialog.getByLabel('Total seats').fill('30');
    await dialog.getByRole('button', { name: 'Add departure' }).click();
    await expect(page.getByText('Departure added.')).toBeVisible();

    await page.getByRole('button', { name: 'Repeat dates' }).click();
    await dialog.getByLabel('First date').fill(d30);
    await dialog.getByLabel('Last date').fill(d44);
    await dialog.getByLabel('Total seats').fill('20');
    await dialog.getByRole('button', { name: 'Create departures' }).click();
    await expect(page.getByText('3 departures created.')).toBeVisible();

    const rows = page.getByRole('table', { name: 'Departures' }).locator('tbody tr');
    await expect(rows).toHaveCount(4);

    await page.getByRole('button', { name: `Seats: ${d20}` }).click();
    await dialog.getByLabel('Total seats').fill('35');
    await dialog.getByLabel('Reason').fill('Added a second bus');
    await dialog.getByRole('button', { name: 'Update seats' }).click();
    await expect(page.getByText('Seats updated.')).toBeVisible();
    await expect(rows.first()).toContainText('35');

    await page.getByRole('button', { name: `Cancel: ${d44}` }).click();
    await dialog.getByLabel('Reason').fill('Road closed for repairs');
    await dialog.getByRole('button', { name: 'Cancel departure' }).click();
    await expect(page.getByText(/^Departure cancelled\./)).toBeVisible();
    await expect(rows.last()).toContainText('Cancelled');

    // Public page shows the three open dates; the sitemap lists the tour.
    const slug = (
      await page
        .locator('header')
        .getByText(/^\/tours\//)
        .textContent()
    ).replace('/tours/', '');
    await page.goto(`/tours/${slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(title);
    await expect(page.locator('#departures tbody tr')).toHaveCount(3);
    await expect
      .poll(
        async () => (await (await request.get('/sitemap.xml')).text()).includes(`/tours/${slug}`),
        { timeout: 15_000 },
      )
      .toBe(true);
  });

  test('tour editor has no serious accessibility violations', async ({ page }) => {
    test.slow(); // two full axe scans of a large form while other workers run
    await page.goto('/admin/tours');
    await page
      .getByRole('main')
      .getByRole('link', { name: 'Char Dham Yatra from Haridwar' })
      .click();
    await expect(page).toHaveURL(/\/admin\/tours\/[a-f0-9]{24}$/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Char Dham Yatra from Haridwar',
      { timeout: 15_000 },
    );
    await expectNoSeriousA11yViolations(page);
    await page.getByRole('tab', { name: 'Departures' }).click();
    await expect(page.getByRole('table', { name: 'Departures' })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });
});
