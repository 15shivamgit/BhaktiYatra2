import { expect, test } from '@playwright/test';
import { expectNoSeriousA11yViolations, registerUser } from './helpers';

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

const seatsLeft = async (page) =>
  Number((await page.getByText(/seats left on this date/).textContent()).match(/\d+/)[0]);

test.describe('booking a tour', () => {
  test('guest logs in, books two seats, pays (simulated) and sees the booking confirmed', async ({
    page,
  }) => {
    const user = await registerUser(page);
    await page.context().clearCookies(); // start as a guest
    await page.goto(UJJAIN);
    await page
      .locator('#book')
      .filter({ visible: true })
      .getByRole('link', { name: 'Book now' })
      .click();
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

    await page.getByRole('button', { name: 'Simulate successful payment' }).click();
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
    await page.getByRole('link', { name: 'View this booking' }).click();

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
    await expect(page.getByRole('button', { name: 'Simulate successful payment' })).toHaveCount(0);
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
    await page.getByRole('link', { name: 'View this booking' }).click();
    await expect(page.getByRole('heading', { name: 'Complete your payment' })).toBeVisible();
    await expectNoSeriousA11yViolations(page);
  });
});
