import { ERROR_CODES } from '../../config/constants.js';
import { Booking } from '../../models/Booking.js';
import { nextSequence } from '../../models/Counter.js';
import { Payment } from '../../models/Payment.js';
import { Tour } from '../../models/Tour.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { AppError } from '../../utils/app-error.js';
import { toIstYmd } from '../../utils/dates.js';
import { signTicketToken } from '../../utils/ticket-token.js';
import { renderInvoice } from './invoice.pdf.js';
import { renderTicket } from './ticket.pdf.js';

/*
 * Tickets and invoices (docs/05-features/06-tickets-invoices-email.md). The booking keeps the
 * facts (invoice number, ticket token, issue time); the PDFs are rendered from them on demand
 * for downloads and emails, so a regenerated document is identical and nothing needs to be
 * stored in Cloudinary (ADR-033).
 */

const DOCUMENT_STATUSES = new Set(['confirmed', 'cancellation_requested']);

/** INV-YYYY-NNNNNN, numbered per calendar year in India. */
export async function nextInvoiceNumber(at = new Date()) {
  const year = toIstYmd(at).slice(0, 4);
  const seq = await nextSequence(`invoice:${year}`);
  return `INV-${year}-${String(seq).padStart(6, '0')}`;
}

/**
 * Give a confirmed booking its invoice number and ticket token (once). Safe to call again:
 * existing numbers and tokens are kept, so regenerated documents keep the same invoice number.
 * @returns {Promise<any>} the updated booking
 */
export async function issueDocuments(ctx, bookingId, now = new Date()) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.bookingStatus !== 'confirmed') return booking;
  if (booking.invoice?.number && booking.ticket?.token) return booking;
  if (!ctx.env.TICKET_SIGNING_SECRET) {
    throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'TICKET_SIGNING_SECRET is not set');
  }

  const set = {};
  if (!booking.invoice?.number) {
    set.invoice = {
      number: await nextInvoiceNumber(booking.confirmedAt ?? now),
      generatedAt: now,
    };
  }
  if (!booking.ticket?.token) {
    set.ticket = {
      token: await signTicketToken(
        {
          reference: booking.bookingReference,
          departureId: booking.departure,
          startDate: booking.snapshot.startDate,
        },
        ctx.env.TICKET_SIGNING_SECRET,
      ),
      generatedAt: now,
    };
  }
  // Conditional: two concurrent calls cannot both assign an invoice number.
  const updated = await Booking.findOneAndUpdate(
    {
      _id: booking._id,
      ...(set.invoice && { 'invoice.number': { $exists: false } }),
      ...(set.ticket && { 'ticket.token': { $exists: false } }),
    },
    { $set: set, $push: { timeline: { at: now, event: 'documents_issued', by: 'system' } } },
    { returnDocument: 'after' },
  );
  return updated ?? Booking.findById(booking._id);
}

/**
 * Admin "regenerate documents": a fresh ticket token (old QR codes stop verifying) and new issue
 * times; the invoice number never changes. A booking without documents gets them issued.
 * @returns {Promise<any>} the updated booking
 */
export async function regenerateDocuments(ctx, bookingId, now = new Date()) {
  const booking = await Booking.findById(bookingId);
  if (!booking) throw AppError.notFound('Booking not found');
  if (booking.bookingStatus !== 'confirmed') {
    throw AppError.conflict(
      ERROR_CODES.INVALID_TRANSITION,
      'Documents exist only for confirmed bookings',
    );
  }
  if (!booking.invoice?.number || !booking.ticket?.token) {
    return issueDocuments(ctx, booking._id, now);
  }
  if (!ctx.env.TICKET_SIGNING_SECRET) {
    throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'TICKET_SIGNING_SECRET is not set');
  }
  const token = await signTicketToken(
    {
      reference: booking.bookingReference,
      departureId: booking.departure,
      startDate: booking.snapshot.startDate,
    },
    ctx.env.TICKET_SIGNING_SECRET,
  );
  return Booking.findOneAndUpdate(
    { _id: booking._id },
    {
      $set: {
        'ticket.token': token,
        'ticket.generatedAt': now,
        'invoice.generatedAt': now,
      },
      $push: { timeline: { at: now, event: 'documents_regenerated', by: 'system' } },
    },
    { returnDocument: 'after' },
  );
}

/** Issue documents without failing the caller (used right after confirmation). */
export async function issueDocumentsQuietly(ctx, bookingId) {
  try {
    await issueDocuments(ctx, bookingId);
  } catch (error) {
    ctx.logger.error({ bookingId: String(bookingId), err: error.message }, 'Document issue failed');
  }
}

async function documentData(booking) {
  const [tour, departure, payment] = await Promise.all([
    Tour.findById(booking.tour).select('destinations'),
    TourDeparture.findById(booking.departure).select('pickupInstructions'),
    Payment.findOne({ booking: booking._id, status: { $in: ['captured', 'refunded'] } }).sort({
      createdAt: -1,
    }),
  ]);
  return { tour, departure, payment };
}

export function verifyUrl(ctx, token) {
  return `${ctx.env.SITE_URL}/verify/${token}`;
}

/**
 * Render a document PDF for a booking. 404 while it is not ready (unconfirmed, or still being
 * issued); the UI shows "being prepared" and polls.
 * @param {'ticket' | 'invoice'} kind
 * @returns {Promise<{ filename: string, buffer: Buffer }>}
 */
export async function renderDocument(ctx, booking, kind) {
  const ready =
    DOCUMENT_STATUSES.has(booking.bookingStatus) &&
    (kind === 'ticket' ? booking.ticket?.token : booking.invoice?.number);
  if (!ready) {
    throw AppError.notFound(
      kind === 'ticket'
        ? 'Your ticket is being prepared. Refresh in a moment.'
        : 'Your invoice is being prepared. Refresh in a moment.',
    );
  }
  const data = await documentData(booking);
  if (kind === 'ticket') {
    return {
      filename: `BhaktiYatra-Ticket-${booking.bookingReference}.pdf`,
      buffer: await renderTicket({
        booking,
        ...data,
        verifyUrl: verifyUrl(ctx, booking.ticket.token),
        policyUrl: `${ctx.env.SITE_URL}/refund-policy`,
      }),
    };
  }
  return {
    filename: `BhaktiYatra-Invoice-${booking.invoice.number}.pdf`,
    buffer: await renderInvoice({ booking, payment: data.payment }),
  };
}
