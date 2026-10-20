import { ERROR_CODES } from '../../config/constants.js';
import { Booking } from '../../models/Booking.js';
import { Payment } from '../../models/Payment.js';
import { AppError } from '../../utils/app-error.js';
import { paymentSnapshot } from '../../utils/razorpay-signature.js';
import { recordAudit } from '../audit/audit.service.js';
import { timelineEntry } from '../bookings/transitions.js';
import { enqueueNotification } from '../notifications/notifications.service.js';
import { confirmBooking, recordPaymentFailure } from './payments.service.js';

const MINUTE = 60_000;

/** What is wrong with a provider payment for this booking, or null when it matches. */
export function paymentMismatch(entity, booking, orderId) {
  if (orderId && entity.order_id && entity.order_id !== orderId) return 'order_mismatch';
  if (entity.amount !== booking.amount * 100) return 'amount_mismatch';
  if ((entity.currency ?? 'INR') !== 'INR') return 'currency_mismatch';
  return null;
}

async function alertAdmin(ctx, booking, issue, details) {
  ctx.logger.error(
    { bookingId: booking._id.toString(), issue, ...details },
    'Payment needs attention',
  );
  await recordAudit({
    action: 'payment.issue',
    entityType: 'Booking',
    entityId: booking._id,
    after: { issue, ...details },
  });
  if (ctx.env.ADMIN_NOTIFY_EMAIL) {
    await enqueueNotification(ctx, {
      type: 'payment_issue_admin',
      to: ctx.env.ADMIN_NOTIFY_EMAIL,
      dedupeKey: `payment_issue_admin:${booking._id}:${issue}:${details.paymentId ?? ''}`,
      booking: booking._id,
      payload: { bookingReference: booking.bookingReference, issue, ...details },
    });
  }
}

async function addEventId(booking, orderId, eventId) {
  if (!eventId) return;
  await Payment.findOneAndUpdate(
    { booking: booking._id, providerOrderId: orderId },
    { $addToSet: { webhookEventIds: eventId } },
    { sort: { createdAt: -1 } },
  );
}

/* ---------- client verify ---------- */

/**
 * POST /payments/verify (docs/04-api/05-bookings-payments.md). The Checkout signature proves the
 * payment belongs to our order; the provider fetch confirms amount, currency and capture.
 * @returns {Promise<{ booking: any, state: string }>}
 */
export async function verifyFromClient(ctx, user, { orderId, paymentId, signature }) {
  const booking = await Booking.findOne({ razorpayOrderId: orderId });
  if (!booking || (!booking.user.equals(user._id) && user.role !== 'admin')) {
    throw AppError.notFound('Booking not found');
  }
  const provider = ctx.providers.payments;

  if (!provider.verifyPaymentSignature({ orderId, paymentId, signature })) {
    await Payment.findOneAndUpdate(
      { booking: booking._id, providerOrderId: orderId, status: { $in: ['created', 'failed'] } },
      { $set: { status: 'failed', failureReason: 'signature_mismatch' } },
      { sort: { createdAt: -1 } },
    );
    await Booking.updateOne(
      { _id: booking._id },
      { $push: { timeline: timelineEntry('payment_signature_invalid', { by: user._id }) } },
    );
    ctx.logger.warn({ bookingId: booking._id.toString() }, 'Payment signature mismatch');
    throw new AppError(400, ERROR_CODES.SIGNATURE_INVALID, 'The payment could not be verified');
  }

  let entity = null;
  try {
    entity = await provider.fetchPayment(paymentId);
  } catch (error) {
    // The signature already proves Razorpay issued this payment for our order.
    ctx.logger.warn(
      { paymentId, err: error.message },
      'Could not fetch payment; trusting signature',
    );
  }

  if (entity) {
    const mismatch = paymentMismatch(entity, booking, orderId);
    if (mismatch) {
      await alertAdmin(ctx, booking, mismatch, {
        paymentId,
        amountPaise: entity.amount,
        expectedPaise: booking.amount * 100,
      });
      throw new AppError(
        409,
        ERROR_CODES.AMOUNT_MISMATCH,
        'The payment does not match this booking',
      );
    }
    if (entity.status === 'authorized') {
      // Auto-capture finishes shortly; the payment.captured webhook confirms the booking.
      return { booking, state: 'pending_confirmation' };
    }
    if (entity.status !== 'captured') {
      await recordPaymentFailure(ctx, booking, {
        orderId,
        reason: entity.error_description ?? `status_${entity.status}`,
      });
      return { booking: await Booking.findById(booking._id), state: 'failed' };
    }
  }

  return confirmBooking(ctx, booking._id, {
    orderId,
    paymentId,
    via: 'client',
    method: entity?.method,
    signatureVerified: true,
    raw: paymentSnapshot(entity),
  });
}

/* ---------- webhooks ---------- */

async function onCaptured(ctx, payment, eventId) {
  const booking = await Booking.findOne({ razorpayOrderId: payment.order_id });
  if (!booking) return 'ignored_unknown_order';
  const mismatch = paymentMismatch(payment, booking, payment.order_id);
  if (mismatch) {
    await alertAdmin(ctx, booking, mismatch, {
      paymentId: payment.id,
      amountPaise: payment.amount,
      expectedPaise: booking.amount * 100,
    });
    await addEventId(booking, payment.order_id, eventId);
    return mismatch;
  }
  const { state } = await confirmBooking(ctx, booking._id, {
    orderId: payment.order_id,
    paymentId: payment.id,
    via: 'webhook',
    method: payment.method,
    signatureVerified: true,
    raw: paymentSnapshot(payment),
    eventId,
  });
  if (state === 'already_confirmed') await addEventId(booking, payment.order_id, eventId);
  return state;
}

async function onFailed(ctx, payment, eventId) {
  const booking = await Booking.findOne({ razorpayOrderId: payment.order_id });
  if (!booking) return 'ignored_unknown_order';
  await recordPaymentFailure(ctx, booking, {
    orderId: payment.order_id,
    reason: payment.error_description ?? payment.error_code ?? 'payment_failed',
  });
  await Payment.findOneAndUpdate(
    { booking: booking._id, providerOrderId: payment.order_id },
    { $set: { rawSnapshot: paymentSnapshot(payment) }, $addToSet: { webhookEventIds: eventId } },
    { sort: { createdAt: -1 } },
  );
  return 'payment_failed';
}

async function onRefund(ctx, refund, eventId, now) {
  const payment = await Payment.findOne({ providerPaymentId: refund.payment_id });
  if (!payment) return 'ignored_unknown_payment';
  const refundedPaise = (payment.refund?.amount ?? 0) * 100 + refund.amount;
  const full = refundedPaise >= payment.amountPaise;
  await Payment.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: full ? 'refunded' : payment.status,
        refund: {
          providerRefundId: refund.id,
          amount: refundedPaise / 100,
          status: refund.status ?? 'processed',
          at: now,
        },
      },
      $addToSet: { webhookEventIds: eventId },
    },
  );
  await Booking.updateOne(
    { _id: payment.booking },
    {
      $set: { paymentStatus: full ? 'refunded' : 'partially_refunded' },
      $push: {
        timeline: timelineEntry('refund_processed', {
          at: now,
          meta: { amount: refund.amount / 100 },
        }),
      },
    },
  );
  return full ? 'refunded' : 'partially_refunded';
}

/**
 * POST /webhooks/razorpay. Verifies the signature over the raw body, skips events already
 * processed (event ids stored on the Payment) and routes the rest. Unknown events are ignored.
 * @returns {Promise<{ event: string, result: string }>}
 */
export async function handleRazorpayWebhook(
  ctx,
  { rawBody, signature, eventId },
  now = new Date(),
) {
  if (!ctx.providers.payments.verifyWebhookSignature(rawBody, signature)) {
    throw new AppError(400, ERROR_CODES.SIGNATURE_INVALID, 'Invalid webhook signature');
  }
  let body;
  try {
    body = JSON.parse(rawBody.toString('utf8'));
  } catch {
    throw AppError.badRequest('Webhook body is not JSON');
  }
  const event = body?.event ?? 'unknown';
  const payment = body?.payload?.payment?.entity;
  const refund = body?.payload?.refund?.entity;
  const id = eventId || `${event}:${payment?.id ?? refund?.id ?? body?.created_at ?? 'none'}`;

  if (await Payment.exists({ webhookEventIds: id })) return { event, result: 'duplicate' };

  let result = 'ignored';
  if ((event === 'payment.captured' || event === 'order.paid') && payment) {
    result = await onCaptured(ctx, payment, id);
  } else if (event === 'payment.failed' && payment) {
    result = await onFailed(ctx, payment, id);
  } else if (event === 'refund.processed' && refund) {
    result = await onRefund(ctx, refund, id, now);
  }
  ctx.logger.info({ event, eventId: id, result }, 'Razorpay webhook processed');
  return { event, result };
}

/* ---------- reconciliation ---------- */

/**
 * Hourly (Should): unpaid bookings created 20–120 minutes ago are checked against Razorpay; a
 * captured payment we missed (lost webhook, failed verify call) is confirmed now.
 */
export async function reconcilePayments(ctx, now = new Date()) {
  const provider = ctx.providers.payments;
  if (provider.name !== 'razorpay') return { checked: 0, confirmed: 0 };
  const candidates = await Booking.find({
    paymentStatus: { $in: ['pending', 'failed'] },
    bookingStatus: { $in: ['pending', 'expired', 'cancelled'] },
    razorpayOrderId: { $exists: true },
    createdAt: { $gte: new Date(now - 120 * MINUTE), $lte: new Date(now - 20 * MINUTE) },
  }).limit(200);

  let confirmed = 0;
  for (const booking of candidates) {
    try {
      const payments = await provider.fetchOrderPayments(booking.razorpayOrderId);
      const captured = payments.find((p) => p.status === 'captured');
      if (!captured) continue;
      if (paymentMismatch(captured, booking, booking.razorpayOrderId)) {
        await alertAdmin(ctx, booking, 'amount_mismatch', { paymentId: captured.id });
        continue;
      }
      const { state } = await confirmBooking(ctx, booking._id, {
        orderId: booking.razorpayOrderId,
        paymentId: captured.id,
        via: 'reconcile',
        method: captured.method,
        signatureVerified: false,
        raw: paymentSnapshot(captured),
      });
      if (state !== 'already_confirmed') confirmed += 1;
    } catch (error) {
      ctx.logger.warn(
        { bookingId: booking._id.toString(), err: error.message },
        'Payment reconcile failed',
      );
    }
  }
  return { checked: candidates.length, confirmed };
}
