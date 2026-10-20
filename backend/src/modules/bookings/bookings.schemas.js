import { z } from 'zod';
import { REFERENCE_PATTERN } from '../../config/bookings.js';
import { BOOKING_STATUSES, GENDERS } from '../../config/tours.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';
import { normalizePhone } from '../../utils/phone.js';

const text = (max) => z.string().trim().max(max);

const traveller = z
  .object({
    name: text(80).min(2, 'Enter the full name'),
    age: z.number().int().min(1).max(120),
    gender: z.enum(GENDERS),
  })
  .strict();

const phone = z
  .string()
  .trim()
  .transform((value, ctx) => {
    const normalised = normalizePhone(value);
    if (!normalised) {
      ctx.addIssue({
        code: 'custom',
        message: 'Enter a valid mobile number (10 digits for India)',
      });
      return z.NEVER;
    }
    return normalised;
  });

/**
 * POST /bookings. Prices are never accepted from the client: unit price and amount come from
 * the departure (TC-BOOK-02). Unknown keys such as `amount` are stripped, not rejected.
 * @param {number} maxSeats MAX_SEATS_PER_BOOKING
 */
export function createBookingSchema(maxSeats) {
  return {
    body: z
      .object({
        departureId: objectIdParam,
        seats: z.number().int().min(1).max(maxSeats, `At most ${maxSeats} seats per booking`),
        contact: z.object({
          name: text(80).min(2, 'Enter the full name'),
          email: z.email('Enter a valid email address').trim().toLowerCase().max(254),
          phone,
        }),
        travellers: z.array(traveller).min(1).max(maxSeats),
        acceptedTerms: z.literal(true, { error: 'Please accept the cancellation policy' }),
      })
      .refine((body) => body.travellers.length === body.seats, {
        message: 'Add details for every traveller',
        path: ['travellers'],
      }),
  };
}

export const referenceParam = z
  .string()
  .trim()
  .toUpperCase()
  .regex(REFERENCE_PATTERN, 'Invalid booking reference');

export const referenceSchema = { params: z.object({ reference: referenceParam }) };

export const myBookingsSchema = {
  query: z.object({
    ...paginationQuery,
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(BOOKING_STATUSES).optional(),
  }),
};

export const cancelSchema = {
  ...referenceSchema,
  body: z.object({ reason: text(500).optional() }).strict(),
};

export const simulateSchema = {
  ...referenceSchema,
  body: z.object({ outcome: z.enum(['success', 'failure']) }).strict(),
};

/** Idempotency-Key header: 8–100 visible characters (UUIDs recommended). */
export const idempotencyKey = z
  .string()
  .regex(/^[\x21-\x7e]{8,100}$/, 'Idempotency-Key must be 8–100 visible characters');
