import { Booking } from '../../models/Booking.js';
import { Payment } from '../../models/Payment.js';
import { escapeRegex } from '../../utils/crypto.js';
import { addDays, istMidnight } from '../../utils/dates.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';

/**
 * GET /admin/payments: every payment attempt across bookings, newest first. `q` matches the
 * provider payment id, the order id or the booking reference.
 */
export async function listPaymentsAdmin({ status, from, to, q, page, limit }) {
  const filter = {};
  if (status) filter.status = status;
  if (from || to) {
    filter.createdAt = {
      ...(from && { $gte: istMidnight(from) }),
      ...(to && { $lt: addDays(istMidnight(to), 1) }),
    };
  }
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    const bookings = await Booking.find({ bookingReference: pattern }).select('_id').limit(50);
    filter.$or = [
      { providerPaymentId: pattern },
      { providerOrderId: pattern },
      ...(bookings.length ? [{ booking: { $in: bookings.map((b) => b._id) } }] : []),
    ];
  }
  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipFor({ page, limit }))
      .limit(limit)
      .populate({
        path: 'booking',
        select: 'bookingReference contact.email contact.name user',
        populate: { path: 'user', select: 'email' },
      }),
    Payment.countDocuments(filter),
  ]);
  return { payments: payments.map(toAdminPayment), meta: pageMeta({ page, limit }, total) };
}

/** Whitelisted fields only: raw provider payloads never leave the server. */
export function toAdminPayment(p) {
  const booking = p.booking && typeof p.booking === 'object' && p.booking._id ? p.booking : null;
  return {
    id: p._id.toString(),
    booking: booking
      ? {
          id: booking._id.toString(),
          bookingReference: booking.bookingReference,
          contactName: booking.contact?.name ?? null,
        }
      : null,
    userEmail: booking?.user?.email ?? booking?.contact?.email ?? null,
    provider: p.provider,
    providerOrderId: p.providerOrderId,
    providerPaymentId: p.providerPaymentId ?? null,
    amount: p.amount,
    currency: p.currency,
    status: p.status,
    method: p.method ?? null,
    verifiedVia: p.verifiedVia ?? null,
    failureReason: p.failureReason ?? null,
    refund: p.refund?.amount
      ? { amount: p.refund.amount, reference: p.refund.providerRefundId ?? null, at: p.refund.at }
      : null,
    capturedAt: p.capturedAt ?? null,
    createdAt: p.createdAt,
  };
}
