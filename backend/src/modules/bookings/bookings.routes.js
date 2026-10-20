import { Router } from 'express';
import { requireAuth } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { AppError } from '../../utils/app-error.js';
import { recordAudit } from '../audit/audit.service.js';
import { simulatePayment } from '../payments/payments.service.js';
import { toBookingDetail, toBookingSummary } from './bookings.mapper.js';
import * as schemas from './bookings.schemas.js';
import * as service from './bookings.service.js';
import { withIdempotency } from './idempotency.js';

/** Payment details the frontend needs to open Checkout (or the dev simulator). */
function paymentResponse(ctx, booking, order) {
  const { payments } = ctx.providers;
  const date = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(booking.snapshot.startDate);
  return {
    payment: {
      provider: payments.name,
      orderId: order.id,
      amountPaise: booking.amount * 100,
      currency: booking.currency,
      keyId: payments.keyId,
      simulate: payments.simulate,
    },
    checkout: {
      name: 'BhaktiYatra',
      description: `${booking.snapshot.tourTitle} · ${date} · ${booking.seats} seat(s)`,
      prefill: {
        name: booking.contact.name,
        email: booking.contact.email,
        contact: booking.contact.phone,
      },
    },
  };
}

/** What the booking page needs to show the right payment controls. */
const providerInfo = (ctx) => ({
  provider: ctx.providers.payments.name,
  keyId: ctx.providers.payments.keyId,
  simulate: ctx.providers.payments.simulate,
});

/** Booking endpoints for signed-in users (docs/04-api/05-bookings-payments.md). */
export function bookingsRouter(ctx) {
  const router = Router();
  const { env } = ctx;
  router.use(requireAuth(env), (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const bookingLimit = createRateLimiter({
    enabled: env.RATE_LIMIT_ENABLED,
    windowMs: env.RATE_LIMIT_BOOKING_WINDOW_MIN * 60_000,
    limit: env.RATE_LIMIT_BOOKING_MAX,
    keyGenerator: (req) => `booking:${req.user._id}`,
  });

  router.post(
    '/',
    bookingLimit,
    validate(schemas.createBookingSchema(env.MAX_SEATS_PER_BOOKING)),
    async (req, res) => {
      const header = req.get('Idempotency-Key');
      if (header !== undefined && !schemas.idempotencyKey.safeParse(header).success) {
        throw AppError.validation([
          {
            path: 'headers.idempotency-key',
            message: 'Idempotency-Key must be 8–100 visible characters',
          },
        ]);
      }
      const result = await withIdempotency(
        { userId: req.user._id, scope: 'POST /bookings', key: header, request: req.valid.body },
        async () => {
          const { booking, order } = await service.createBooking(ctx, req.user, req.valid.body);
          await recordCreation(booking, req);
          return {
            statusCode: 201,
            body: {
              success: true,
              data: { booking: toBookingSummary(booking), ...paymentResponse(ctx, booking, order) },
            },
          };
        },
      );
      if (result.replayed) res.set('Idempotent-Replayed', 'true');
      res
        .status(result.statusCode)
        .json({ ...result.body, meta: { serverTime: new Date().toISOString() } });
    },
  );

  router.get('/my', validate(schemas.myBookingsSchema), async (req, res) => {
    const { bookings, meta } = await service.listMyBookings(req.user, req.valid.query);
    res.json({
      success: true,
      data: bookings.map(toBookingSummary),
      meta: { ...meta, serverTime: new Date().toISOString() },
    });
  });

  router.get('/:reference', validate(schemas.referenceSchema), async (req, res) => {
    const booking = await service.getBookingForViewer(req.user, req.valid.params.reference);
    res.json({
      success: true,
      data: toBookingDetail(booking, await service.paymentsFor(booking._id)),
      meta: { serverTime: new Date().toISOString(), payment: providerInfo(ctx) },
    });
  });

  router.post('/:reference/cancel', validate(schemas.cancelSchema), async (req, res) => {
    const booking = await service.cancelByUser(
      ctx,
      req.user,
      req.valid.params.reference,
      req.valid.body.reason,
      req,
    );
    res.json({
      success: true,
      data: toBookingDetail(booking, await service.paymentsFor(booking._id)),
      meta: { serverTime: new Date().toISOString(), payment: providerInfo(ctx) },
    });
  });

  // Development and test only: the stub provider has no real checkout (ADR-031).
  if (ctx.providers.payments.simulate) {
    router.post(
      '/:reference/simulate-payment',
      validate(schemas.simulateSchema),
      async (req, res) => {
        const { booking, state } = await simulatePayment(
          ctx,
          req.user,
          req.valid.params.reference,
          req.valid.body.outcome,
        );
        res.json({
          success: true,
          data: {
            booking: toBookingDetail(booking, await service.paymentsFor(booking._id)),
            state,
          },
        });
      },
    );
  }

  return router;
}

function recordCreation(booking, req) {
  return recordAudit({
    actor: req.user,
    action: 'booking.create',
    entityType: 'Booking',
    entityId: booking._id,
    after: { reference: booking.bookingReference, seats: booking.seats, amount: booking.amount },
    req,
  });
}
