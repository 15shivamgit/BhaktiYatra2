import {
  EMAIL_BACKOFF_MINUTES,
  EMAIL_BATCH_SIZE,
  EMAIL_MAX_ATTEMPTS,
  EMAIL_STALE_SENDING_MIN,
} from '../../config/documents.js';
import { Booking } from '../../models/Booking.js';
import { NotificationLog } from '../../models/NotificationLog.js';
import { User } from '../../models/User.js';
import { maskEmail } from '../../utils/phone.js';
import { issueDocuments, renderDocument } from '../documents/documents.service.js';
import { renderEmail } from './templates.js';

const MINUTE = 60_000;
/** Queued emails older than this are stale (for example from before email sending existed). */
const MAX_AGE_MS = 24 * 60 * MINUTE;

const BOOKING_TYPES = new Set([
  'booking_confirmed',
  'payment_failed',
  'booking_cancelled',
  'departure_cancelled',
  'payment_received_no_seats',
  'cancellation_requested_admin',
]);

const renderOptions = (ctx) => ({ siteUrl: ctx.env.SITE_URL, nodeEnv: ctx.env.NODE_ENV });

/** Build the message for a queued notification: fresh booking data, attachments, recipients. */
async function buildMessage(ctx, log) {
  const data = { ...log.payload };
  const to = [log.to];
  const attachments = [];

  if (BOOKING_TYPES.has(log.type)) {
    let booking = await Booking.findById(log.booking);
    if (!booking) throw new Error('Booking not found');
    if (log.type === 'booking_confirmed') {
      booking = await issueDocuments(ctx, booking._id);
      const [ticket, invoice] = await Promise.all([
        renderDocument(ctx, booking, 'ticket'),
        renderDocument(ctx, booking, 'invoice'),
      ]);
      attachments.push(
        { filename: ticket.filename, content: ticket.buffer },
        { filename: invoice.filename, content: invoice.buffer },
      );
      const user = await User.findById(booking.user).select('email');
      if (user?.email && user.email !== log.to) to.push(user.email);
    }
    data.booking = booking;
  }
  return { to, attachments, ...renderEmail(log.type, data, renderOptions(ctx)) };
}

/** Claim one due notification (atomic, so concurrent runs never send the same one twice). */
function claimNext(now) {
  return NotificationLog.findOneAndUpdate(
    {
      type: { $ne: 'password_reset' }, // sent at request time; the queue has no token
      attempts: { $lt: EMAIL_MAX_ATTEMPTS },
      nextAttemptAt: { $lte: now },
      createdAt: { $gte: new Date(now.getTime() - MAX_AGE_MS) },
      $or: [
        { status: { $in: ['pending', 'failed'] } },
        {
          status: 'sending',
          updatedAt: { $lt: new Date(now.getTime() - EMAIL_STALE_SENDING_MIN * MINUTE) },
        },
      ],
    },
    { $set: { status: 'sending' }, $inc: { attempts: 1 } },
    { sort: { nextAttemptAt: 1 }, returnDocument: 'after' },
  );
}

/**
 * Job (every minute): send due emails. Failures back off 1, 5 and 30 minutes; after 3 attempts
 * the record stays `failed` (counted as an alert for the admin dashboard). The booking itself
 * is never affected by email problems.
 * @returns {Promise<{ sent: number, failed: number }>}
 */
export async function processEmailQueue(ctx, now = new Date()) {
  let sent = 0;
  let failed = 0;
  for (let i = 0; i < EMAIL_BATCH_SIZE; i += 1) {
    const log = await claimNext(now);
    if (!log) break;
    const meta = {
      type: log.type,
      dedupeKey: log.dedupeKey,
      to: maskEmail(log.to),
      attempt: log.attempts,
    };
    try {
      const message = await buildMessage(ctx, log);
      const result = await ctx.providers.mail.send(message);
      await NotificationLog.updateOne(
        { _id: log._id },
        {
          $set: { status: 'sent', sentAt: new Date(), lastError: null },
          $unset: { nextAttemptAt: '' },
        },
      );
      ctx.logger.info({ ...meta, providerId: result?.id }, 'Email sent');
      sent += 1;
    } catch (error) {
      const finalAttempt = log.attempts >= EMAIL_MAX_ATTEMPTS;
      const backoff =
        EMAIL_BACKOFF_MINUTES[Math.min(log.attempts, EMAIL_BACKOFF_MINUTES.length) - 1];
      await NotificationLog.updateOne(
        { _id: log._id },
        {
          $set: {
            status: 'failed',
            lastError: error.message.slice(0, 500),
            nextAttemptAt: new Date(now.getTime() + backoff * MINUTE),
          },
        },
      );
      (finalAttempt ? ctx.logger.error : ctx.logger.warn).call(
        ctx.logger,
        { ...meta, err: error.message, final: finalAttempt },
        finalAttempt ? 'Email failed for good' : 'Email failed; will retry',
      );
      failed += 1;
    }
  }
  return { sent, failed };
}

/**
 * Emails that failed all attempts (admin dashboard alert count).
 * @param {{ since?: Date }} [options] count only failures last tried after this time
 */
export function failedEmailCount({ since } = {}) {
  return NotificationLog.countDocuments({
    status: 'failed',
    attempts: { $gte: EMAIL_MAX_ATTEMPTS },
    ...(since && { updatedAt: { $gte: since } }),
  });
}

/**
 * Password reset: sent during the request because the token must never be stored (ADR-025).
 * The log records the attempt without the token or link.
 */
export async function sendPasswordResetEmail(ctx, user, { resetUrl, expiresInMinutes }) {
  const message = renderEmail(
    'password_reset',
    { name: user.name, resetUrl, expiresInMinutes },
    renderOptions(ctx),
  );
  let status = 'sent';
  let lastError;
  try {
    await ctx.providers.mail.send({ to: user.email, ...message });
  } catch (error) {
    status = 'failed';
    lastError = error.message.slice(0, 500);
    ctx.logger.error(
      { to: maskEmail(user.email), err: error.message },
      'Password reset email failed',
    );
  }
  await NotificationLog.create({
    type: 'password_reset',
    to: user.email,
    user: user._id,
    dedupeKey: `password_reset:${user._id}:${Date.now()}`,
    payload: { name: user.name, expiresInMinutes },
    status,
    attempts: 1,
    ...(status === 'sent' ? { sentAt: new Date() } : { lastError }),
  });
  return status;
}
