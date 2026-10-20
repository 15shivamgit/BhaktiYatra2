import { describe, expect, it } from 'vitest';
import { EnvError, parseEnv } from '../../src/config/env.js';

const minimal = { MONGO_URL: 'mongodb://localhost:27017/bhaktiyatra_dev' };

describe('parseEnv', () => {
  it('applies defaults for a minimal valid environment', () => {
    const env = parseEnv(minimal);
    expect(env).toMatchObject({
      NODE_ENV: 'development',
      PORT: 5000,
      FRONTEND_URLS: ['http://localhost:3000'],
      RATE_LIMIT_ENABLED: true,
    });
  });

  it('reports a missing MONGO_URL as a readable problem, not a stack trace', () => {
    try {
      parseEnv({});
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvError);
      expect(error.problems).toContain('MONGO_URL is required');
    }
  });

  it('treats empty strings as unset', () => {
    expect(() => parseEnv({ MONGO_URL: '' })).toThrow(/MONGO_URL is required/);
  });

  it('collects several problems at once', () => {
    try {
      parseEnv({ MONGO_URL: 'postgres://x', PORT: 'abc', JWT_SECRET: 'short' });
      expect.unreachable();
    } catch (error) {
      expect(error.problems.length).toBe(3);
      expect(error.message).toMatch(/MONGO_URL must start with mongodb/);
      expect(error.message).toMatch(/JWT_SECRET must be at least 32 characters/);
      const port = error.problems.find((p) => p.startsWith('PORT'));
      expect(port).toBeDefined();
      expect(port).not.toMatch(/is required/);
    }
  });

  it('splits FRONTEND_URLS and rejects invalid origins', () => {
    const env = parseEnv({ ...minimal, FRONTEND_URLS: 'http://localhost:3000, https://a.example' });
    expect(env.FRONTEND_URLS).toEqual(['http://localhost:3000', 'https://a.example']);
    expect(() => parseEnv({ ...minimal, FRONTEND_URLS: 'not-a-url' })).toThrow(EnvError);
  });

  it('parses boolean flags', () => {
    expect(parseEnv({ ...minimal, RATE_LIMIT_ENABLED: 'false' }).RATE_LIMIT_ENABLED).toBe(false);
    expect(parseEnv({ ...minimal, JOBS_ENABLED: '1' }).JOBS_ENABLED).toBe(true);
  });
});
