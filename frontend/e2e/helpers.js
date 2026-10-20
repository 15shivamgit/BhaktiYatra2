import AxeBuilder from '@axe-core/playwright';
import { expect } from '@playwright/test';

/** Accounts seeded by backend/scripts/e2e-server.js. */
export const ACCOUNTS = {
  admin: { email: 'admin@e2e.test', password: 'E2e-Admin-Pass-1', name: 'E2E Admin' },
  user: { email: 'user@e2e.test', password: 'E2e-User-Pass-1', name: 'E2E User' },
};

/** Unique email per test run so parallel tests never collide. */
export function uniqueEmail(prefix = 'pilgrim') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
}

export async function login(page, { email, password }) {
  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();
}

/** The account menu button, named by the user's name (works on desktop and mobile). */
export function userMenuButton(page, name) {
  return page.getByRole('banner').getByRole('button', { name, exact: true });
}

export async function openUserMenu(page, name) {
  await userMenuButton(page, name).click();
}

/** Alerts inside page content (Next.js also renders a route announcer with role="alert"). */
export function contentAlert(page) {
  return page.getByRole('main').getByRole('alert');
}

/** Fail on serious or critical accessibility violations (NFR-A11Y-01). */
export async function expectNoSeriousA11yViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
  expect(
    serious.map(
      (v) =>
        `${v.id}: ${v.help} → ${v.nodes.map((n) => `${n.target.join(' ')} ${n.html.slice(0, 160)}`).join(' | ')}`,
    ),
    'serious/critical axe violations',
  ).toEqual([]);
}

const API = 'http://localhost:5100/api/v1';

/**
 * Register a fresh user through the API; the session cookie lands in the page's browser context,
 * so the page is signed in afterwards. Each test gets its own user (pending-booking limits).
 */
export async function registerUser(page, { name = 'Pilgrim Test' } = {}) {
  const email = uniqueEmail('booker');
  const res = await page.request.post(`${API}/auth/register`, {
    data: { name, email, password: 'E2e-Booker-Pass-1', phone: '9876543210' },
  });
  if (!res.ok()) throw new Error(`register failed: ${res.status()} ${await res.text()}`);
  return { name, email, password: 'E2e-Booker-Pass-1' };
}

/**
 * On phones the filter panel is collapsed behind a "Filters" button. A click that lands before
 * React has hydrated does nothing, so retry until the panel reports it is open.
 */
export async function openFilters(page) {
  if ((page.viewportSize()?.width ?? 1280) >= 1024) return; // always open from lg up
  const toggle = page.getByRole('button', { name: /^Filters/ });
  await expect(async () => {
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
  }).toPass({ timeout: 15_000 });
}
