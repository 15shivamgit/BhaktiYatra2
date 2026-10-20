import { SELLER, TAX_ENABLED } from '../../config/documents.js';
import { COLORS, createDocument, date, field, money, table, toBuffer } from './pdf.js';

const METHOD = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  wallet: 'Wallet',
  emi: 'EMI',
};

/**
 * Invoice / payment receipt, A4 portrait (docs/05-features/06-tickets-invoices-email.md).
 * "Tax Invoice" only once tax is enabled (not GST-registered yet).
 * @param {{ booking: any, payment: any }} data
 * @returns {Promise<Buffer>}
 */
export function renderInvoice({ booking, payment }) {
  const title = TAX_ENABLED ? 'Tax Invoice' : 'Invoice / Payment Receipt';
  const doc = createDocument({
    size: 'A4',
    title: `${title} ${booking.invoice.number}`,
    margin: 48,
  });
  const left = 48;
  const width = doc.page.width - left * 2;

  // Header
  doc.font('bold').fontSize(24).fillColor(COLORS.accent).text(SELLER.name, left, 48);
  doc
    .font('regular')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(SELLER.address, left, doc.y + 2, { width: width / 2 })
    .text(`${SELLER.phone} · ${SELLER.email}`, { width: width / 2 });
  if (SELLER.gstin) doc.text(`GSTIN ${SELLER.gstin}`);

  doc
    .font('bold')
    .fontSize(16)
    .fillColor(COLORS.text)
    .text(title, left, 50, { width, align: 'right' });
  doc
    .font('regular')
    .fontSize(9.5)
    .fillColor(COLORS.text)
    .text(`Invoice no. ${booking.invoice.number}`, left, doc.y + 6, { width, align: 'right' })
    .text(`Date ${date(booking.confirmedAt ?? booking.invoice.generatedAt)}`, {
      width,
      align: 'right',
    })
    .text(`Booking ${booking.bookingReference}`, { width, align: 'right' });

  // Bill to
  let y = 150;
  doc.rect(left, y, width, 0.5).fill(COLORS.border);
  y += 14;
  field(doc, 'Bill to', booking.contact.name, left, y, width / 2);
  doc
    .font('regular')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(booking.contact.email, left, doc.y + 1)
    .text(booking.contact.phone);

  // Line items
  y = doc.y + 24;
  const startDate = date(booking.snapshot.startDate);
  y = table(doc, {
    x: left,
    y,
    fontSize: 9.5,
    columns: [
      { label: 'Description', width: width - 70 - 90 - 100 },
      { label: 'Qty', width: 70, align: 'right' },
      { label: 'Unit price', width: 90, align: 'right' },
      { label: 'Amount', width: 100, align: 'right' },
    ],
    rows: [
      [
        `${booking.snapshot.tourTitle} — departure ${startDate}`,
        `${booking.seats} seat(s)`,
        money(booking.unitPrice),
        money(booking.amount),
      ],
    ],
  });

  // Totals
  y += 14;
  const labelX = left + width - 260;
  const line = (label, value, bold = false) => {
    doc
      .font(bold ? 'bold' : 'regular')
      .fontSize(bold ? 11 : 9.5)
      .fillColor(COLORS.text);
    doc.text(label, labelX, y, { width: 150 });
    doc.text(value, labelX + 150, y, { width: 110, align: 'right' });
    y = doc.y + 6;
  };
  line('Subtotal', money(booking.amount));
  line('Total paid', money(booking.amount), true);
  doc.rect(labelX, y, 260, 0.5).fill(COLORS.border);
  y += 8;
  doc
    .font('regular')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(
      `Paid by ${METHOD[payment?.method] ?? 'online payment'} via Razorpay · reference ${payment?.providerPaymentId ?? '—'}`,
      labelX,
      y,
      { width: 260, align: 'right' },
    );

  // Notes
  doc
    .font('regular')
    .fontSize(8.5)
    .fillColor(COLORS.muted)
    .text(
      `${TAX_ENABLED ? '' : 'BhaktiYatra is not registered for GST; no tax is charged. '}This is a computer-generated document and needs no signature.`,
      left,
      doc.page.height - 96,
      { width },
    );

  return toBuffer(doc);
}
