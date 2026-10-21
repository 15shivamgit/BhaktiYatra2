import { once } from 'node:events';
import mongoose from 'mongoose';
import { ERROR_CODES } from '../../config/constants.js';
import { AuditLog } from '../../models/AuditLog.js';
import { Booking } from '../../models/Booking.js';
import { NotificationLog } from '../../models/NotificationLog.js';
import { Payment } from '../../models/Payment.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex } from '../../utils/crypto.js';
import { addDays, istMidnight, toIstDateTime, toIstYmd } from '../../utils/dates.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { normalizePhone } from '../../utils/phone.js';
import { recordAudit } from '../audit/audit.service.js';
import { issueDocumentsQuietly, regenerateDocuments } from '../documents/documents.service.js';
import { enqueueNotification } from '../notifications/notifications.service.js';
import { confirmBooking } from '../payments/payments.service.js';
import { syncFullStatus } from '../tours/departures.service.js';
import { ADMIN_BOOKING_SORTS } from './bookings.admin.schemas.js';
import { releaseSeats } from './bookings.service.js';
import { assertTransition, timelineEntry } from './transitions.js';

/*
 * Admin booking operations (docs/04-api/05-bookings-payments.md "Admin: bookings and payments",
 * docs/05-features/04-booking-inventory.md state machine). Every change is conditional on the
 * status it was read in, so a payment or job running at the same moment can never be undone.
 */

const TOUR_FIELDS = 'title slug status durationDays images';
const SEAT_HOLDING = new Set(['pending', 'confirmed', 'cancellation_requested']);
const ADMIN_CANCELLABLE = new Set([
  'pending',
  'confirmed',
  'cancellation_requested',
  'payment_received_no_seats',
]);
/** CSV export stops here; narrow the filters for more. */
export const CSV_MAX_ROWS = 50_000;
/** Byte order mark: tells Excel the CSV is UTF-8. */
const BOM = String.fromCharCode(0xfeff);

const reasonRequired = () =>
  new AppError(422, ERROR_CODES.REASON_REQUIRED, 'Give a reason for this change', [
    { path: 'body.reason', message: 'Give a reason for this change' },
  ]);

function requireReason(reason) {
  if (!reason || reason.trim().length < 3) throw reasonRequired();
  return reason.trim();
}

/** Re-read the status after a conditional update matched nothing and explain why. */
async function explainStale(bookingId, to) {
  const fresh = await Booking.findById(bookingId).select('bookingStatus');
  assertTransition(fresh.bookingStatus, to);
  throw AppError.conflict(ERROR_CODES.CONFLICT, 'The booking changed meanwhile; reload it');
}

async function getBooking(id) {
  const booking = await Booking.findById(id);
  if (!booking) throw AppError.notFound('Booking not found');
  return booking;
}

/** What the admin may do now (the UI shows only these; the API enforces the same rules). */
export function allowedActions(booking) {
  const s = booking.bookingStatus;
  const actions = ['addNote'];
  if (s === 'pending') actions.push('markPaid');
  if (ADMIN_CANCELLABLE.has(s)) actions.push('cancel');
  if (s === 'cancellation_requested' && !booking.cancellation?.departureCancelled) {
    actions.push('rejectCancellation');
  }
  if (s === 'payment_received_no_seats') actions.push('confirmSeats');
  if (s === 'confirmed') actions.push('regenerateDocuments', 'resendConfirmation');
  return actions;
}

/* ---------- list and export ---------- */

/**
 * Search conditions for `q`. Recognisable input uses an index: a reference ("BY-…") or an email
 * ("name@…") is matched as a prefix, a phone number exactly. Anything else (a name, part of an
 * address) falls back to a case-insensitive match on every field, which scans.
 */
async function searchConditions(q) {
  if (/^BY-/i.test(q)) {
    return [{ bookingReference: new RegExp(`^${escapeRegex(q.toUpperCase())}`) }];
  }
  if (q.includes('@')) {
    const prefix = new RegExp(`^${escapeRegex(q.toLowerCase())}`);
    const users = await User.find({ email: prefix }).select('_id').limit(50);
    return [
      { 'contact.email': prefix },
      ...(users.length ? [{ user: { $in: users.map((u) => u._id) } }] : []),
    ];
  }
  const phone = normalizePhone(q);
  if (phone) return [{ 'contact.phone': phone }];

  const pattern = new RegExp(escapeRegex(q), 'i');
  const or = [
    { bookingReference: pattern },
    { 'contact.email': pattern },
    { 'contact.name': pattern },
    { 'contact.phone': pattern },
  ];
  // Part of a number ("98765") still finds +919876543210.
  const digits = q.replace(/\D/g, '');
  if (digits.length >= 5) or.push({ 'contact.phone': new RegExp(digits.slice(-10)) });
  const users = await User.find({ email: pattern }).select('_id').limit(50);
  if (users.length) or.push({ user: { $in: users.map((u) => u._id) } });
  return or;
}

async function buildFilter({ q, bookingStatus, paymentStatus, tour, departure, user, from, to }) {
  const filter = {};
  if (bookingStatus) filter.bookingStatus = bookingStatus;
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (tour) filter.tour = tour;
  if (departure) filter.departure = departure;
  if (user) filter.user = user;
  if (from || to) {
    filter.createdAt = {
      ...(from && { $gte: istMidnight(from) }),
      ...(to && { $lt: addDays(istMidnight(to), 1) }),
    };
  }
  if (q) filter.$or = await searchConditions(q);
  return filter;
}

export async function listBookingsAdmin(query) {
  const filter = await buildFilter(query);
  const { page, limit, sort } = query;
  const [bookings, total] = await Promise.all([
    Booking.find(filter)
      .sort(ADMIN_BOOKING_SORTS[sort])
      .skip(skipFor({ page, limit }))
      .limit(limit)
      .populate('tour', TOUR_FIELDS)
      .populate('user', 'name email'),
    Booking.countDocuments(filter),
  ]);
  return { bookings, meta: pageMeta({ page, limit }, total) };
}

const CSV_COLUMNS = [
  ['Reference', (b) => b.bookingReference],
  ['Created (IST)', (b) => toIstDateTime(b.createdAt)],
  ['Tour', (b) => b.snapshot.tourTitle],
  ['Start date', (b) => toIstYmd(b.snapshot.startDate)],
  ['End date', (b) => toIstYmd(b.snapshot.endDate)],
  ['Pickup city', (b) => b.snapshot.pickupCity ?? ''],
  ['Contact name', (b) => b.contact.name],
  ['Contact email', (b) => b.contact.email],
  ['Contact phone', (b) => b.contact.phone],
  ['Account email', (b) => b.user?.email ?? ''],
  ['Seats', (b) => b.seats],
  ['Travellers', (b) => b.travellers.length],
  ['Amount (INR)', (b) => b.amount],
  ['Booking status', (b) => b.bookingStatus],
  ['Payment status', (b) => b.paymentStatus],
  ['Refund (INR)', (b) => b.cancellation?.refundAmount ?? ''],
  ['Invoice number', (b) => b.invoice?.number ?? ''],
];

/**
 * One CSV cell. Quotes when needed, and neutralises values a spreadsheet would run as a formula
 * (=, +, -, @ at the start), such as a contact name typed as "=HYPERLINK(...)".
 */
export function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const csvRow = (cells) => `${cells.map(csvCell).join(',')}\r\n`;

/**
 * Stream the filtered bookings as CSV: UTF-8 with a byte order mark so Excel shows Hindi names
 * and ₹ correctly, CRLF line ends, one row at a time (never the whole list in memory).
 * @param {import('express').Response} res
 */
export async function streamBookingsCsv(query, res, now = new Date()) {
  const filter = await buildFilter(query);
  res.set({
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="bookings-${toIstYmd(now)}.csv"`,
    'Cache-Control': 'no-store',
  });
  res.write(`${BOM}${csvRow(CSV_COLUMNS.map(([title]) => title))}`);
  const cursor = Booking.find(filter)
    .sort(ADMIN_BOOKING_SORTS[query.sort])
    .limit(CSV_MAX_ROWS)
    .populate('user', 'email')
    .cursor();
  for await (const booking of cursor) {
    if (!res.write(csvRow(CSV_COLUMNS.map(([, get]) => get(booking))))) {
      await once(res, 'drain');
    }
  }
  res.end();
}

/* ---------- detail ---------- */

/** Booking with everything the admin detail page shows. */
export async function getBookingAdmin(id) {
  const booking = await Booking.findById(id)
    .populate('tour', TOUR_FIELDS)
    .populate('user', 'name email phone');
  if (!booking) throw AppError.notFound('Booking not found');
  const [payments, auditLogs, notifications, departure] = await Promise.all([
    Payment.find({ booking: booking._id }).sort({ createdAt: 1 }),
    AuditLog.find({ entityType: 'Booking', entityId: booking._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('actor', 'name email'),
    NotificationLog.find({ booking: booking._id }).sort({ createdAt: -1 }).limit(50),
    TourDeparture.findById(booking.departure).select('status totalSeats seatsAvailable'),
  ]);
  // Names for note authors and timeline actors.
  const actorIds = new Set();
  for (const note of booking.notes) if (note.by) actorIds.add(String(note.by));
  for (const entry of booking.timeline) {
    if (mongoose.isValidObjectId(entry.by)) actorIds.add(String(entry.by));
  }
  if (booking.cancellation?.processedBy) actorIds.add(String(booking.cancellation.processedBy));
  const actors = await User.find({ _id: { $in: [...actorIds] } }).select('name');
  const names = new Map(actors.map((u) => [u._id.toString(), u.name]));
  return { booking, payments, auditLogs, notifications, departure, names };
}

/* ---------- status changes ---------- */

/**
 * PATCH /admin/bookings/:id/status. Allowed (all need a reason, all audited):
 * - pending → cancelled (seats released)
 * - pending → confirmed with `manualPayment` (a Payment captured with verifiedVia "manual")
 * - payment_received_no_seats → confirmed, after the admin raised the departure's seats
 * - cancellation_requested → confirmed (request rejected)
 * - confirmed / cancellation_requested / payment_received_no_seats → cancelled, recorded as
 *   "no refund"; use POST /cancel to record a refund
 */
export async function changeStatus(ctx, actor, id, { to, reason, manualPayment }, req) {
  const why = requireReason(reason);
  const booking = await getBooking(id);
  const from = booking.bookingStatus;

  if (to === 'cancelled') return cancelByAdmin(ctx, actor, id, { reason: why }, req);
  if (from === 'pending') return markPaidManually(ctx, actor, booking, why, manualPayment, req);
  if (from === 'payment_received_no_seats') return confirmWithSeats(ctx, actor, booking, why, req);
  if (from === 'cancellation_requested') return rejectCancellation(actor, booking, why, req);
  assertTransition(from, to);
  throw new AppError(409, ERROR_CODES.INVALID_TRANSITION, 'This change is not allowed here', {
    from,
    to,
  });
}

async function markPaidManually(ctx, actor, booking, reason, manualPayment, req) {
  if (!manualPayment) {
    throw AppError.validation([
      {
        path: 'body.manualPayment',
        message: 'Record the payment reference, method and amount',
      },
    ]);
  }
  if (manualPayment.amount !== booking.amount) {
    throw new AppError(
      422,
      ERROR_CODES.AMOUNT_MISMATCH,
      `The amount must equal the booking amount (₹${booking.amount})`,
      [{ path: 'body.manualPayment.amount', message: `Enter ${booking.amount}` }],
    );
  }
  const paymentId = `manual:${manualPayment.reference}`;
  if (await Payment.exists({ providerPaymentId: paymentId })) {
    throw AppError.conflict(ERROR_CODES.CONFLICT, 'This payment reference is already recorded');
  }
  const { state } = await confirmBooking(ctx, booking._id, {
    paymentId,
    via: 'manual',
    method: manualPayment.method,
    signatureVerified: false,
  });
  if (state === 'already_confirmed') {
    throw AppError.conflict(ERROR_CODES.CONFLICT, 'The booking was already paid');
  }
  await recordAudit({
    actor,
    action: 'booking.manual_payment',
    entityType: 'Booking',
    entityId: booking._id,
    before: { bookingStatus: 'pending', paymentStatus: booking.paymentStatus },
    after: {
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      payment: { ...manualPayment },
    },
    reason,
    req,
  });
  return booking._id;
}

/** payment_received_no_seats → confirmed: re-hold the seats in one conditional update. */
async function confirmWithSeats(ctx, actor, booking, reason, req, now = new Date()) {
  assertTransition(booking.bookingStatus, 'confirmed');
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const held = await TourDeparture.updateOne(
        {
          _id: booking.departure,
          status: { $in: ['scheduled', 'full'] },
          seatsAvailable: { $gte: booking.seats },
        },
        { $inc: { seatsAvailable: -booking.seats } },
        { session },
      );
      if (held.modifiedCount !== 1) {
        const departure = await TourDeparture.findById(booking.departure)
          .select('seatsAvailable status')
          .session(session);
        throw new AppError(
          409,
          ERROR_CODES.SEATS_UNAVAILABLE,
          departure && ['scheduled', 'full'].includes(departure.status)
            ? `Only ${departure.seatsAvailable} seat(s) are free; raise the departure's total seats first`
            : 'This departure is no longer running; cancel the booking with a refund instead',
          { seatsAvailable: departure?.seatsAvailable ?? 0, seatsNeeded: booking.seats },
        );
      }
      const result = await Booking.updateOne(
        { _id: booking._id, bookingStatus: 'payment_received_no_seats' },
        {
          $set: { bookingStatus: 'confirmed', confirmedAt: now },
          $push: {
            timeline: timelineEntry('confirmed_by_admin', {
              by: actor._id,
              at: now,
              meta: { reason },
            }),
          },
        },
        { session },
      );
      if (result.modifiedCount !== 1) {
        throw AppError.conflict(ERROR_CODES.CONFLICT, 'The booking changed meanwhile; reload it');
      }
    });
  } finally {
    await session.endSession();
  }
  await syncFullStatus(booking.departure);
  await recordAudit({
    actor,
    action: 'booking.confirm_seats',
    entityType: 'Booking',
    entityId: booking._id,
    before: { bookingStatus: 'payment_received_no_seats' },
    after: { bookingStatus: 'confirmed', seats: booking.seats },
    reason,
    req,
  });
  await issueDocumentsQuietly(ctx, booking._id);
  await enqueueNotification(ctx, {
    type: 'booking_confirmed',
    to: booking.contact.email,
    dedupeKey: `booking_confirmed:${booking._id}`,
    user: booking.user,
    booking: booking._id,
    payload: { bookingReference: booking.bookingReference },
  });
  return booking._id;
}

/** cancellation_requested → confirmed: the request is declined; the booking stands. */
async function rejectCancellation(actor, booking, reason, req, now = new Date()) {
  assertTransition(booking.bookingStatus, 'confirmed');
  if (booking.cancellation?.departureCancelled) {
    throw new AppError(
      409,
      ERROR_CODES.INVALID_TRANSITION,
      'The departure itself was cancelled; cancel this booking with a refund instead',
      { from: booking.bookingStatus, to: 'confirmed' },
    );
  }
  const result = await Booking.updateOne(
    { _id: booking._id, bookingStatus: 'cancellation_requested' },
    {
      $set: { bookingStatus: 'confirmed' },
      $unset: { cancellation: '' },
      $push: {
        timeline: timelineEntry('cancellation_rejected', {
          by: actor._id,
          at: now,
          meta: { reason, requestReason: booking.cancellation?.reason },
        }),
      },
    },
  );
  if (result.modifiedCount !== 1) await explainStale(booking._id, 'confirmed');
  await recordAudit({
    actor,
    action: 'booking.cancellation_rejected',
    entityType: 'Booking',
    entityId: booking._id,
    before: { bookingStatus: 'cancellation_requested', request: booking.cancellation?.reason },
    after: { bookingStatus: 'confirmed' },
    reason,
    req,
  });
  return booking._id;
}

/* ---------- cancel with refund ---------- */

function refundPaymentStatus(booking, amount) {
  if (amount <= 0 || booking.paymentStatus !== 'paid') return booking.paymentStatus;
  return amount >= booking.amount ? 'refunded' : 'partially_refunded';
}

function checkRefund(booking, refund) {
  const amount = refund?.amount ?? 0;
  const method = amount > 0 ? refund.method : 'none';
  const issues = [];
  if (amount > 0 && booking.paymentStatus !== 'paid') {
    issues.push({
      path: 'body.refund.amount',
      message: 'Nothing was paid, so nothing can be refunded',
    });
  } else if (amount > booking.amount) {
    issues.push({
      path: 'body.refund.amount',
      message: `The refund cannot be more than the amount paid (₹${booking.amount})`,
    });
  }
  if (amount > 0 && method === 'none') {
    issues.push({ path: 'body.refund.method', message: 'Choose how the refund is paid' });
  }
  if (issues.length) throw AppError.validation(issues);
  return { amount, method, reference: amount > 0 ? refund.reference || undefined : undefined };
}

/**
 * POST /admin/bookings/:id/cancel. The booking becomes cancelled, held seats return to the
 * departure, the refund (if any) is recorded on the booking and the captured payment, the
 * payment status follows the amount, and the traveller is emailed.
 * @param {{ reason?: string, refund?: { amount: number, reference?: string, method: string } }} input
 */
export async function cancelByAdmin(ctx, actor, id, { reason, refund }, req, now = new Date()) {
  const why = requireReason(reason);
  const booking = await getBooking(id);
  const from = booking.bookingStatus;
  assertTransition(from, 'cancelled');
  const money = checkRefund(booking, refund);
  const paymentStatus = refundPaymentStatus(booking, money.amount);
  const previous = booking.cancellation ?? {};

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const result = await Booking.updateOne(
        { _id: booking._id, bookingStatus: from },
        {
          $set: {
            bookingStatus: 'cancelled',
            paymentStatus,
            cancelledAt: now,
            cancellation: {
              requestedAt: previous.requestedAt ?? now,
              reason: previous.reason ?? why,
              departureCancelled: Boolean(previous.departureCancelled),
              processedBy: actor._id,
              refundAmount: money.amount,
              refundReference: money.reference,
              refundMethod: money.method,
              ...(money.amount > 0 && { refundedAt: now }),
            },
          },
          $push: {
            timeline: timelineEntry('cancelled_by_admin', {
              by: actor._id,
              at: now,
              meta: { reason: why, refundAmount: money.amount },
            }),
          },
        },
        { session },
      );
      if (result.modifiedCount !== 1) {
        throw AppError.conflict(ERROR_CODES.CONFLICT, 'The booking changed meanwhile; reload it');
      }
      if (SEAT_HOLDING.has(from)) await releaseSeats(booking.departure, booking.seats, session);
      if (from === 'pending') {
        await Payment.updateMany(
          { booking: booking._id, status: 'created' },
          { $set: { status: 'failed', failureReason: 'cancelled_by_admin' } },
          { session },
        );
      }
      if (money.amount > 0) {
        await Payment.updateOne(
          { booking: booking._id, status: 'captured' },
          {
            $set: {
              ...(paymentStatus === 'refunded' && { status: 'refunded' }),
              refund: {
                amount: money.amount,
                providerRefundId: money.reference,
                method: money.method,
                status: 'processed',
                at: now,
              },
            },
          },
          { session, sort: { createdAt: -1 } },
        );
      }
    });
  } catch (error) {
    if (error instanceof AppError && error.code === ERROR_CODES.CONFLICT) {
      await explainStale(booking._id, 'cancelled');
    }
    throw error;
  } finally {
    await session.endSession();
  }

  await syncFullStatus(booking.departure);
  await recordAudit({
    actor,
    action: 'booking.cancel',
    entityType: 'Booking',
    entityId: booking._id,
    before: { bookingStatus: from, paymentStatus: booking.paymentStatus },
    after: { bookingStatus: 'cancelled', paymentStatus, refund: money },
    reason: why,
    req,
  });
  await enqueueNotification(ctx, {
    type: 'booking_cancelled',
    to: booking.contact.email,
    dedupeKey: `booking_cancelled:${booking._id}:admin`,
    user: booking.user,
    booking: booking._id,
    payload: { bookingReference: booking.bookingReference },
  });
  return booking._id;
}

/* ---------- notes, documents, emails ---------- */

export async function addNote(actor, id, text, req, now = new Date()) {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { $push: { notes: { by: actor._id, at: now, text } } },
    { returnDocument: 'after' },
  );
  if (!booking) throw AppError.notFound('Booking not found');
  await recordAudit({
    actor,
    action: 'booking.note.add',
    entityType: 'Booking',
    entityId: booking._id,
    after: { text },
    req,
  });
  return booking;
}

export async function regenerateBookingDocuments(ctx, actor, id, req) {
  const booking = await getBooking(id);
  const updated = await regenerateDocuments(ctx, booking._id);
  await recordAudit({
    actor,
    action: 'booking.documents.regenerate',
    entityType: 'Booking',
    entityId: booking._id,
    before: { ticketGeneratedAt: booking.ticket?.generatedAt ?? null },
    after: {
      invoiceNumber: updated.invoice?.number,
      ticketGeneratedAt: updated.ticket?.generatedAt,
    },
    req,
  });
  return updated;
}

/** Queue the confirmation email again (with fresh PDFs); a new dedupe key every time. */
export async function resendConfirmation(ctx, actor, id, req, now = new Date()) {
  const booking = await getBooking(id);
  if (booking.bookingStatus !== 'confirmed') {
    throw AppError.conflict(
      ERROR_CODES.INVALID_TRANSITION,
      'Only confirmed bookings have a confirmation to resend',
    );
  }
  await enqueueNotification(ctx, {
    type: 'booking_confirmed',
    to: booking.contact.email,
    dedupeKey: `booking_confirmed:${booking._id}:resend:${now.getTime()}`,
    user: booking.user,
    booking: booking._id,
    payload: { bookingReference: booking.bookingReference },
  });
  await recordAudit({
    actor,
    action: 'booking.confirmation.resend',
    entityType: 'Booking',
    entityId: booking._id,
    after: { to: booking.contact.email },
    req,
  });
}
