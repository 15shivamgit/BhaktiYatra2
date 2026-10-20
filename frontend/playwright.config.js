import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 3100;
const API_PORT = 5100;

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
  ],
  webServer: [
    {
      // API with an in-memory MongoDB and seeded accounts; never touches a real database.
      command: 'node ../backend/scripts/e2e-server.js',
      url: `http://localhost:${API_PORT}/api/v1/health`,
      env: { E2E_API_PORT: String(API_PORT), E2E_WEB_ORIGIN: `http://localhost:${WEB_PORT}` },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
    {
      // Production build: closer to real deployments, and it does not clash with a developer's
      // `next dev` (Next 16 allows only one dev server per project directory).
      command: `npx next build && npx next start -p ${WEB_PORT}`,
      url: `http://localhost:${WEB_PORT}`,
      env: {
        NEXT_PUBLIC_API_BASE_URL: `http://localhost:${API_PORT}/api/v1`,
        NEXT_PUBLIC_SITE_URL: `http://localhost:${WEB_PORT}`,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
    },
  ],
});
