import { expect, test } from '@playwright/test';
import {
  ACCOUNTS,
  createBookingViaApi,
  expectNoSeriousA11yViolations,
  login,
  registerUser,
} from './helpers';

/*
 * Admin operations (Phase 8): dashboard, bookings, payments, users and the audit log.
 * The E2E API runs on an in-memory database with sample tours (backend/scripts/e2e-server.js).
 */

const KASHI = 'kashi-ayodhya-darshan';
const suffix = () => Math.random().toString(36).slice(2, 8).toUpperCase();

test.describe('admin operations (Phase 8)', () => {
  test.skip(({ isMobile }) => isMobile, 'Admin journeys run on the desktop project');

  test('finds a booking, records an offline payment, adds a note and cancels it with a refund', async ({
    page,
    browser,
  }) => {
    test.slow(); // long journey; the full suite runs several workers in parallel
    const customer = await browser.newPage();
    await registerUser(customer, { name: 'Offline Payer' });
    const reference = await createBookingViaApi(customer, KASHI);
    await customer.close();

    await login(page, ACCOUNTS.admin);
    await expect(page).toHaveURL('/admin');

    // Top bar search finds the booking by reference.
    const search = page.getByRole('searchbox', { name: 'Search bookings and users' });
    await search.fill(reference);
    await search.press('Enter');
    await page.waitForURL('**/admin/search?q=*');
    await page.getByRole('main').getByRole('link', { name: reference }).click();
    await page.waitForURL('**/admin/bookings/*');
    await expect(page.getByRole('heading', { level: 1, name: reference })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Regenerate documents' })).toHaveCount(0);

    // Money received by bank transfer: confirm with a reason.
    await page.getByRole('button', { name: 'Mark as paid' }).click();
    const paid = page.getByRole('dialog', { name: 'Mark as paid' });
    await paid.getByLabel('Payment reference').fill(`UTR${suffix()}`);
    await paid.getByLabel('Reason').fill('Paid by bank transfer at the office');
    await paid.getByRole('button', { name: 'Record payment and confirm' }).click();
    await expect(page.getByText('Payment recorded; the booking is confirmed')).toBeVisible();
    const header = page.getByRole('main').locator('header');
    await expect(header.getByText('Confirmed', { exact: true })).toBeVisible();
    await expect(page.getByText(/^INV-\d{4}-\d{6}$/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Regenerate documents' })).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    // Internal note.
    const notes = page.getByRole('region', { name: 'Internal notes' });
    await notes.getByRole('textbox', { name: 'Add note' }).fill('Called the customer to confirm');
    await notes.getByRole('button', { name: 'Add note' }).click();
    await expect(notes.getByText('Called the customer to confirm')).toBeVisible();

    // Cancel with a partial refund.
    await header.getByRole('button', { name: 'Cancel booking' }).click();
    const cancel = page.getByRole('dialog', { name: 'Cancel booking' });
    await expect(cancel.getByText('Suggested refund')).toBeVisible();
    await cancel.getByLabel('Refund amount (₹)').fill('1000');
    await cancel.getByLabel('Refund reference').fill('rfnd_e2e123');
    await cancel.getByLabel('Reason').fill('Customer request by phone');
    await cancel.getByRole('button', { name: 'Cancel and record ₹1,000 refund' }).click();
    await expect(page.getByText('Booking cancelled', { exact: true })).toBeVisible();
    await expect(header.getByText('Cancelled', { exact: true })).toBeVisible();
    await expect(header.getByText('Partly refunded')).toBeVisible();
    await expect(page.getByText('rfnd_e2e123').first()).toBeVisible();

    // The audit log shows who did it, why, and what changed.
    await page.getByRole('link', { name: 'Open in audit log' }).click();
    await page.waitForURL('**/admin/audit?*');
    const row = page.getByRole('row').filter({ hasText: 'booking.cancel' });
    await expect(row).toContainText('Customer request by phone');
    await expect(row).toContainText('E2E Admin');
    await row.getByRole('button', { name: 'Changes' }).click();
    await expect(page.getByRole('rowheader', { name: /bookingStatus/ })).toBeVisible();
    await expect(page.getByRole('row').filter({ hasText: 'manual_payment' }).first()).toContainText(
      'Paid by bank transfer at the office',
    );
  });

  test('dashboard, lists, CSV export and users work and have no serious accessibility violations', async ({
    page,
  }) => {
    test.slow();
    await login(page, ACCOUNTS.admin);
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Net revenue · Last 7 days')).toBeVisible();
    await expectNoSeriousA11yViolations(page);
    await page.getByLabel('Period').selectOption('30d');
    await page.waitForURL('**/admin?range=30d');
    await expect(page.getByText('Net revenue · Last 30 days')).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Admin panel' })
      .getByRole('link', { name: 'Bookings' })
      .click();
    await page.waitForURL('**/admin/bookings');
    await expect(page.getByRole('heading', { level: 1, name: 'Bookings' })).toBeVisible();
    await page.getByLabel('All booking statuses').selectOption('pending');
    await page.waitForURL('**/admin/bookings?bookingStatus=pending');
    await expectNoSeriousA11yViolations(page);
    const [csv] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Export CSV' }).click(),
    ]);
    expect(csv.suggestedFilename()).toMatch(/^bookings-\d{4}-\d{2}-\d{2}\.csv$/);

    // Tablet width: the page itself never scrolls sideways (tables scroll in their box).
    await page.setViewportSize({ width: 820, height: 1000 });
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Bookings' })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto('/admin/payments');
    await expect(page.getByRole('heading', { level: 1, name: 'Payments' })).toBeVisible();
    await page.goto('/admin/audit');
    await expect(page.getByRole('heading', { level: 1, name: 'Audit log' })).toBeVisible();
    await expectNoSeriousA11yViolations(page);

    await page.goto(`/admin/users?q=${encodeURIComponent(ACCOUNTS.admin.email)}`);
    const me = page.getByRole('row').filter({ hasText: ACCOUNTS.admin.email });
    await expect(me).toContainText('You cannot change your own account');
    await expect(me.getByRole('button', { name: 'Deactivate' })).toHaveCount(0);
  });
});
