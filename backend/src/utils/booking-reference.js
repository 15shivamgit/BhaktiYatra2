import { randomInt } from 'node:crypto';
import { REFERENCE_ALPHABET } from '../config/bookings.js';
import { toIstYmd } from './dates.js';

/**
 * Human-friendly booking reference "BY-20260510-7K3QZ": the booking date in India plus five
 * random characters from an alphabet without look-alikes. Uniqueness is enforced by the index;
 * callers retry on the rare collision.
 */
export function bookingReference(now = new Date()) {
  const day = toIstYmd(now).replaceAll('-', '');
  let suffix = '';
  for (let i = 0; i < 5; i += 1) suffix += REFERENCE_ALPHABET[randomInt(REFERENCE_ALPHABET.length)];
  return `BY-${day}-${suffix}`;
}
