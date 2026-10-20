import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globalSetup: ['tests/helpers/global-setup.js'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      RATE_LIMIT_ENABLED: 'false',
      JOBS_ENABLED: 'false',
      FRONTEND_URLS: 'http://localhost:3000',
      SITE_URL: 'http://localhost:3000',
      JWT_SECRET: 'test-only-secret-that-is-at-least-32-characters',
      BCRYPT_ROUNDS: '4',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.js'],
      exclude: ['src/server.js'],
    },
  },
});
