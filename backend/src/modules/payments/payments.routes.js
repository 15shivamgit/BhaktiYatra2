import express, { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { toBookingSummary } from '../bookings/bookings.mapper.js';
import { handleRazorpayWebhook, verifyFromClient } from './razorpay.service.js';

const verifySchema = {
  body: z
    .object({
      razorpay_order_id: z.string().trim().min(6).max(64),
      razorpay_payment_id: z.string().trim().min(6).max(64),
      razorpay_signature: z
        .string()
        .trim()
        .regex(/^[a-f0-9]{64}$/i, 'Invalid signature'),
    })
    .strict(),
};

/** POST /payments/verify: Checkout success handler (signed-in owner). */
export function paymentsRouter(ctx) {
  const router = Router();
  router.post('/verify', requireAuth(ctx.env), validate(verifySchema), async (req, res) => {
    const { booking, state } = await verifyFromClient(ctx, req.user, {
      orderId: req.valid.body.razorpay_order_id,
      paymentId: req.valid.body.razorpay_payment_id,
      signature: req.valid.body.razorpay_signature,
    });
    await booking.populate('tour', 'title slug images');
    res.set('Cache-Control', 'no-store').json({
      success: true,
      data: { booking: toBookingSummary(booking), state },
    });
  });
  return router;
}

/**
 * POST /webhooks/razorpay. Mounted before express.json() and the origin check: the signature is
 * computed over the raw body, and Razorpay sends no browser Origin.
 */
export function razorpayWebhookRouter(ctx) {
  const router = Router();
  router.post(
    '/',
    createRateLimiter({
      enabled: ctx.env.RATE_LIMIT_ENABLED,
      windowMs: 60_000,
      limit: ctx.env.RATE_LIMIT_WEBHOOK_MAX,
    }),
    express.raw({ type: '*/*', limit: '1mb' }),
    async (req, res) => {
      const result = await handleRazorpayWebhook(ctx, {
        rawBody: Buffer.isBuffer(req.body) ? req.body : Buffer.from(''),
        signature: req.get('x-razorpay-signature'),
        eventId: req.get('x-razorpay-event-id'),
      });
      res.json({ success: true, data: result });
    },
  );
  return router;
}
