import { jwtVerify, SignJWT } from 'jose';
import {
  OAUTH_COOKIE,
  OAUTH_COOKIE_PATH,
  OAUTH_STATE_TTL_SEC,
  SESSION_COOKIE,
} from '../../config/constants.js';

const encoder = new TextEncoder();
const ISSUER = 'bhaktiyatra-api';

/** @typedef {import('../../config/env.js').Env} Env */

function keysFor(env) {
  const keys = [encoder.encode(env.JWT_SECRET)];
  if (env.JWT_SECRET_PREVIOUS) keys.push(encoder.encode(env.JWT_SECRET_PREVIOUS));
  return keys;
}

/**
 * Sign a short HS256 JWT. `audience` separates session tokens from OAuth state tokens so one
 * can never be replayed as the other.
 * @param {Env} env
 * @param {Record<string, unknown>} claims
 * @param {{ subject?: string, audience: string, expiresIn: string }} options
 *   `expiresIn` must be a duration string such as "7d" or "600s": jose reads a bare number as
 *   an absolute Unix timestamp, which would mint already-expired tokens.
 */
async function sign(env, claims, { subject, audience, expiresIn }) {
  let jwt = new SignJWT(claims)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setAudience(audience)
    .setIssuedAt()
    .setExpirationTime(expiresIn);
  if (subject) jwt = jwt.setSubject(subject);
  return jwt.sign(encoder.encode(env.JWT_SECRET));
}

/** Verify with the current secret, then the previous one during rotation. Null if invalid. */
async function verify(env, token, audience) {
  if (typeof token !== 'string' || token.length === 0) return null;
  for (const key of keysFor(env)) {
    try {
      const { payload } = await jwtVerify(token, key, {
        issuer: ISSUER,
        audience,
        algorithms: ['HS256'],
      });
      return payload;
    } catch {
      // try the next key
    }
  }
  return null;
}

/** @param {Env} env @param {{ _id: unknown, role: string, sessionVersion: number }} user */
export function signSession(env, user) {
  return sign(
    env,
    { role: user.role, sv: user.sessionVersion },
    { subject: String(user._id), audience: 'session', expiresIn: `${env.JWT_EXPIRES_IN_DAYS}d` },
  );
}

/** @returns {Promise<{ sub: string, role: string, sv: number } | null>} */
export async function verifySession(env, token) {
  const payload = await verify(env, token, 'session');
  if (!payload || typeof payload.sub !== 'string' || typeof payload.sv !== 'number') return null;
  return /** @type {any} */ (payload);
}

/** @param {Env} env */
export function sessionCookieOptions(env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production' || env.NODE_ENV === 'staging',
    sameSite: /** @type {const} */ ('lax'),
    path: '/',
    maxAge: env.JWT_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  };
}

/** Issue a session token for the user and set it as the session cookie. */
export async function startSession(res, env, user) {
  const token = await signSession(env, user);
  res.cookie(SESSION_COOKIE, token, sessionCookieOptions(env));
}

export function clearSession(res, env) {
  const { maxAge: _maxAge, ...options } = sessionCookieOptions(env);
  res.clearCookie(SESSION_COOKIE, options);
}

/* ---------- OAuth state cookie (Google sign-in) ---------- */

function oauthCookieOptions(env) {
  return {
    ...sessionCookieOptions(env),
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_STATE_TTL_SEC * 1000,
  };
}

/** @param {{ state: string, nonce: string, codeVerifier: string, next: string }} data */
export async function setOAuthState(res, env, data) {
  const token = await sign(env, data, {
    audience: 'oauth-state',
    expiresIn: `${OAUTH_STATE_TTL_SEC}s`,
  });
  res.cookie(OAUTH_COOKIE, token, oauthCookieOptions(env));
}

/** @returns {Promise<{ state: string, nonce: string, codeVerifier: string, next: string } | null>} */
export async function readOAuthState(env, token) {
  const payload = await verify(env, token, 'oauth-state');
  if (!payload) return null;
  const { state, nonce, codeVerifier, next } = /** @type {any} */ (payload);
  if ([state, nonce, codeVerifier, next].some((v) => typeof v !== 'string')) return null;
  return { state, nonce, codeVerifier, next };
}

export function clearOAuthState(res, env) {
  const { maxAge: _maxAge, ...options } = oauthCookieOptions(env);
  res.clearCookie(OAUTH_COOKIE, options);
}
