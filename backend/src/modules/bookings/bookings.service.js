import mongoose from 'mongoose';
import { EXPIRE_BATCH_SIZE, MAX_PENDING_BOOKINGS } from '../../config/bookings.js';
import { ERROR_CODES } from '../../config/constants.js';
import { SEAT_HOLDING_STATUSES, UPCOMING_DEPARTURE_STATUSES } from '../../config/tours.js';
import { Booking } from '../../models/Booking.js';
import { Payment } from '../../models/Payment.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { AppError } from '../../utils/app-error.js';
import { bookingReference } from '../../utils/booking-reference.js';
import { addDays, todayIst } from '../../utils/dates.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { recordAudit } from '../audit/audit.service.js';
import { enqueueNotification } from '../notifications/notifications.service.js';
import { bookingClosesAt } from '../tours/departure-state.js';
import { syncFullStatus } from '../tours/departures.service.js';
import { assertTransition, timelineEntry } from './transitions.js';

const TOUR_FIELDS = 'title slug status durationDays images';

/* ---------- helpers ---------- */

async function releaseSeats(departureId, seats, session) {
  await TourDeparture.updateOne(
    { _id: departureId },
    { $inc: { seatsAvailable: seats } },
    session ? { session } : {},
  );
}

async function uniqueReference(now) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const reference = bookingReference(now);
    if (!(await Booking.exists({ bookingReference: reference }))) return reference;
  }
  throw new AppError(500, ERROR_CODES.INTERNAL_ERROR, 'Could not create a booking reference');
}

function seatsUnavailable(seatsAvailable) {
  return new AppError(
    409,
    ERROR_CODES.SEATS_UNAVAILABLE,
    seatsAvailable > 0
      ? `Only ${seatsAvailable} seat(s) are left on this date`
      : 'This date is full',
    { seatsAvailable },
  );
}

const departureClosed = (message = 'Booking for this date has closed') =>
  new AppError(410, ERROR_CODES.DEPARTURE_CLOSED, message);

/* ---------- create ---------- */

/**
 * POST /bookings (docs/05-features/04-booking-inventory.md "Booking creation"). Preconditions in
 * spec order, then one atomic seat hold. If the payment order or the database write fails, the
 * held seats are given back.
 * @returns {Promise<{ booking: any, payment: any, order: any }>}
 */
export async function createBooking(ctx, user, input, now = new Date()) {
  const departure = await TourDeparture.findById(input.departureId).populate('tour', TOUR_FIELDS);
  if (!departure?.tour || departure.tour.status !== 'published') {
    throw AppError.notFound('Departure not found');
  }
  if (['cancelled', 'completed'].includes(departure.status)) {
    throw departureClosed('This date is no longer running');
  }
  if (now >= bookingClosesAt(departure)) throw departureClosed();
  if (departure.status === 'full' || departure.seatsAvailable < input.seats) {
    throw seatsUnavailable(departure.status === 'full' ? 0 : departure.seatsAvailable);
  }

  const pending = await Booking.countDocuments({
    user: user._id,
    bookingStatus: 'pending',
    holdExpiresAt: { $gt: now },
  });
  if (pending >= MAX_PENDING_BOOKINGS) {
    throw AppError.conflict(
      ERROR_CODES.TOO_MANY_PENDING,
      `You already have ${pending} unpaid bookings. Pay for or cancel one first.`,
    );
  }

  // The hold: one conditional update, so parallel requests can never oversell.
  const held = await TourDeparture.findOneAndUpdate(
    { _id: departure._id, status: 'scheduled', seatsAvailable: { $gte: input.seats } },
    { $inc: { seatsAvailable: -input.seats } },
    { returnDocument: 'after' },
  );
  if (!held) {
    const fresh = await TourDeparture.findById(departure._id).select('seatsAvailable status');
    throw seatsUnavailable(fresh?.status === 'scheduled' ? fresh.seatsAvailable : 0);
  }
  await syncFullStatus(departure._id);
  const release = async () => {
    await releaseSeats(departure._id, input.seats);
    await syncFullStatus(departure._id);
  };

  const unitPrice = departure.price;
  const amount = unitPrice * input.seats;
  let reference;
  let order;
  try {
    reference = await uniqueReference(now);
    order = await ctx.providers.payments.createOrder({
      amountPaise: amount * 100,
      currency: 'INR',
      receipt: reference,
      notes: { bookingReference: reference },
    });
  } catch (error) {
    await release();
    if (error instanceof AppError) throw error;
    ctx.logger.error({ err: error.message }, 'Payment order creation failed');
    throw new AppError(502, ERROR_CODES.PROVIDER_ERROR, 'Could not start the payment. Try again.');
  }

  const holdExpiresAt = new Date(now.getTime() + ctx.env.HOLD_MINUTES * 60_000);
  let booking;
  try {
    booking = await Booking.create({
      bookingReference: reference,
      user: user._id,
      tour: departure.tour._id,
      departure: departure._id,
      snapshot: {
        tourTitle: departure.tour.title,
        tourSlug: departure.tour.slug,
        startDate: departure.startDate,
        endDate: departure.endDate,
        pickupCity: departure.pickupCity ?? null,
        durationDays: departure.tour.durationDays,
      },
      contact: input.contact,
      travellers: input.travellers,
      seats: input.seats,
      unitPrice,
      amount,
      currency: 'INR',
      bookingStatus: 'pending',
      paymentStatus: 'pending',
      razorpayOrderId: order.id,
      holdExpiresAt,
      timeline: [
        timelineEntry('created', {
          by: user._id,
          at: now,
          meta: { seats: input.seats, amount, holdExpiresAt },
        }),
      ],
    });
    const payment = await Payment.create({
      booking: booking._id,
      provider: ctx.providers.payments.name,
      providerOrderId: order.id,
      amount,
      amountPaise: amount * 100,
      currency: 'INR',
      status: 'created',
    });
    booking.tour = departure.tour; // populated, for the response
    return { booking, payment, order };
  } catch (error) {
    if (booking) await Booking.deleteOne({ _id: booking._id });
    await release();
    ctx.logger.error(
      { orderId: order.id, reference, err: error.message },
      'Booking not saved; payment order left orphaned',
    );
    throw error;
  }
}

/* ---------- read ---------- */

export async function listMyBookings(user, { status, page, limit }) {
  const filter = { user: user._id, ...(status && { bookingStatus: status }) };
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipFor({ page, limit }))
      .limit(limit)
      .populate('tour', TOUR_FIELDS),
    Booking.countDocuments(filter),
  ]);
  return { bookings, meta: pageMeta({ page, limit }, total) };
}

/** The owner or an admin sees the booking; everyone else gets 404 (no reference probing). */
export async function getBookingForViewer(viewer, reference) {
  const booking = await Booking.findOne({ bookingReference: reference }).populate(
    'tour',
    TOUR_FIELDS,
  );
  const allowed = booking && (booking.user.equals(viewer._id) || viewer.role === 'admin');
  if (!allowed) throw AppError.notFound('Booking not found');
  return booking;
}

export async function paymentsFor(bookingId) {
  return Payment.find({ booking: bookingId }).sort({ createdAt: 1 });
}

/* ---------- user cancellation ---------- */

/**
 * POST /bookings/:reference/cancel. Pending → cancelled at once (seats released). Confirmed →
 * cancellation_requested for the admin to process with the refund policy.
 */
export async function cancelByUser(ctx, user, reference, reason, req, now = new Date()) {
  const booking = await getBookingForViewer(user, reference);
  const from = booking.bookingStatus;

  if (from === 'pending') {
    const session = await mongoose.startSession();
    let cancelled = false;
    try {
      await session.withTransaction(async () => {
        const result = await Booking.updateOne(
          { _id: booking._id, bookingStatus: 'pending' },
          {
            $set: {
              bookingStatus: 'cancelled',
              cancelledAt: now,
              cancellation: { requestedAt: now, reason, departureCancelled: false },
            },
            $push: {
              timeline: timelineEntry('cancelled_by_user', {
                by: user._id,
                at: now,
                meta: { reason },
              }),
            },
          },
          { session },
        );
        cancelled = result.modifiedCount === 1;
        if (!cancelled) return;
        await releaseSeats(booking.departure, booking.seats, session);
        await Payment.updateMany(
          { booking: booking._id, status: 'created' },
          { $set: { status: 'failed', failureReason: 'cancelled_by_user' } },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    if (!cancelled) {
      // The status changed in the meantime (payment confirmed or hold expired).
      const fresh = await Booking.findById(booking._id).select('bookingStatus');
      assertTransition(fresh.bookingStatus, 'cancelled');
    }
    await syncFullStatus(booking.departure);
    await recordAudit({
      actor: user,
      action: 'booking.cancel_pending',
      entityType: 'Booking',
      entityId: booking._id,
      before: { bookingStatus: from },
      after: { bookingStatus: 'cancelled' },
      reason,
      req,
    });
    await enqueueNotification(ctx, {
      type: 'booking_cancelled',
      to: booking.contact.email,
      dedupeKey: `booking_cancelled:${booking._id}`,
      user: booking.user,
      booking: booking._id,
      payload: { bookingReference: booking.bookingReference },
    });
    return getBookingForViewer(user, reference);
  }

  if (from === 'confirmed') {
    assertTransition(from, 'cancellation_requested');
    const result = await Booking.updateOne(
      { _id: booking._id, bookingStatus: 'confirmed' },
      {
        $set: {
          bookingStatus: 'cancellation_requested',
          cancellation: { requestedAt: now, reason, departureCancelled: false },
        },
        $push: {
          timeline: timelineEntry('cancellation_requested', {
            by: user._id,
            at: now,
            meta: { reason },
          }),
        },
      },
    );
    if (result.modifiedCount !== 1) {
      const fresh = await Booking.findById(booking._id).select('bookingStatus');
      assertTransition(fresh.bookingStatus, 'cancellation_requested');
    }
    await recordAudit({
      actor: user,
      action: 'booking.cancellation_requested',
      entityType: 'Booking',
      entityId: booking._id,
      before: { bookingStatus: from },
      after: { bookingStatus: 'cancellation_requested' },
      reason,
      req,
    });
    if (ctx.env.ADMIN_NOTIFY_EMAIL) {
      await enqueueNotification(ctx, {
        type: 'cancellation_requested_admin',
        to: ctx.env.ADMIN_NOTIFY_EMAIL,
        dedupeKey: `cancellation_requested_admin:${booking._id}:${now.getTime()}`,
        booking: booking._id,
        payload: { bookingReference: booking.bookingReference, reason: reason ?? '' },
        user: booking.user,
      });
    }
    return getBookingForViewer(user, reference);
  }

  throw new AppError(
    409,
    ERROR_CODES.INVALID_TRANSITION,
    `A ${from.replaceAll('_', ' ')} booking cannot be cancelled here`,
    { from, to: 'cancelled' },
  );
}

/* ---------- jobs ---------- */

/**
 * Every minute: unpaid holds past holdExpiresAt expire and their seats return. Each booking is
 * its own transaction guarded by `bookingStatus: 'pending'`, so concurrent runs release seats
 * only once (TC-BOOK-09) and a crash mid-batch leaves the rest for the next run.
 */
export async function expireHolds(now = new Date()) {
  const due = await Booking.find({ bookingStatus: 'pending', holdExpiresAt: { $lt: now } })
    .select('_id departure seats')
    .limit(EXPIRE_BATCH_SIZE);
  let expired = 0;
  const touched = new Set();
  for (const booking of due) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const result = await Booking.updateOne(
          { _id: booking._id, bookingStatus: 'pending' },
          {
            $set: { bookingStatus: 'expired' },
            $push: { timeline: timelineEntry('expired', { at: now }) },
          },
          { session },
        );
        if (result.modifiedCount !== 1) return;
        await releaseSeats(booking.departure, booking.seats, session);
        await Payment.updateMany(
          { booking: booking._id, status: 'created' },
          { $set: { status: 'failed', failureReason: 'hold_expired' } },
          { session },
        );
        expired += 1;
        touched.add(booking.departure.toString());
      });
    } finally {
      await session.endSession();
    }
  }
  for (const id of touched) await syncFullStatus(id);
  return { expired };
}

/**
 * Hourly: check totalSeats = seatsAvailable + seats held by bookings for active departures.
 * Mismatches are reported (and fixed only with `fix`, used by the admin script).
 * @returns {Promise<{ checked: number, mismatches: { departureId: string, totalSeats: number, committed: number, seatsAvailable: number, expected: number }[] }>}
 */
export async function reconcileInventory({ fix = false, now = new Date() } = {}) {
  const departures = await TourDeparture.find({
    status: { $in: [...UPCOMING_DEPARTURE_STATUSES] },
    startDate: { $gte: addDays(todayIst(now), -1) },
  }).select('totalSeats seatsAvailable status');
  const rows = await Booking.aggregate([
    {
      $match: {
        departure: { $in: departures.map((d) => d._id) },
        bookingStatus: { $in: [...SEAT_HOLDING_STATUSES] },
      },
    },
    { $group: { _id: '$departure', committed: { $sum: '$seats' } } },
  ]);
  const committedBy = new Map(rows.map((r) => [r._id.toString(), r.committed]));
  const mismatches = [];
  for (const d of departures) {
    const committed = committedBy.get(d._id.toString()) ?? 0;
    const expected = d.totalSeats - committed;
    if (expected !== d.seatsAvailable) {
      mismatches.push({
        departureId: d._id.toString(),
        totalSeats: d.totalSeats,
        committed,
        seatsAvailable: d.seatsAvailable,
        expected,
      });
      if (fix) {
        await TourDeparture.updateOne(
          { _id: d._id },
          { $set: { seatsAvailable: Math.max(0, expected) } },
        );
        await syncFullStatus(d._id);
      }
    }
  }
  return { checked: departures.length, mismatches };
}
