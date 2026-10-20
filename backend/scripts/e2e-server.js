/**
 * API server for Playwright: in-memory MongoDB replica set, seeded test accounts, port 5100.
 * Never points at a real database. Started by frontend/playwright.config.js.
 */
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { connectDb } from '../src/config/db.js';
import { parseEnv } from '../src/config/env.js';
import { createLogger } from '../src/config/logger.js';
import { User } from '../src/models/User.js';
import { hashPassword } from '../src/modules/auth/password.js';

export const E2E_ACCOUNTS = Object.freeze({
  admin: { email: 'admin@e2e.test', password: 'E2e-Admin-Pass-1', name: 'E2E Admin' },
  user: { email: 'user@e2e.test', password: 'E2e-User-Pass-1', name: 'E2E User' },
});

const PORT = Number(process.env.E2E_API_PORT ?? 5100);
const WEB = process.env.E2E_WEB_ORIGIN ?? 'http://localhost:3100';

const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const env = parseEnv({
  NODE_ENV: 'test',
  PORT: String(PORT),
  LOG_LEVEL: 'warn',
  MONGO_URL: replSet.getUri('bhaktiyatra_e2e'),
  FRONTEND_URLS: WEB,
  SITE_URL: WEB,
  JWT_SECRET: 'e2e-only-secret-that-is-at-least-32-characters-long',
  BCRYPT_ROUNDS: '4',
  RATE_LIMIT_ENABLED: 'false',
  JOBS_ENABLED: 'false',
});
const logger = createLogger({ level: env.LOG_LEVEL });
await connectDb(env.MONGO_URL, logger, { attempts: 1 });

for (const [role, account] of Object.entries(E2E_ACCOUNTS)) {
  await User.create({
    name: account.name,
    email: account.email,
    role,
    passwordHash: await hashPassword(account.password, env.BCRYPT_ROUNDS),
  });
}

const server = createApp({ env, logger }).listen(PORT, () => {
  process.stdout.write(`E2E API listening on http://localhost:${PORT}\n`);
});

const stop = async () => {
  server.close();
  await replSet.stop();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
