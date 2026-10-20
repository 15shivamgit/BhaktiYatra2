import { CANCELLATION_SLABS } from '../../config/bookings.js';
import { primaryImage } from '../../models/shared.js';
import { daysBetween, toIstYmd, todayIst } from '../../utils/dates.js';
import { toAuditEntry } from '../audit/audit.mapper.js';

/**
 * Suggested refund under the cancellation policy (07-content/05-cancellation-refund-policy.md).
 * A departure cancelled by BhaktiYatra refunds in full.
 * @param {{ amount: number, snapshot: { startDate: Date }, cancellation?: any }} booking
 * @param {Date} [at] when the request is (or was) received
 */
export function cancellationQuote(booking, at = new Date()) {
  if (booking.cancellation?.departureCancelled) {
    return {
      daysBefore: null,
      chargePct: 0,
      suggestedRefund: booking.amount,
      departureCancelled: true,
    };
  }
  const daysBefore = Math.max(0, daysBetween(todayIst(at), booking.snapshot.startDate));
  const slab = CANCELLATION_SLABS.find((s) => daysBefore >= s.minDaysBefore) ?? { chargePct: 100 };
  return {
    daysBefore,
    chargePct: slab.chargePct,
    suggestedRefund: Math.floor((booking.amount * (100 - slab.chargePct)) / 100),
    departureCancelled: false,
  };
}

/** List shape (docs/04-api/05-bookings-payments.md "BookingSummary"). */
export function toBookingSummary(booking) {
  const tour = booking.tour && typeof booking.tour === 'object' ? booking.tour : null;
  return {
    id: booking._id.toString(),
    bookingReference: booking.bookingReference,
    tour: {
      slug: tour?.slug ?? booking.snapshot.tourSlug,
      title: booking.snapshot.tourTitle,
      primaryImage: tour ? primaryImage(tour.images) : null,
    },
    departure: {
      id: (booking.departure?._id ?? booking.departure).toString(),
      startDate: toIstYmd(booking.snapshot.startDate),
      endDate: toIstYmd(booking.snapshot.endDate),
      pickupCity: booking.snapshot.pickupCity ?? null,
    },
    seats: booking.seats,
    amount: booking.amount,
    currency: booking.currency,
    bookingStatus: booking.bookingStatus,
    paymentStatus: booking.paymentStatus,
    holdExpiresAt: booking.bookingStatus === 'pending' ? booking.holdExpiresAt : null,
    createdAt: booking.createdAt,
    hasTicket: Boolean(booking.ticket?.generatedAt),
    hasInvoice: Boolean(booking.invoice?.generatedAt),
  };
}

const PUBLIC_TIMELINE_META = ['seats', 'amount', 'reason', 'state'];

/** Detail shape for the owner (and admins). Internal notes and actor ids are not exposed. */
export function toBookingDetail(booking, payments = [], now = new Date()) {
  const quoteable = ['confirmed', 'cancellation_requested'].includes(booking.bookingStatus);
  return {
    ...toBookingSummary(booking),
    contact: booking.contact,
    travellers: booking.travellers.map(({ name, age, gender }) => ({ name, age, gender })),
    unitPrice: booking.unitPrice,
    snapshot: {
      tourTitle: booking.snapshot.tourTitle,
      tourSlug: booking.snapshot.tourSlug,
      startDate: toIstYmd(booking.snapshot.startDate),
      endDate: toIstYmd(booking.snapshot.endDate),
      pickupCity: booking.snapshot.pickupCity ?? null,
      durationDays: booking.snapshot.durationDays,
    },
    timeline: booking.timeline.map((entry) => ({
      at: entry.at,
      event: entry.event,
      meta: entry.meta
        ? Object.fromEntries(
            Object.entries(entry.meta).filter(([key]) => PUBLIC_TIMELINE_META.includes(key)),
          )
        : undefined,
    })),
    payments: payments.map((p) => ({
      id: p._id.toString(),
      status: p.status,
      method: p.method ?? null,
      providerPaymentId: p.providerPaymentId ?? null,
      amount: p.amount,
      createdAt: p.createdAt,
    })),
    cancellation: booking.cancellation
      ? {
          requestedAt: booking.cancellation.requestedAt ?? null,
          reason: booking.cancellation.reason ?? null,
          departureCancelled: Boolean(booking.cancellation.departureCancelled),
          refundAmount: booking.cancellation.refundAmount ?? null,
          refundedAt: booking.cancellation.refundedAt ?? null,
        }
      : null,
    cancellationQuote: quoteable
      ? cancellationQuote(
          booking,
          booking.bookingStatus === 'cancellation_requested'
            ? (booking.cancellation?.requestedAt ?? now)
            : now,
        )
      : null,
    ticket: booking.ticket?.generatedAt ? { generatedAt: booking.ticket.generatedAt } : null,
    invoice: booking.invoice?.generatedAt
      ? { number: booking.invoice.number, generatedAt: booking.invoice.generatedAt }
      : null,
  };
}

/* ---------- admin ---------- */

const userRef = (user) =>
  user && typeof user === 'object' && user._id
    ? { id: user._id.toString(), name: user.name, email: user.email }
    : null;

/** Admin list row: the summary plus who booked it. */
export function toAdminBookingSummary(booking) {
  return {
    ...toBookingSummary(booking),
    contact: booking.contact,
    travellerCount: booking.travellers.length,
    user: userRef(booking.user),
  };
}

/**
 * Admin detail: the owner's view plus internal notes, the full timeline with actor names,
 * refund details, provider ids, audit entries, emails and the actions allowed now.
 * Raw provider payloads (rawSnapshot) are never included.
 * @param {Awaited<ReturnType<typeof import('./bookings.admin.service.js').getBookingAdmin>>} data
 * @param {string[]} actions
 */
export function toAdminBookingDetail(
  { booking, payments, auditLogs, notifications, departure, names },
  actions,
  now = new Date(),
) {
  const nameOf = (id) => (id ? (names.get(String(id)) ?? null) : null);
  const detail = toBookingDetail(booking, payments, now);
  const quote =
    booking.bookingStatus === 'payment_received_no_seats'
      ? {
          daysBefore: null,
          chargePct: 0,
          suggestedRefund: booking.amount,
          departureCancelled: false,
        }
      : detail.cancellationQuote;
  return {
    ...detail,
    user: booking.user?._id
      ? { ...userRef(booking.user), phone: booking.user.phone ?? null }
      : null,
    travellerCount: booking.travellers.length,
    cancellationQuote: quote,
    cancellation: booking.cancellation
      ? {
          ...detail.cancellation,
          processedBy: nameOf(booking.cancellation.processedBy),
          refundReference: booking.cancellation.refundReference ?? null,
          refundMethod: booking.cancellation.refundMethod ?? null,
        }
      : null,
    timeline: booking.timeline.map((entry) => ({
      at: entry.at,
      event: entry.event,
      by: entry.by === 'system' || !entry.by ? 'system' : (nameOf(entry.by) ?? 'user'),
      meta: entry.meta ?? undefined,
    })),
    notes: booking.notes.map((note) => ({ at: note.at, text: note.text, by: nameOf(note.by) })),
    payments: payments.map((p) => ({
      id: p._id.toString(),
      provider: p.provider,
      providerOrderId: p.providerOrderId,
      providerPaymentId: p.providerPaymentId ?? null,
      status: p.status,
      method: p.method ?? null,
      amount: p.amount,
      verifiedVia: p.verifiedVia ?? null,
      signatureVerified: Boolean(p.signatureVerified),
      failureReason: p.failureReason ?? null,
      refund: p.refund?.amount
        ? {
            amount: p.refund.amount,
            reference: p.refund.providerRefundId ?? null,
            method: p.refund.method ?? null,
            at: p.refund.at ?? null,
          }
        : null,
      capturedAt: p.capturedAt ?? null,
      createdAt: p.createdAt,
    })),
    departureLive: departure
      ? {
          status: departure.status,
          totalSeats: departure.totalSeats,
          seatsAvailable: departure.seatsAvailable,
        }
      : null,
    auditLogs: auditLogs.map(toAuditEntry),
    notifications: notifications.map((n) => ({
      id: n._id.toString(),
      type: n.type,
      to: n.to,
      status: n.status,
      attempts: n.attempts,
      lastError: n.lastError ?? null,
      sentAt: n.sentAt ?? null,
      createdAt: n.createdAt,
    })),
    allowedActions: actions,
  };
}
