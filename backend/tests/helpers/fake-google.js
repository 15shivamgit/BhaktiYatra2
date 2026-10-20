import { vi } from 'vitest';

/**
 * In-memory stand-in for the Google provider. Tests set `claims` (or make exchange/verify
 * throw) before calling the callback route. The nonce from the auth URL is echoed back unless
 * a test overrides it.
 */
export function createFakeGoogle({ enabled = true } = {}) {
  const fake = {
    enabled,
    lastAuthParams: null,
    claims: {},
    authUrl: vi.fn((params) => {
      fake.lastAuthParams = params;
      const url = new URL('https://accounts.google.test/auth');
      url.searchParams.set('state', params.state);
      url.searchParams.set('nonce', params.nonce);
      url.searchParams.set('code_challenge', params.codeChallenge);
      return url.toString();
    }),
    exchangeCode: vi.fn(async () => 'fake-id-token'),
    verifyIdToken: vi.fn(async () => ({
      sub: 'google-sub-1',
      email: 'pilgrim@gmail.com',
      email_verified: true,
      name: 'Pilgrim Gupta',
      picture: 'https://lh3.googleusercontent.com/a/photo',
      nonce: fake.lastAuthParams?.nonce,
      ...fake.claims,
    })),
  };
  return fake;
}
