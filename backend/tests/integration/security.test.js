import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { makeUser } from '../helpers/factories.js';
import { buildTestApp, clearTestDb, connectTestDb, disconnectTestDb } from '../helpers/test-app.js';

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(() => clearTestDb());

describe('trusted origin (CSRF defence in depth)', () => {
  const { app } = buildTestApp();
  const body = { email: 'x@example.com', password: 'whatever-1' };

  it('TC-SEC-02 refuses state-changing requests from a foreign Origin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .send(body);
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN_ORIGIN');
  });

  it('refuses cross-site browser requests that omit Origin', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('Sec-Fetch-Site', 'cross-site')
      .send(body);
    expect(res.status).toBe(403);
  });

  it('allows the configured frontend origin and safe methods from anywhere', async () => {
    await makeUser({ email: 'x@example.com' });
    const allowed = await request(app)
      .post('/api/v1/auth/login')
      .set('Origin', 'http://localhost:3000')
      .send(body);
    expect(allowed.status).toBe(401); // reached the handler (wrong password), not blocked
    const read = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(read.status).not.toBe(403);
  });

  it('TC-SEC-01 sends no CORS allow header to unlisted origins', async () => {
    const res = await request(app).get('/api/v1/health').set('Origin', 'https://evil.example');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
    const ok = await request(app).get('/api/v1/health').set('Origin', 'http://localhost:3000');
    expect(ok.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(ok.headers['access-control-allow-credentials']).toBe('true');
  });
});

describe('auth rate limit', () => {
  it('TC-AUTH-08 the 11th login attempt within the window gets 429', async () => {
    const { app } = buildTestApp({ RATE_LIMIT_ENABLED: 'true', RATE_LIMIT_AUTH_MAX: '10' });
    const statuses = [];
    for (let i = 0; i < 11; i += 1) {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'wrong-pass-1' });
      statuses.push(res.status);
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses[10]).toBe(429);
  });
});
