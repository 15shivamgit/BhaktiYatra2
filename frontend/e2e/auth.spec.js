import { expect, test } from '@playwright/test';
import {
  ACCOUNTS,
  expectNoSeriousA11yViolations,
  login,
  openUserMenu,
  uniqueEmail,
  userMenuButton,
  contentAlert,
} from './helpers';

test.describe('authentication journeys', () => {
  test('register → log out → log in → edit profile (persists after reload)', async ({ page }) => {
    const email = uniqueEmail();
    await page.goto('/register');
    await page.getByLabel('Full name').fill('Sunita Sharma');
    await page.getByLabel('Email').fill(email);
    await page.getByLabel('Phone (optional)').fill('98765 43210');
    await page.getByLabel('Password', { exact: true }).fill('Pilgrim-Pass-2026');
    await page.getByLabel('Confirm password').fill('Pilgrim-Pass-2026');
    await page.getByRole('checkbox').check();
    await page.getByRole('button', { name: 'Create account' }).click();

    await expect(page).toHaveURL('/');
    await expect(userMenuButton(page, 'Sunita Sharma')).toBeAttached();

    await openUserMenu(page, 'Sunita Sharma');
    await page.getByRole('menuitem', { name: 'Log out' }).click();
    await expect(page.getByRole('link', { name: 'Log in' })).toBeVisible();

    await login(page, { email, password: 'Pilgrim-Pass-2026' });
    await expect(page).toHaveURL('/');

    await page.goto('/account');
    const name = page.getByLabel('Full name');
    await expect(name).toHaveValue('Sunita Sharma');
    await expect(page.getByLabel('Phone (optional)')).toHaveValue('+919876543210');
    await name.fill('Sunita Devi Sharma');
    await page.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByText('Profile updated.')).toBeVisible();

    await page.reload();
    await expect(page.getByLabel('Full name')).toHaveValue('Sunita Devi Sharma');
  });

  test('wrong password shows an error and stays on the login page', async ({ page }) => {
    await login(page, { email: ACCOUNTS.user.email, password: 'definitely-wrong-1' });
    await expect(contentAlert(page)).toContainText('Invalid email or password.');
    await expect(page).toHaveURL(/\/login/);
  });

  test('guest opening /account is sent to login and returned afterwards', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL('/login?next=%2Faccount');
    await page.getByLabel('Email').fill(ACCOUNTS.user.email);
    await page.getByLabel('Password').fill(ACCOUNTS.user.password);
    await page.getByRole('button', { name: 'Log in' }).click();
    await expect(page).toHaveURL('/account');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My profile');
  });

  test('an ordinary user cannot open the admin area', async ({ page }) => {
    await login(page, ACCOUNTS.user);
    await expect(page).toHaveURL('/');
    await page.goto('/admin');
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Admin access only.')).toBeVisible();
  });

  test('an admin lands on the admin dashboard and sees the admin menu item', async ({ page }) => {
    await login(page, ACCOUNTS.admin);
    await expect(page).toHaveURL('/admin');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dashboard');
    await openUserMenu(page, ACCOUNTS.admin.name);
    await expect(page.getByRole('menuitem', { name: 'Admin dashboard' })).toBeVisible();
  });

  test('forgot password always shows the same confirmation', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.getByLabel('Email').fill('nobody-here@e2e.test');
    await page.getByRole('button', { name: 'Send reset link' }).click();
    await expect(page.getByText(/If an account exists for this email/)).toBeVisible();
  });

  test('Google sign-in errors from the API are explained on the login page', async ({ page }) => {
    await page.goto('/login?error=google_cancelled');
    await expect(contentAlert(page)).toHaveText('Google sign-in was cancelled.');
  });

  test('reset page without a token explains what to do', async ({ page }) => {
    await page.goto('/reset-password');
    await expect(contentAlert(page)).toContainText('This reset link is incomplete');
  });
});

test.describe('accessibility of auth pages', () => {
  for (const path of ['/login', '/register', '/forgot-password', '/reset-password?token=abc']) {
    test(`${path} has no serious axe violations`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoSeriousA11yViolations(page);
    });
  }

  test('/account has no serious axe violations', async ({ page }) => {
    await login(page, ACCOUNTS.user);
    await expect(page).toHaveURL('/');
    await page.goto('/account');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('My profile');
    await expectNoSeriousA11yViolations(page);
  });
});
