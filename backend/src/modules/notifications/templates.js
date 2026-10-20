import { SELLER } from '../../config/documents.js';

/*
 * Transactional email templates (docs/05-features/06-tickets-invoices-email.md "Email").
 * Plain functions instead of handlebars (ADR-033): each returns { subject, heading, lines,
 * cta? } and the shared layout turns that into HTML (inline styles for Gmail and Outlook) plus
 * a plain-text part. All values are escaped.
 */

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
const money = (n) => INR.format(n);
const day = (value) =>
  new Intl.DateTimeFormat('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));

function tripLines(b) {
  return [
    ['Booking', b.bookingReference],
    ['Tour', b.snapshot.tourTitle],
    ['Dates', `${day(b.snapshot.startDate)} – ${day(b.snapshot.endDate)}`],
    ['Pickup', b.snapshot.pickupCity ?? 'As per itinerary'],
    ['Seats', String(b.seats)],
    ['Amount', money(b.amount)],
  ];
}

function cancelledOutro(b) {
  if (b.paymentStatus === 'pending' || b.paymentStatus === 'failed') return 'Nothing was charged.';
  const refund = b.cancellation?.refundAmount;
  if (refund > 0) {
    return `A refund of ${money(refund)} has been started to your original payment method. It usually reaches you within 5–7 working days.`;
  }
  if (b.cancellation?.processedBy) {
    return 'Under our cancellation policy no refund is due for this booking.';
  }
  return 'If a refund is due, it is processed as described in our cancellation policy.';
}

/** Each template: (data, links) → { subject, heading, intro, rows?, outro?, cta? } */
const TEMPLATES = {
  welcome: ({ name }, links) => ({
    subject: 'Welcome to BhaktiYatra',
    heading: `Namaste ${name},`,
    intro:
      'Your BhaktiYatra account is ready. Explore temples, plan a yatra and book guided tours with fixed dates.',
    cta: { label: 'Explore temples', url: `${links.site}/temples` },
  }),

  password_reset: ({ name, resetUrl, expiresInMinutes }) => ({
    subject: 'Reset your BhaktiYatra password',
    heading: `Namaste ${name},`,
    intro: `Use the button below to choose a new password. The link works for ${expiresInMinutes} minutes and only once.`,
    outro: 'If you did not ask for this, ignore this email; your password stays the same.',
    cta: { label: 'Reset password', url: resetUrl },
  }),

  booking_confirmed: ({ booking }, links) => ({
    subject: `Booking confirmed: ${booking.snapshot.tourTitle} (${booking.bookingReference})`,
    heading: `Namaste ${booking.contact.name},`,
    intro:
      'Your booking is confirmed. Your e-ticket and invoice are attached. Show the QR code on the ticket at pickup.',
    rows: tripLines(booking),
    outro: 'Carry a government photo ID for every traveller.',
    cta: {
      label: 'View booking',
      url: `${links.site}/account/bookings/${booking.bookingReference}`,
    },
  }),

  payment_failed: ({ booking, reason }, links) => ({
    subject: `Payment not completed: ${booking.bookingReference}`,
    heading: `Namaste ${booking.contact.name},`,
    intro: `Your payment for ${booking.snapshot.tourTitle} did not go through${reason ? ` (${reason})` : ''}. Your seats stay held for a short time; you can try again from your booking.`,
    cta: { label: 'Try again', url: `${links.site}/account/bookings/${booking.bookingReference}` },
  }),

  booking_cancelled: ({ booking }, links) => ({
    subject: `Booking cancelled: ${booking.bookingReference}`,
    heading: `Namaste ${booking.contact.name},`,
    intro: `Your booking for ${booking.snapshot.tourTitle} has been cancelled.`,
    rows: tripLines(booking),
    outro: cancelledOutro(booking),
    cta: { label: 'My bookings', url: `${links.site}/account/bookings` },
  }),

  departure_cancelled: ({ booking, reason }, links) => ({
    subject: `Important: your ${booking.snapshot.tourTitle} departure is cancelled`,
    heading: `Namaste ${booking.contact.name},`,
    intro: `We are sorry: the departure on ${day(booking.snapshot.startDate)} has been cancelled${reason ? ` (${reason})` : ''}.`,
    rows: tripLines(booking),
    outro:
      booking.paymentStatus === 'paid'
        ? 'You get a full refund, or a free move to another date. Reply to this email or call us to choose.'
        : 'Nothing was charged for this booking.',
    cta: {
      label: 'View booking',
      url: `${links.site}/account/bookings/${booking.bookingReference}`,
    },
  }),

  payment_received_no_seats: ({ booking }) => ({
    subject: `Payment received, seats unavailable: ${booking.bookingReference}`,
    heading: `Namaste ${booking.contact.name},`,
    intro:
      'We received your payment, but the seats sold out after your hold ended. We will contact you within 24 hours to offer another date or a full refund.',
    rows: tripLines(booking),
  }),

  cancellation_requested_admin: ({ booking, reason }, links) => ({
    subject: `[Admin] Cancellation requested: ${booking.bookingReference}`,
    heading: 'Cancellation request',
    intro: `${booking.contact.name} asked to cancel a paid booking.${reason ? ` Reason: ${reason}` : ''}`,
    rows: tripLines(booking),
    cta: {
      label: 'Open booking',
      url: `${links.site}/account/bookings/${booking.bookingReference}`,
    },
  }),

  payment_issue_admin: ({ bookingReference, issue, amountPaise, expectedPaise, paymentId }) => ({
    subject: `[Admin] Payment needs attention: ${bookingReference}`,
    heading: 'Payment needs attention',
    intro: `A payment for ${bookingReference} was not confirmed automatically (${issue}).`,
    rows: [
      ['Payment', paymentId ?? '—'],
      ['Received', typeof amountPaise === 'number' ? money(amountPaise / 100) : '—'],
      ['Expected', typeof expectedPaise === 'number' ? money(expectedPaise / 100) : '—'],
    ],
  }),

  contact_received_admin: ({ name, subject }, links) => ({
    subject: `[Admin] New message from ${name}`,
    heading: 'New contact message',
    intro: `${name} sent a message${subject ? `: “${subject}”` : ''}.`,
    cta: { label: 'Open inbox', url: `${links.site}/admin/contacts` },
  }),
};

export const TEMPLATE_TYPES = Object.freeze(Object.keys(TEMPLATES));

function layoutHtml({ heading, intro, rows, outro, cta }) {
  const tableRows = (rows ?? [])
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 0;color:#6b6157;font-size:13px;width:110px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:#1f1b16;font-size:14px;font-weight:600">${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  return `<!doctype html><html lang="en"><body style="margin:0;background:#fffcf7;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fffcf7;padding:24px 0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e8e0d2;border-radius:8px">
<tr><td style="background:#7a1f2b;padding:18px 24px;border-radius:8px 8px 0 0;color:#ffffff;font-size:22px;font-weight:bold">${escapeHtml(SELLER.name)}</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;color:#1f1b16;font-size:16px;font-weight:bold">${escapeHtml(heading)}</p>
<p style="margin:0 0 16px;color:#1f1b16;font-size:14px;line-height:1.6">${escapeHtml(intro)}</p>
${tableRows ? `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-top:1px solid #e8e0d2;border-bottom:1px solid #e8e0d2;margin:0 0 16px">${tableRows}</table>` : ''}
${outro ? `<p style="margin:0 0 16px;color:#1f1b16;font-size:14px;line-height:1.6">${escapeHtml(outro)}</p>` : ''}
${cta ? `<p style="margin:8px 0 0"><a href="${escapeHtml(cta.url)}" style="display:inline-block;background:#b4580f;color:#ffffff;text-decoration:none;font-weight:bold;font-size:14px;padding:12px 20px;border-radius:6px">${escapeHtml(cta.label)}</a></p>` : ''}
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e8e0d2;color:#6b6157;font-size:12px;line-height:1.5">${escapeHtml(SELLER.name)} · ${escapeHtml(SELLER.address)}<br>${escapeHtml(SELLER.phone)} · ${escapeHtml(SELLER.email)}<br>This is a transactional email about your account or booking.</td></tr>
</table></td></tr></table></body></html>`;
}

function layoutText({ heading, intro, rows, outro, cta }) {
  return [
    heading,
    '',
    intro,
    ...(rows?.length ? ['', ...rows.map(([label, value]) => `${label}: ${value}`)] : []),
    ...(outro ? ['', outro] : []),
    ...(cta ? ['', `${cta.label}: ${cta.url}`] : []),
    '',
    '—',
    `${SELLER.name} · ${SELLER.address}`,
    `${SELLER.phone} · ${SELLER.email}`,
  ].join('\n');
}

/**
 * @param {string} type notification type
 * @param {object} data template data
 * @param {{ siteUrl: string, nodeEnv: string }} options
 * @returns {{ subject: string, html: string, text: string }}
 */
export function renderEmail(type, data, { siteUrl, nodeEnv }) {
  const template = TEMPLATES[type];
  if (!template) throw new Error(`No email template for "${type}"`);
  const content = template(data, { site: siteUrl });
  const prefix = nodeEnv === 'staging' ? '[STAGING] ' : '';
  return {
    subject: `${prefix}${content.subject}`,
    html: layoutHtml(content),
    text: layoutText(content),
  };
}
