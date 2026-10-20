import { expect, test } from '@playwright/test';
import {
  expectNoSeriousA11yViolations,
  registerUser,
  setRazorpayScenario,
  useRazorpayStub,
} from './helpers';

/*
 * Booking journeys (Phase 5). The E2E API uses the stub payment provider (payments can be
 * simulated) and a one-minute seat hold. Every test registers its own user because a user may
 * hold at most three unpaid bookings.
 */

const UJJAIN = '/tours/ujjain-omkareshwar-jyotirlinga-yatra';
const KASHI = '/tours/kashi-ayodhya-darshan';

/** Open a tour, pick the nth date and go to its booking page. */
async function startBooking(page, tourPath, dateIndex = 0) {
  await page.goto(tourPath);
  const panel = page.locator('#book').filter({ visible: true });
  await panel.getByRole('radio').nth(dateIndex).check();
  await panel.getByRole('link', { name: 'Book now' }).click();
  await expect(page).toHaveURL(/\/book\?departure=[a-f0-9]{24}$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Book your yatra');
}

async function fillTravellers(page, seats) {
  for (let i = 1; i < seats; i += 1)
    await page.getByRole('button', { name: 'One seat more' }).click();
  await expect(page.getByTestId('seat-count')).toHaveText(String(seats));
  for (let i = 0; i < seats; i += 1) {
    const group = page.getByRole('group', { name: `Traveller ${i + 1}` });
    await group.getByLabel('Name (as on ID)').fill(i === 0 ? 'Pilgrim Test' : `Companion ${i}`);
    await group.getByLabel('Age').fill(String(40 + i));
    await group.getByLabel('Gender').selectOption(i % 2 ? 'male' : 'female');
  }
  await page.getByLabel(/I have read and accept the/).check();
}

/**
 * Go from the payment step to the booking detail page. Wait for the new page: until the
 * navigation finishes, the old page's "Pay" button is still on screen.
 */
async function openBookingDetail(page) {
  await page.getByRole('link', { name: 'View this booking' }).click();
  await page.waitForURL('**/account/bookings/BY-*');
  await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();
}

const seatsLeft = async (page) =>
  Number((await page.getByText(/seats left on this date/).textContent()).match(/\d+/)[0]);

test.describe('booking a tour', () => {
  test('guest logs in, books two seats, pays with Razorpay Checkout and sees it confirmed', async ({
    page,
  }) => {
    const user = await registerUser(page);
    await useRazorpayStub(page);
    await page.context().clearCookies(); // start as a guest
    await page.goto(UJJAIN);
    const bookNow = page
      .locator('#book')
      .filter({ visible: true })
      .getByRole('link', { name: 'Book now' });
    // Before hydration the link has no date yet; wait for the selected departure in its href.
    await expect(bookNow).toHaveAttribute('href', /departure(=|%3D)/);
    await bookNow.click();
    await expect(page).toHaveURL(/\/login\?next=/);
    await page.getByLabel('Email').fill(user.email);
    await page.getByLabel('Password').fill(user.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL(/\/tours\/ujjain-omkareshwar-jyotirlinga-yatra\/book\?departure=/);

    // Contact details come from the account.
    await expect(page.locator('#contact-name')).toHaveValue(user.name);
    await expect(page.locator('#contact-email')).toHaveValue(user.email);

    await fillTravellers(page, 2);
    await expect(page.getByTestId('booking-total')).toHaveText('₹15,998');
    await page.getByRole('button', { name: /Continue to payment/ }).click();

    await expect(page.getByRole('heading', { name: 'Complete your payment' })).toBeVisible();
    await expect(page.getByTestId('hold-countdown')).toHaveText(/^0:\d{2}$|^1:00$/);
    const reference = await page.locator('strong.font-mono').first().textContent();
    expect(reference).toMatch(/^BY-\d{8}-[A-Z2-9]{5}$/);

    await page.getByRole('button', { name: 'Pay ₹15,998' }).click();
    // Checkout got the server's order and amount; the API verified the real signature.
    expect(await page.evaluate(() => window.__rzpLastOptions)).toMatchObject({
      key: 'rzp_test_e2e',
      amount: 1_599_800,
    });
    await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible();

    await page.goto('/account/bookings');
    const card = page.getByRole('article').filter({ hasText: reference });
    await expect(card).toContainText('Confirmed');
    await expect(card).toContainText('2 seat(s)');
  });

  test('cancelling an unpaid booking releases the seats', async ({ page, isMobile }) => {
    await registerUser(page);
    await startBooking(page, KASHI, isMobile ? 1 : 0);
    const before = await seatsLeft(page);
    await fillTravellers(page, 3);
    await page.getByRole('button', { name: /Continue to payment/ }).click();
    await openBookingDetail(page);

    await expect(page.getByText('Awaiting payment')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel booking' }).click();
    const dialog = page.getByRole('dialog', { name: 'Cancel booking' });
    await dialog.getByLabel('Reason (optional)').fill('Plans changed');
    await dialog.getByRole('button', { name: 'Cancel booking' }).click();
    await expect(page.getByText('Booking cancelled. The seats were released.')).toBeVisible();
    await expect(page.locator('header').getByText('Cancelled', { exact: true })).toBeVisible();
    await expect(page.getByText('Plans changed')).toBeVisible(); // in the history

    await startBooking(page, KASHI, isMobile ? 1 : 0);
    expect(await seatsLeft(page)).toBe(before);
  });

  test('the hold countdown runs out and "Try again" starts over', async ({ page }) => {
    test.slow(); // waits for the one-minute E2E hold
    await registerUser(page);
    await startBooking(page, UJJAIN, 1);
    await fillTravellers(page, 1);
    await page.getByRole('button', { name: /Continue to payment/ }).click();
    await expect(page.getByTestId('hold-countdown')).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Your seat hold expired' })).toBeVisible({
      timeout: 75_000,
    });
    await expect(page.getByRole('button', { name: /^Pay / })).toHaveCount(0);
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(page.getByRole('button', { name: /Continue to payment/ })).toBeVisible();
  });

  test('another user cannot open someone else’s booking', async ({ page, browser }) => {
    await registerUser(page);
    await startBooking(page, UJJAIN, 2);
    await fillTravellers(page, 1);
    await page.getByRole('button', { name: /Continue to payment/ }).click();
    const reference = await page.locator('strong.font-mono').first().textContent();

    const other = await browser.newPage();
    await registerUser(other, { name: 'Someone Else' });
    await other.goto(`/account/bookings/${reference}`);
    await expect(other.getByText('We could not find this booking.')).toBeVisible();
    await other.close();
  });

  test('shows a reminder banner for an unpaid booking', async ({ page }) => {
    await registerUser(page);
    await startBooking(page, UJJAIN, 3);
    await fillTravellers(page, 1);
    await page.getByRole('button', { name: /Continue to payment/ }).click();
    await expect(page.getByRole('heading', { name: 'Complete your payment' })).toBeVisible();
    await page.goto('/temples');
    await expect(page.getByRole('status').filter({ hasText: 'is not paid yet' })).toBeVisible();
  });

  test('booking pages have no serious accessibility violations', async ({ page }) => {
    await registerUser(page);
    await startBooking(page, UJJAIN, 0);
    await expect(page.getByRole('group', { name: 'Traveller 1' })).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    await fillTravellers(page, 1);
    await page.getByRole('button', { name: /Continue to payment/ }).click();
    await openBookingDetail(page);
    await expect(page.getByRole('heading', { name: 'Complete your payment' })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });

  test('a cancelled checkout and a declined card can both be retried', async ({ page }) => {
    await registerUser(page);
    await useRazorpayStub(page, 'dismiss');
    await startBooking(page, UJJAIN, 0);
    await fillTravellers(page, 1);
    await page.getByRole('button', { name: /Continue to payment/ }).click();

    await page.getByRole('button', { name: 'Pay ₹7,999' }).click();
    await expect(page.getByText('Payment was cancelled. You can try again')).toBeVisible();

    await setRazorpayScenario(page, 'fail');
    await page.getByRole('button', { name: 'Try paying again' }).click();
    await expect(
      page.getByText(/Card declined by bank\. Your seats are still held for \d+:\d{2}\./),
    ).toBeVisible();

    await setRazorpayScenario(page, 'success');
    await page.getByRole('button', { name: 'Try paying again' }).click();
    await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible();
    expect(await page.evaluate(() => window.__rzpOpened)).toBe(3);
  });

  test('pays from the booking page in My bookings', async ({ page }) => {
    await registerUser(page);
    await useRazorpayStub(page);
    await startBooking(page, UJJAIN, 1);
    await fillTravellers(page, 1);
    await page.getByRole('button', { name: /Continue to payment/ }).click();
    await openBookingDetail(page);
    await page.getByRole('button', { name: 'Pay ₹7,999' }).click();
    await expect(page.getByRole('heading', { name: 'Booking confirmed' })).toBeVisible();
    await expect(page.locator('header').getByText('Confirmed', { exact: true })).toBeVisible();
    await expect(page.getByText('Payment received', { exact: true })).toBeVisible(); // history

    // Phase 7: the e-ticket and invoice are ready to download.
    const documents = page.getByRole('region', { name: 'E-ticket and invoice' });
    await expect(documents.getByRole('button', { name: 'Download e-ticket' })).toBeVisible({
      timeout: 15_000,
    });
    const reference = (await page.locator('p.font-mono').first().textContent()).trim();
    const [ticket] = await Promise.all([
      page.waitForEvent('download'),
      documents.getByRole('button', { name: 'Download e-ticket' }).click(),
    ]);
    expect(ticket.suggestedFilename()).toBe(`BhaktiYatra-Ticket-${reference}.pdf`);
    const [invoice] = await Promise.all([
      page.waitForEvent('download'),
      documents.getByRole('button', { name: 'Download invoice' }).click(),
    ]);
    expect(invoice.suggestedFilename()).toMatch(/^BhaktiYatra-Invoice-INV-\d{4}-\d{6}\.pdf$/);
  });

  test('the ticket check page rejects a damaged ticket', async ({ page }) => {
    await page.goto('/verify/not-a-real-ticket-token');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Not valid');
    await expect(page.getByText('This ticket could not be found.')).toBeVisible();
  });

  test('TC-PAY-12 never spins forever when verify cannot be reached', async ({ page }) => {
    test.slow();
    await registerUser(page);
    await useRazorpayStub(page);
    await page.route('**/api/v1/payments/verify', (route) => route.abort());
    await startBooking(page, UJJAIN, 2);
    await fillTravellers(page, 1);
    await page.getByRole('button', { name: /Continue to payment/ }).click();
    const started = Date.now();
    await page.getByRole('button', { name: 'Pay ₹7,999' }).click();
    await expect(page.getByText('Confirming your payment…')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payment received, confirming' })).toBeVisible({
      timeout: 70_000,
    });
    expect(Date.now() - started).toBeLessThanOrEqual(65_000);
  });
});
