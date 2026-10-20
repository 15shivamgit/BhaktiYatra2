import { createRemoteJWKSet, jwtVerify } from 'jose';

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const JWKS_URL = new URL('https://www.googleapis.com/oauth2/v3/certs');
const ISSUERS = ['https://accounts.google.com', 'accounts.google.com'];

let jwks;

/**
 * @typedef {object} GoogleProvider
 * @property {boolean} enabled
 * @property {(p: { state: string, nonce: string, codeChallenge: string }) => string} authUrl
 * @property {(p: { code: string, codeVerifier: string }) => Promise<string>} exchangeCode returns the ID token
 * @property {(idToken: string) => Promise<Record<string, any>>} verifyIdToken returns verified claims
 */

/**
 * Google OAuth 2.0 / OpenID Connect client (authorisation code + PKCE).
 * @param {{ clientId?: string, clientSecret?: string, redirectUri: string }} config
 * @returns {GoogleProvider}
 */
export function createGoogleProvider({ clientId, clientSecret, redirectUri }) {
  return {
    enabled: Boolean(clientId && clientSecret),

    authUrl({ state, nonce, codeChallenge }) {
      const url = new URL(AUTH_ENDPOINT);
      url.search = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        prompt: 'select_account',
        access_type: 'online',
      }).toString();
      return url.toString();
    },

    async exchangeCode({ code, codeVerifier }) {
      const res = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: codeVerifier,
        }),
        signal: AbortSignal.timeout(10_000),
      });
      // The body can describe the failure but is not logged: it may echo request details.
      if (!res.ok) throw new Error(`Google token exchange failed with status ${res.status}`);
      const json = await res.json();
      if (typeof json.id_token !== 'string') throw new Error('Google returned no ID token');
      return json.id_token;
    },

    async verifyIdToken(idToken) {
      jwks ??= createRemoteJWKSet(JWKS_URL);
      const { payload } = await jwtVerify(idToken, jwks, { issuer: ISSUERS, audience: clientId });
      return payload;
    },
  };
}
