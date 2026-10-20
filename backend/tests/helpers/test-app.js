import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import { inject } from 'vitest';
import { createApp } from '../../src/app.js';
import { parseEnv } from '../../src/config/env.js';
import { createLogger } from '../../src/config/logger.js';

/** Base URI of the shared in-memory replica set, with a unique database per caller. */
export function testMongoUrl() {
  const base = inject('mongoUri');
  const url = new URL(base);
  url.pathname = `/test_${randomUUID().slice(0, 8)}`;
  return url.toString();
}

/**
 * @param {Record<string, string>} [overrides] env overrides
 * @param {{ providers?: any }} [deps]
 */
export function buildTestApp(overrides = {}, { providers } = {}) {
  const env = parseEnv({ ...process.env, MONGO_URL: testMongoUrl(), ...overrides });
  const logger = createLogger({ level: 'silent' });
  return { app: createApp({ env, logger, providers }), env, logger };
}

export async function connectTestDb(url = testMongoUrl()) {
  await mongoose.connect(url);
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()));
  return mongoose.connection;
}

export async function clearTestDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function disconnectTestDb() {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
  }
  await mongoose.disconnect();
}

/** Cookie value set by a response, or undefined. */
export function cookieFrom(res, name) {
  const header = [res.headers['set-cookie'] ?? []].flat().find((c) => c.startsWith(`${name}=`));
  return header;
}
