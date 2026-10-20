import { Router } from 'express';
import { z } from 'zod';
import { createRateLimiter } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { Booking } from '../../models/Booking.js';
import { toIstYmd } from '../../utils/dates.js';
import { verifyTicketToken } from '../../utils/ticket-token.js';

const VALID_STATUSES = new Set(['confirmed']);

/**
 * Verify a scanned ticket. Answers 200 either way (scanner-friendly) and never exposes
 * traveller names or contact details (TC-DOC-07).
 * @returns {Promise<object>}
 */
export async function verifyTicket(ctx, token) {
  const result = await verifyTicketToken(token, ctx.env.TICKET_SIGNING_SECRET);
  if (!result.ok) return { valid: false, reason: result.reason };
  const booking = await Booking.findOne({ bookingReference: result.ref }).select(
    'bookingReference snapshot seats travellers bookingStatus ticket',
  );
  // A regenerated ticket replaces the token, so old QR codes stop working.
  if (!booking || booking.ticket?.token !== token) return { valid: false, reason: 'not_found' };
  const base = {
    bookingReference: booking.bookingReference,
    tour: booking.snapshot.tourTitle,
    startDate: toIstYmd(booking.snapshot.startDate),
    endDate: toIstYmd(booking.snapshot.endDate),
    seats: booking.seats,
    travellerCount: booking.travellers.length,
    bookingStatus: booking.bookingStatus,
  };
  return VALID_STATUSES.has(booking.bookingStatus)
    ? { valid: true, ...base }
    : { valid: false, reason: 'cancelled', ...base };
}

/** GET /tickets/verify/:token (public, rate limited). */
export function ticketsRouter(ctx) {
  const router = Router();
  router.get(
    '/verify/:token',
    createRateLimiter({
      enabled: ctx.env.RATE_LIMIT_ENABLED,
      windowMs: 60_000,
      limit: ctx.env.RATE_LIMIT_TICKET_VERIFY_MAX,
    }),
    validate({ params: z.object({ token: z.string().min(10).max(2000) }) }),
    async (req, res) => {
      const data = await verifyTicket(ctx, req.valid.params.token);
      res.set('Cache-Control', 'no-store').json({ success: true, data });
    },
  );
  return router;
}
