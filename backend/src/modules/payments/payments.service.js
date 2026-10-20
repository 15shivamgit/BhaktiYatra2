import mongoose from 'mongoose';
import { ERROR_CODES } from '../../config/constants.js';
import { Booking } from '../../models/Booking.js';
import { Payment } from '../../models/Payment.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { AppError } from '../../utils/app-error.js';
import { randomToken } from '../../utils/crypto.js';
import { recordAudit } from '../audit/audit.service.js';
import { getBookingForViewer } from '../bookings/bookings.service.js';
import { assertTransition, timelineEntry } from '../bookings/transitions.js';
import { issueDocumentsQuietly } from '../documents/documents.service.js';
import { enqueueNotification } from '../notifications/notifications.service.js';
import { syncFullStatus } from '../tours/departures.service.js';

/**
 * Idempotent confirmation (docs/04-api/05-bookings-payments.md "confirmBooking"). Called by the
 * dev payment simulator now and by Razorpay verify and webhooks in Phase 6.
 *
 * - pending → confirmed
 * - expired or cancelled (late payment) → re-hold seats: confirmed ("confirmed_late"), or
 *   payment_received_no_seats when the date filled up meanwhile
 * - already paid, or this provider payment already captured → "already_confirmed", no writes
 *
 * @param {{ logger: any, env: any }} ctx
 * @param {unknown} bookingId
 * @param {{ orderId?: string, paymentId: string, via: 'client' | 'webhook' | 'manual',
 *   method?: string, signatureVerified?: boolean, raw?: object, eventId?: string }} payment
 * @returns {Promise<{ booking: any, state: 'confirmed' | 'confirmed_late' | 'payment_received_no_seats' | 'already_confirmed' }>}
 */
export async function confirmBooking(ctx, bookingId, payment, now = new Date()) {
  const session = await mongoose.startSession();
  let state;
  let booking;
  try {
    await session.withTransaction(async () => {
      state = undefined;
      const captured = await Payment.findOne({
        providerPaymentId: payment.paymentId,
        status: 'captured',
      }).session(session);
      booking = await Booking.findById(bookingId).session(session);
      if (!booking) throw AppError.notFound('Booking not found');
      if (captured || booking.paymentStatus === 'paid') {
        state = 'already_confirmed';
        return;
      }

      const from = booking.bookingStatus;
      let to;
      if (from === 'pending') {
        to = 'confirmed';
        state = 'confirmed';
      } else if (from === 'expired' || from === 'cancelled') {
        const rehold = await TourDeparture.updateOne(
          {
            _id: booking.departure,
            status: { $in: ['scheduled', 'full'] },
            seatsAvailable: { $gte: booking.seats },
          },
          { $inc: { seatsAvailable: -booking.seats } },
          { session },
        );
        to = rehold.modifiedCount === 1 ? 'confirmed' : 'payment_received_no_seats';
        state = to === 'confirmed' ? 'confirmed_late' : 'payment_received_no_seats';
      } else {
        to = 'confirmed';
      }
      assertTransition(from, to);

      booking.bookingStatus = to;
      booking.paymentStatus = 'paid';
      if (to === 'confirmed') booking.confirmedAt = now;
      booking.timeline.push(
        timelineEntry('payment_captured', { at: now, meta: { state } }),
        timelineEntry(state === 'confirmed' ? 'confirmed' : state, { at: now }),
      );
      await booking.save({ session });

      const update = {
        $set: {
          providerPaymentId: payment.paymentId,
          status: 'captured',
          capturedAt: now,
          method: payment.method,
          signatureVerified: Boolean(payment.signatureVerified),
          verifiedVia: payment.via,
          ...(payment.raw && { rawSnapshot: payment.raw }),
        },
        ...(payment.eventId && { $addToSet: { webhookEventIds: payment.eventId } }),
      };
      const existing = await Payment.findOneAndUpdate(
        { booking: booking._id, ...(payment.orderId && { providerOrderId: payment.orderId }) },
        update,
        { session, sort: { createdAt: -1 } },
      );
      if (!existing) {
        throw new AppError(409, ERROR_CODES.CONFLICT, 'No payment order matches this booking');
      }
    });
  } finally {
    await session.endSession();
  }

  if (state === 'already_confirmed') return { booking, state };

  await syncFullStatus(booking.departure);
  await recordAudit({
    action: 'booking.payment_captured',
    entityType: 'Booking',
    entityId: booking._id,
    after: { bookingStatus: booking.bookingStatus, state, via: payment.via },
  });
  if (state === 'payment_received_no_seats') {
    ctx.logger.error({ bookingId: booking._id.toString() }, 'Payment received but no seats left');
    await enqueueNotification(ctx, {
      type: 'payment_received_no_seats',
      to: booking.contact.email,
      dedupeKey: `payment_received_no_seats:${booking._id}`,
      user: booking.user,
      booking: booking._id,
      payload: { bookingReference: booking.bookingReference },
    });
  } else {
    // Invoice number and ticket token now; the email job attaches the PDFs.
    await issueDocumentsQuietly(ctx, booking._id);
    await enqueueNotification(ctx, {
      type: 'booking_confirmed',
      to: booking.contact.email,
      dedupeKey: `booking_confirmed:${booking._id}`,
      user: booking.user,
      booking: booking._id,
      payload: { bookingReference: booking.bookingReference },
    });
  }
  return { booking, state };
}

/** A failed attempt: the booking stays pending (the user may retry until the hold ends). */
export async function recordPaymentFailure(ctx, booking, { orderId, reason }, now = new Date()) {
  await Payment.updateOne(
    { booking: booking._id, providerOrderId: orderId, status: { $in: ['created', 'authorized'] } },
    { $set: { status: 'failed', failureReason: reason } },
  );
  await Booking.updateOne(
    { _id: booking._id, bookingStatus: 'pending', paymentStatus: { $in: ['pending', 'failed'] } },
    {
      $set: { paymentStatus: 'failed' },
      $push: { timeline: timelineEntry('payment_failed', { at: now, meta: { reason } }) },
    },
  );
}

/**
 * Development and test only: pretend the provider reported success or failure for the latest
 * order of a booking. The route exists only while the stub provider allows simulation.
 */
export async function simulatePayment(ctx, viewer, reference, outcome) {
  if (!ctx.providers.payments.simulate) throw AppError.notFound('Not found');
  const booking = await getBookingForViewer(viewer, reference);
  const latest = await Payment.findOne({ booking: booking._id }).sort({ createdAt: -1 });
  if (!latest) throw AppError.notFound('No payment order for this booking');

  if (outcome === 'failure') {
    if (booking.bookingStatus !== 'pending') {
      throw new AppError(409, ERROR_CODES.INVALID_TRANSITION, 'Only unpaid bookings can fail');
    }
    // A retry after a failure gets a fresh order attempt, as Razorpay Checkout would.
    await recordPaymentFailure(ctx, booking, {
      orderId: latest.providerOrderId,
      reason: 'simulated_failure',
    });
    if (latest.status !== 'failed') {
      await Payment.create({
        booking: booking._id,
        provider: latest.provider,
        providerOrderId: latest.providerOrderId,
        amount: latest.amount,
        amountPaise: latest.amountPaise,
        status: 'created',
      });
    }
    return { booking: await getBookingForViewer(viewer, reference), state: 'payment_failed' };
  }

  const result = await confirmBooking(ctx, booking._id, {
    orderId: latest.providerOrderId,
    paymentId: `pay_stub_${randomToken(10)}`,
    via: 'client',
    method: 'stub',
    signatureVerified: false,
  });
  return { booking: await getBookingForViewer(viewer, reference), state: result.state };
}
