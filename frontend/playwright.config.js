import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 3100;
const API_PORT = 5100;
const REVALIDATE_SECRET = 'e2e-revalidate-secret';
// E2E_API_PROXY=1 runs the site the way it is deployed (ADR-036): the browser calls /api/v1 on
// the site itself and Next.js forwards it to the API.
const PROXY = process.env.E2E_API_PROXY === '1';
const API = `http://localhost:${API_PORT}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: 0, // flaky tests get fixed, not retried (docs/10-testing/01-test-strategy.md)
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'chromium-mobile', use: { ...devices['Pixel 7'] } },
    // Cross-browser pass (Phase 9): `E2E_BROWSERS=all npm run test:e2e -w frontend`.
    ...(process.env.E2E_BROWSERS === 'all'
      ? [
          { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
          { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
          { name: 'webkit-mobile', use: { ...devices['iPhone 14'] } },
        ]
      : []),
  ],
  webServer: [
    {
      // API with an in-memory MongoDB and seeded accounts; never touches a real database.
      command: 'node ../backend/scripts/e2e-server.js',
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: {
        E2E_API_PORT: String(API_PORT),
        E2E_WEB_ORIGIN: `http://localhost:${WEB_PORT}`,
        E2E_REVALIDATE_SECRET: REVALIDATE_SECRET,
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      // Production build: closer to real deployments, and it does not clash with a developer's
      // `next dev` (Next 16 allows only one dev server per project directory).
      command: `node e2e/wait-for-api.mjs http://localhost:${API_PORT}/api/v1/health && npx next build && npx next start -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: {
        NEXT_PUBLIC_API_BASE_URL: PROXY ? '/api/v1' : `${API}/api/v1`,
        ...(PROXY && { API_PROXY_TARGET: API, API_BASE_URL_INTERNAL: `${API}/api/v1` }),
        NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
        NEXT_PUBLIC_FEATURE_BOOKING: 'true',
        REVALIDATE_SECRET,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
