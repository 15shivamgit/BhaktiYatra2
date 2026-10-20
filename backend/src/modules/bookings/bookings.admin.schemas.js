import { z } from 'zod';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../../config/tours.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';
import { ymd } from '../tours/tours.schemas.js';

/** Admin booking endpoints (docs/04-api/05-bookings-payments.md "Admin: bookings and payments"). */

export const ADMIN_BOOKING_SORTS = Object.freeze({
  '-createdAt': { createdAt: -1 },
  createdAt: { createdAt: 1 },
  startDate: { 'snapshot.startDate': 1, createdAt: -1 },
  '-amount': { amount: -1, createdAt: -1 },
});

export const MANUAL_PAYMENT_METHODS = Object.freeze([
  'upi',
  'bank_transfer',
  'cash',
  'card',
  'other',
]);
export const REFUND_METHODS = Object.freeze(['razorpay', 'bank', 'none']);

const reason = z.string().trim().max(500).optional();

export const listAdminBookingsSchema = {
  query: z.object({
    ...paginationQuery,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().max(100).optional(),
    bookingStatus: z.enum(BOOKING_STATUSES).optional(),
    paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
    tour: objectIdParam.optional(),
    departure: objectIdParam.optional(),
    user: objectIdParam.optional(),
    from: ymd.optional(),
    to: ymd.optional(),
    sort: z.enum(Object.keys(ADMIN_BOOKING_SORTS)).default('-createdAt'),
    format: z.enum(['json', 'csv']).default('json'),
  }),
};

export const bookingIdSchema = { params: z.object({ id: objectIdParam }) };

/** `reason` is checked by the service so a missing one answers 422 REASON_REQUIRED. */
export const changeStatusSchema = {
  ...bookingIdSchema,
  body: z
    .object({
      to: z.enum(['confirmed', 'cancelled']),
      reason,
      manualPayment: z
        .object({
          reference: z.string().trim().min(3, 'Enter the payment reference').max(100),
          method: z.enum(MANUAL_PAYMENT_METHODS),
          amount: z.number().int().min(1),
        })
        .strict()
        .optional(),
    })
    .strict(),
};

export const adminCancelSchema = {
  ...bookingIdSchema,
  body: z
    .object({
      reason,
      refund: z
        .object({
          amount: z.number().int().min(0),
          reference: z.string().trim().max(100).optional(),
          method: z.enum(REFUND_METHODS),
        })
        .strict()
        .optional(),
    })
    .strict(),
};

export const addNoteSchema = {
  ...bookingIdSchema,
  body: z.object({ text: z.string().trim().min(1, 'Write a note').max(1000) }).strict(),
};
