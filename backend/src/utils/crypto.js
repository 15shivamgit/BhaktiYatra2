import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

/** Random URL-safe token. 32 bytes → 43 characters. */
export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function sha256Hex(value) {
  return createHash('sha256').update(value).digest('hex');
}

/** PKCE S256 challenge for a verifier (RFC 7636). */
export function pkceChallenge(verifier) {
  return createHash('sha256').update(verifier).digest('base64url');
}

/** Constant-time string comparison; false for different lengths or non-strings. */
export function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Escape a string for use inside a RegExp (user search input). */
export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
