import { errors, jwtVerify, SignJWT } from 'jose';
import { TICKET_VALID_DAYS_AFTER_START } from '../config/documents.js';
import { randomToken } from './crypto.js';

const AUDIENCE = 'bhaktiyatra:ticket';
const key = (secret) => new TextEncoder().encode(secret);

/**
 * QR ticket token: HS256 JWT { ref, dep } valid until a week after the departure starts.
 * Signed with TICKET_SIGNING_SECRET, separate from session JWTs. A random id makes every token
 * unique, so a regenerated ticket never repeats the old one.
 */
export function signTicketToken({ reference, departureId, startDate }, secret) {
  const exp = Math.floor(
    (new Date(startDate).getTime() + TICKET_VALID_DAYS_AFTER_START * 86_400_000) / 1000,
  );
  return new SignJWT({ ref: reference, dep: String(departureId) })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setJti(randomToken(8))
    .setAudience(AUDIENCE)
    .setExpirationTime(exp)
    .sign(key(secret));
}

/**
 * @returns {Promise<{ ok: true, ref: string, dep: string } | { ok: false, reason: 'expired_token' | 'not_found' }>}
 */
export async function verifyTicketToken(token, secret) {
  if (!secret || typeof token !== 'string' || token.length > 2000) {
    return { ok: false, reason: 'not_found' };
  }
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    return { ok: true, ref: payload.ref, dep: payload.dep };
  } catch (error) {
    return {
      ok: false,
      reason: error instanceof errors.JWTExpired ? 'expired_token' : 'not_found',
    };
  }
}
