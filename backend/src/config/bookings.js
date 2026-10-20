/** Booking rules (docs/05-features/04-booking-inventory.md, 07-content/05-cancellation-refund-policy.md). */

/** A user may hold seats in at most this many unpaid bookings at once (prevents hoarding). */
export const MAX_PENDING_BOOKINGS = 3;

/** Idempotency-Key replays are honoured for this long. */
export const IDEMPOTENCY_TTL_MIN = 10;

/** The expiry job handles at most this many bookings per run; the next run takes the rest. */
export const EXPIRE_BATCH_SIZE = 200;

export const PAYMENT_RECORD_STATUSES = Object.freeze([
  'created',
  'authorized',
  'captured',
  'failed',
  'refunded',
]);
export const PAYMENT_VERIFIED_VIA = Object.freeze(['client', 'webhook', 'manual', 'reconcile']);

/**
 * Traveller cancellation charges. daysBefore = whole days between the request (IST day) and the
 * departure start date. The first slab whose minDaysBefore fits applies.
 */
export const CANCELLATION_SLABS = Object.freeze([
  { minDaysBefore: 30, chargePct: 10 },
  { minDaysBefore: 15, chargePct: 25 },
  { minDaysBefore: 7, chargePct: 50 },
  { minDaysBefore: 3, chargePct: 75 },
  { minDaysBefore: 0, chargePct: 100 }, // less than 72 hours, or no-show
]);
export const REFUND_START_WORKING_DAYS = 7;

/** Booking reference: BY-YYYYMMDD-XXXXX without look-alike characters (0/O, 1/I/L). */
export const REFERENCE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
export const REFERENCE_PATTERN = /^BY-\d{8}-[2-9A-HJKMNP-Z]{5}$/;
