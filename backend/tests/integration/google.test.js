import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AuditLog } from '../../src/models/AuditLog.js';
import { User } from '../../src/models/User.js';
import { pkceChallenge } from '../../src/utils/crypto.js';
import { makeAdmin, makeUser } from '../helpers/factories.js';
import { createFakeGoogle } from '../helpers/fake-google.js';
import {
  buildTestApp,
  clearTestDb,
  connectTestDb,
  cookieFrom,
  disconnectTestDb,
} from '../helpers/test-app.js';

const SITE = 'http://localhost:3000';
let google;
let app;

beforeAll(() => connectTestDb());
afterAll(() => disconnectTestDb());
beforeEach(async () => {
  await clearTestDb();
  google = createFakeGoogle();
  ({ app } = buildTestApp({}, { providers: { google } }));
});

/** Run the start step and return the oauth cookie plus the state Google would echo back. */
async function start(next) {
  const res = await request(app)
    .get('/api/v1/auth/google')
    .query(next ? { next } : {});
  const cookie = cookieFrom(res, 'by_oauth');
  return { res, cookie: cookie?.split(';')[0], state: google.lastAuthParams?.state };
}

function callback(cookie, query) {
  const req = request(app).get('/api/v1/auth/google/callback').query(query);
  return cookie ? req.set('Cookie', cookie) : req;
}

describe('GET /auth/google', () => {
  it('redirects to Google with state, nonce and an S256 PKCE challenge, and sets a scoped cookie', async () => {
    const { res, cookie } = await start('/account');
    expect(res.status).toBe(302);
    const location = new URL(res.headers.location);
    expect(location.origin).toBe('https://accounts.google.test');
    const { state, nonce, codeChallenge } = google.lastAuthParams;
    expect(state.length).toBeGreaterThanOrEqual(32);
    expect(nonce.length).toBeGreaterThanOrEqual(32);
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const raw = cookieFrom(res, 'by_oauth');
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/Path=\/api\/v1\/auth\/google/);
    expect(cookie).toBeTruthy();
  });

  it('is 404 GOOGLE_DISABLED when credentials are not configured', async () => {
    ({ app } = buildTestApp({}, { providers: { google: createFakeGoogle({ enabled: false }) } }));
    const res = await request(app).get('/api/v1/auth/google');
    expect(res.status).toBe(404);
    expect(res.body.code).toBe('GOOGLE_DISABLED');
  });
});

describe('GET /auth/google/callback', () => {
  it('creates a new user, signs them in and redirects to the requested page', async () => {
    const { cookie, state } = await start('/account/bookings');
    const res = await callback(cookie, { code: 'auth-code', state, scope: 'openid email' });

    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${SITE}/account/bookings`);
    expect(cookieFrom(res, 'by_session')).toMatch(/HttpOnly/i);
    expect(cookieFrom(res, 'by_oauth')).toMatch(/Expires=Thu, 01 Jan 1970/);

    // The PKCE verifier sent to Google matches the challenge from the start step.
    const { codeVerifier } = google.exchangeCode.mock.calls[0][0];
    expect(pkceChallenge(codeVerifier)).toBe(google.lastAuthParams.codeChallenge);

    const user = await User.findOne({ email: 'pilgrim@gmail.com' }).select('+passwordHash');
    expect(user).toMatchObject({ name: 'Pilgrim Gupta', googleId: 'google-sub-1', role: 'user' });
    expect(user.passwordHash).toBeUndefined();
    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('links Google to an existing password account with the same verified email', async () => {
    const existing = await makeUser({ email: 'pilgrim@gmail.com' });
    const { cookie, state } = await start();
    const res = await callback(cookie, { code: 'c', state });
    expect(res.headers.location).toBe(`${SITE}/`);
    const linked = await User.findById(existing.id).select('+passwordHash');
    expect(linked.googleId).toBe('google-sub-1');
    expect(linked.passwordHash).toBeTruthy();
    expect(await User.countDocuments()).toBe(1);
  });

  it('signs in a returning Google user by googleId even if their Google email changed', async () => {
    const existing = await makeUser({
      email: 'old@gmail.com',
      googleId: 'google-sub-1',
      password: null,
    });
    google.claims = { email: 'new@gmail.com' };
    const { cookie, state } = await start();
    await callback(cookie, { code: 'c', state });
    expect(await User.countDocuments()).toBe(1);
    expect((await User.findById(existing.id)).lastLoginAt).toBeInstanceOf(Date);
  });

  it.each([
    ['user cancelled', { error: 'access_denied' }, 'google_cancelled'],
    ['other provider error', { error: 'server_error' }, 'google_failed'],
    ['state mismatch', { code: 'c', state: 'forged-state' }, 'google_failed'],
    ['missing code', {}, 'google_failed'],
  ])('redirects to login on %s', async (_label, query, reason) => {
    const { cookie, state } = await start();
    const res = await callback(cookie, { state, ...query });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${SITE}/login?error=${reason}`);
    expect(cookieFrom(res, 'by_session')).toBeUndefined();
  });

  it('fails without the state cookie (e.g. a link opened in another browser)', async () => {
    const { state } = await start();
    const res = await callback(undefined, { code: 'c', state });
    expect(res.headers.location).toBe(`${SITE}/login?error=google_failed`);
  });

  it('rejects an ID token with the wrong nonce or an unverified email', async () => {
    for (const claims of [{ nonce: 'replayed-nonce' }, { email_verified: false }]) {
      google.claims = claims;
      const { cookie, state } = await start();
      const res = await callback(cookie, { code: 'c', state });
      expect(res.headers.location).toBe(`${SITE}/login?error=google_failed`);
    }
    expect(await User.countDocuments()).toBe(0);
  });

  it('turns provider failures into google_failed instead of a 500', async () => {
    google.exchangeCode.mockRejectedValueOnce(new Error('network down'));
    const { cookie, state } = await start();
    const res = await callback(cookie, { code: 'c', state });
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe(`${SITE}/login?error=google_failed`);
  });

  it('blocks disabled accounts', async () => {
    await makeUser({ email: 'pilgrim@gmail.com', isActive: false });
    const { cookie, state } = await start();
    const res = await callback(cookie, { code: 'c', state });
    expect(res.headers.location).toBe(`${SITE}/login?error=account_disabled`);
  });

  it('never redirects off-site, whatever `next` says', async () => {
    for (const next of ['https://evil.example', '//evil.example', '/\\evil.example']) {
      const { cookie, state } = await start(next);
      const res = await callback(cookie, { code: 'c', state });
      expect(res.headers.location).toBe(`${SITE}/`);
    }
  });

  it('audits admin sign-ins through Google', async () => {
    const admin = await makeAdmin({ email: 'pilgrim@gmail.com' });
    const { cookie, state } = await start();
    await callback(cookie, { code: 'c', state });
    const entry = await AuditLog.findOne({ action: 'auth.admin_login', entityId: admin._id });
    expect(entry.after).toEqual({ method: 'google' });
  });
});
