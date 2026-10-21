import { expect, test } from '@playwright/test';
import {
  ACCOUNTS,
  createBookingViaApi,
  login,
  registerUser,
  ticketToken,
  useRazorpayStub,
} from './helpers';

/*
 * Journeys from docs/10-testing/03-e2e-journeys.md not covered elsewhere (Phase 9):
 * J2 circuit to tour, J3 ticket check, J7 ticket access, J9 seats with bookings, J10 a
 * traveller's cancellation processed by an admin, J11 responsive smoke.
 */

const API = 'http://localhost:5100/api/v1';
const UJJAIN = 'ujjain-omkareshwar-jyotirlinga-yatra';

const noSideScroll = (page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

test.describe('journeys (Phase 9)', () => {
  test.skip(({ isMobile }) => isMobile, 'Runs on the desktop project; J11 sets its own sizes');

  test('J2 a circuit page leads to a tour on that route', async ({ page }) => {
    const circuits = (await (await page.request.get(`${API}/circuits?limit=50`)).json()).data;
    let withTours;
    for (const circuit of circuits) {
      const detail = (await (await page.request.get(`${API}/circuits/${circuit.slug}`)).json())
        .data;
      if (detail.tours?.length) {
        withTours = detail;
        break;
      }
    }
    expect(withTours, 'a seeded circuit has tours').toBeTruthy();

    await page.goto(`/circuits/${withTours.slug}`);
    const section = page.getByRole('region', { name: 'Tours on this route' });
    const tour = withTours.tours[0];
    await section.getByRole('link', { name: tour.title }).first().click();
    await page.waitForURL(`**/tours/${tour.slug}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(tour.title);
    await expect(page.locator('#itinerary').getByRole('listitem').first()).toBeVisible();
  });

  test('J3 J7 J10 pay, check the ticket, request cancellation, admin refunds it', async ({
    page,
    browser,
  }) => {
    test.slow(); // two people, several pages
    await registerUser(page, { name: 'Journey Pilgrim' });
    await useRazorpayStub(page);
    const reference = await createBookingViaApi(page, UJJAIN, { name: 'Journey Pilgrim' });

    // Pay from the booking page.
    await page.goto(`/account/bookings/${reference}`);
    await page.getByRole('button', { name: /^Pay ₹/ }).click();
    await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible({
      timeout: 15_000,
    });

    // J3: the QR code's link says "Valid".
    await expect.poll(() => ticketToken(page, reference), { timeout: 15_000 }).toBeTruthy();
    const token = await ticketToken(page, reference);
    await page.goto(`/verify/${token}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Valid ticket');

    // J7: someone else cannot fetch this ticket.
    const other = await browser.newPage();
    await registerUser(other, { name: 'Someone Else' });
    const stolen = await other.request.get(`${API}/bookings/${reference}/ticket`);
    expect(stolen.status()).toBe(404);
    await other.close();

    // J10: the traveller asks to cancel.
    await page.goto(`/account/bookings/${reference}`);
    await page.getByRole('button', { name: 'Request cancellation' }).click();
    const request = page.getByRole('dialog', { name: 'Request cancellation' });
    await request.getByLabel('Reason (optional)').fill('Family emergency');
    await request.getByRole('button', { name: 'Send cancellation request' }).click();
    await expect(page.getByText('Cancellation request sent.')).toBeVisible();

    // The admin finds it through the status filter and refunds under the policy.
    const admin = await browser.newPage();
    await login(admin, ACCOUNTS.admin);
    await admin.waitForURL('**/admin');
    await admin.goto('/admin/bookings');
    await admin.getByLabel('All booking statuses').selectOption('cancellation_requested');
    await admin.waitForURL('**/admin/bookings?bookingStatus=cancellation_requested');
    await admin.getByRole('link', { name: reference }).click();
    await admin.waitForURL('**/admin/bookings/*');
    await expect(admin.getByText('“Family emergency”').first()).toBeVisible();
    await admin.getByRole('button', { name: 'Cancel and refund' }).click();
    const cancel = admin.getByRole('dialog', { name: 'Cancel booking' });
    await cancel.getByLabel('Refund reference').fill('rfnd_journey1');
    await cancel.getByLabel('Reason').fill(`Processed under the policy (${reference})`);
    await cancel.getByRole('button', { name: /^Cancel and record ₹[\d,]+ refund$/ }).click();
    await expect(admin.getByText('Booking cancelled', { exact: true })).toBeVisible();
    const emails = admin.getByRole('region', { name: 'Emails', exact: true });
    await expect(emails).toContainText('booking cancelled');
    await admin.goto('/admin/audit?action=booking.');
    await expect(
      admin.getByRole('row').filter({ hasText: `Processed under the policy (${reference})` }),
    ).toContainText('booking.cancel');
    await admin.close();

    // The traveller sees it cancelled, and the ticket no longer passes.
    await page.goto(`/account/bookings/${reference}`);
    await expect(page.locator('header').getByText('Cancelled', { exact: true })).toBeVisible();
    await page.goto(`/verify/${token}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not valid');
  });

  test('J9 seats cannot drop below what travellers booked', async ({ page, browser }) => {
    test.slow();
    await login(page, ACCOUNTS.admin);
    await page.waitForURL('**/admin');
    const tours = (await (await page.request.get(`${API}/admin/tours?q=Kashi`)).json()).data;
    const tour = tours[0];
    // A date of its own, far enough ahead not to clash with other tests.
    const days = 150 + Math.floor(Math.random() * 150);
    const startDate = new Date(Date.now() + 330 * 60_000 + days * 86_400_000)
      .toISOString()
      .slice(0, 10);
    const created = await page.request.post(`${API}/admin/tours/${tour.id}/departures`, {
      data: { startDate, totalSeats: 3 },
    });
    expect(created.ok(), await created.text()).toBe(true);
    const departure = (await created.json()).data;

    // A traveller books 2 of the 3 seats.
    const traveller = await browser.newPage();
    await registerUser(traveller);
    const booked = await traveller.request.post(`${API}/bookings`, {
      data: {
        departureId: departure.id,
        seats: 2,
        contact: { name: 'Seat Holder', email: 'seats@e2e.test', phone: '9876543210' },
        travellers: [
          { name: 'Seat Holder', age: 40, gender: 'male' },
          { name: 'Seat Partner', age: 38, gender: 'female' },
        ],
        acceptedTerms: true,
      },
    });
    expect(booked.ok(), await booked.text()).toBe(true);
    await traveller.close();

    await page.goto(`/admin/tours/${tour.id}`);
    await page.getByRole('tab', { name: 'Departures' }).click();
    await page.getByRole('button', { name: `Seats: ${startDate}` }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Total seats').fill('1');
    await expect(dialog.getByText('2 seats are booked or held; choose at least 2.')).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'Update seats' })).toBeDisabled();
    await dialog.getByLabel('Total seats').fill('5');
    await dialog.getByLabel('Reason').fill('Bigger vehicle');
    await dialog.getByRole('button', { name: 'Update seats' }).click();
    await expect(page.getByText('Seats updated.')).toBeVisible();
    const fresh = (await (await page.request.get(`${API}/admin/departures/${departure.id}`)).json())
      .data;
    expect(fresh).toMatchObject({ totalSeats: 5, seatsAvailable: 3 });
  });

  test('keyboard only: choose a date, fill the booking form and reach payment', async ({
    page,
    browserName,
  }) => {
    test.slow();
    test.skip(browserName === 'webkit', 'Safari needs Option+Tab for links; covered on Chromium');
    await registerUser(page, { name: 'Keyboard Pilgrim' });
    await page.goto(`/tours/${UJJAIN}`);
    const panel = page.locator('#book').filter({ visible: true });
    await expect(panel.getByRole('radio').first()).toBeVisible();

    /** Press Tab until `target` has focus (fails if it is not reachable within 60 stops). */
    const tabTo = async (target) => {
      for (let i = 0; i < 60; i += 1) {
        if (await target.evaluate((el) => el === document.activeElement)) return;
        await page.keyboard.press('Tab');
      }
      throw new Error(`Not reachable by Tab: ${target}`);
    };

    await tabTo(panel.getByRole('radio').first());
    await page.keyboard.press('ArrowDown'); // radio groups move with arrow keys
    await expect(panel.getByRole('radio').nth(1)).toBeChecked();
    await tabTo(panel.getByRole('link', { name: 'Book now' }));
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/book\?departure=[a-f0-9]{24}$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Book your yatra');

    const traveller = page.getByRole('group', { name: 'Traveller 1' });
    await tabTo(traveller.getByLabel('Name (as on ID)'));
    await page.keyboard.type('Keyboard Pilgrim');
    await page.keyboard.press('Tab');
    await expect(traveller.getByLabel('Age')).toBeFocused();
    await page.keyboard.type('45');
    await page.keyboard.press('Tab');
    await expect(traveller.getByLabel('Gender')).toBeFocused();
    await traveller.getByLabel('Gender').press('ArrowDown');
    await tabTo(page.getByLabel(/I have read and accept the/));
    await page.keyboard.press('Space');
    await expect(page.getByLabel(/I have read and accept the/)).toBeChecked();
    await tabTo(page.getByRole('button', { name: /Continue to payment/ }));
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Complete your payment' })).toBeVisible({
      timeout: 15_000,
    });
  });

  for (const width of [360, 768, 1280]) {
    test(`J11 key pages fit ${width} px without sideways scrolling`, async ({ page, browser }) => {
      test.slow();
      await registerUser(page);
      const tour = (await (await page.request.get(`${API}/tours/${UJJAIN}`)).json()).data;
      const departure = tour.departures.find((d) => d.isBookable);
      const admin = await browser.newPage();
      await login(admin, ACCOUNTS.admin);
      await admin.waitForURL('**/admin');
      const visits = [
        [page, '/'],
        [page, '/temples/kedarnath-temple-rudraprayag'],
        [page, '/tours/char-dham-yatra-haridwar'],
        [page, `/tours/${UJJAIN}/book?departure=${departure.id}`],
        [page, '/account/bookings'],
        [admin, '/admin/bookings'],
      ];
      for (const [who, path] of visits) {
        await who.setViewportSize({ width, height: 900 });
        await who.goto(path, { waitUntil: 'domcontentloaded' });
        // Read the DOM directly: Firefox can report a finished page as still navigating.
        await expect
          .poll(
            () =>
              who.evaluate(() => {
                const h1 = document.querySelector('main h1, h1');
                return Boolean(h1 && h1.getBoundingClientRect().height > 0);
              }),
            { timeout: 15_000 },
          )
          .toBe(true);
        expect(await noSideScroll(who), `${path} at ${width}px`).toBe(true);
      }
      await admin.close();

      if (width === 360) {
        // The menu works at phone width (a fresh tab: Firefox under Playwright can leave the
        // previous tab looking mid-navigation after many page loads).
        const phone = await browser.newPage({ viewport: { width, height: 900 } });
        await phone.goto('/');
        await phone.getByRole('button', { name: 'Open menu' }).click();
        await expect(phone.getByRole('link', { name: 'Temples' }).first()).toBeVisible();
        await phone.close();
      }
    });
  }
});
