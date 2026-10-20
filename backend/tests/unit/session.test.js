import { describe, expect, it } from 'vitest';
import { parseEnv } from '../../src/config/env.js';
import {
  readOAuthState,
  sessionCookieOptions,
  setOAuthState,
  signSession,
  verifySession,
} from '../../src/modules/auth/session.js';
import { SignJWT } from 'jose';

const base = {
  MONGO_URL: 'mongodb://localhost/x',
  JWT_SECRET: 'unit-secret-unit-secret-unit-secret-1234',
};
const user = { _id: '64b7f0c2a1b2c3d4e5f60718', role: 'user', sessionVersion: 3 };

describe('session tokens', () => {
  it('round-trips subject, role and session version', async () => {
    const env = parseEnv(base);
    const claims = await verifySession(env, await signSession(env, user));
    expect(claims).toMatchObject({ sub: user._id, role: 'user', sv: 3 });
  });

  it('rejects tampered tokens and tokens signed with another secret', async () => {
    const env = parseEnv(base);
    const token = await signSession(env, user);
    expect(await verifySession(env, `${token.slice(0, -2)}xx`)).toBeNull();
    const other = parseEnv({ ...base, JWT_SECRET: 'another-secret-another-secret-12345678' });
    expect(await verifySession(other, token)).toBeNull();
  });

  it('accepts tokens from the previous secret during rotation', async () => {
    const oldEnv = parseEnv(base);
    const token = await signSession(oldEnv, user);
    const rotated = parseEnv({
      ...base,
      JWT_SECRET: 'brand-new-secret-brand-new-secret-123456',
      JWT_SECRET_PREVIOUS: base.JWT_SECRET,
    });
    expect(await verifySession(rotated, token)).toMatchObject({ sub: user._id });
  });

  it('OAuth state tokens are valid when read back (not minted already expired)', async () => {
    const env = parseEnv(base);
    const cookies = {};
    const res = { cookie: (name, value) => (cookies[name] = value) };
    const data = { state: 's', nonce: 'n', codeVerifier: 'v', next: '/account' };
    await setOAuthState(res, env, data);
    expect(await readOAuthState(env, cookies.by_oauth)).toEqual(data);
  });

  it('does not accept an OAuth-state token as a session (audience separation)', async () => {
    const env = parseEnv(base);
    const forged = await new SignJWT({ sv: 0 })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuer('bhaktiyatra-api')
      .setAudience('oauth-state')
      .setSubject(user._id)
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(base.JWT_SECRET));
    expect(await verifySession(env, forged)).toBeNull();
    expect(await readOAuthState(env, forged)).toBeNull();
  });
});

describe('TC-AUTH-11 cookie flags', () => {
  it('production: HttpOnly, Secure, SameSite=Lax, shared domain', () => {
    const env = parseEnv({ ...base, NODE_ENV: 'production', COOKIE_DOMAIN: '.bhaktiyatra.in' });
    expect(sessionCookieOptions(env)).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      domain: '.bhaktiyatra.in',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  });

  it('development: not Secure (plain http on localhost) and host-only', () => {
    const options = sessionCookieOptions(parseEnv(base));
    expect(options.secure).toBe(false);
    expect(options.domain).toBeUndefined();
  });
});
