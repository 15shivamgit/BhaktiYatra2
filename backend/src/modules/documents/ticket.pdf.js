import { SELLER } from '../../config/documents.js';
import {
  COLORS,
  createDocument,
  date,
  dateTime,
  field,
  money,
  qrPng,
  table,
  toBuffer,
} from './pdf.js';

const GENDER = { male: 'Male', female: 'Female', other: 'Other' };

/**
 * E-ticket, A5 portrait (docs/05-features/06-tickets-invoices-email.md "Ticket PDF").
 * @param {{ booking: any, tour: any, departure: any, payment: any, verifyUrl: string, policyUrl: string }} data
 * @returns {Promise<Buffer>}
 */
export async function renderTicket({ booking, tour, departure, payment, verifyUrl, policyUrl }) {
  const doc = createDocument({
    size: 'A5',
    title: `BhaktiYatra e-ticket ${booking.bookingReference}`,
  });
  const left = 32;
  const width = doc.page.width - left * 2;
  const qr = await qrPng(verifyUrl);

  // Header band
  doc.rect(0, 0, doc.page.width, 92).fill(COLORS.accent);
  doc.font('bold').fontSize(20).fillColor('#FFFFFF').text(SELLER.name, left, 22);
  doc.font('regular').fontSize(9).fillColor('#F3E3E5').text('E-TICKET', left, 48);
  doc
    .font('bold')
    .fontSize(15)
    .fillColor('#FFFFFF')
    .text(booking.bookingReference, left, 60, { width, align: 'right' });
  doc
    .font('bold')
    .fontSize(8)
    .fillColor('#FFFFFF')
    .text('CONFIRMED', left, 30, { width, align: 'right' });

  // Tour block (left) and QR (right)
  const qrSize = 104;
  const textWidth = width - qrSize - 16;
  let y = 108;
  doc.font('bold').fontSize(13).fillColor(COLORS.text).text(booking.snapshot.tourTitle, left, y, {
    width: textWidth,
  });
  if (tour?.destinations?.length) {
    doc
      .font('regular')
      .fontSize(8.5)
      .fillColor(COLORS.muted)
      .text(tour.destinations.join(' · '), left, doc.y + 2, {
        width: textWidth,
      });
  }
  y = doc.y + 10;
  const half = (textWidth - 10) / 2;
  const yA = field(doc, 'Start', date(booking.snapshot.startDate), left, y, half);
  const yB = field(doc, 'End', date(booking.snapshot.endDate), left + half + 10, y, half);
  y = Math.max(yA, yB) + 8;
  const yC = field(doc, 'Duration', `${booking.snapshot.durationDays} days`, left, y, half);
  const yD = field(
    doc,
    'Pickup',
    booking.snapshot.pickupCity ?? 'As per itinerary',
    left + half + 10,
    y,
    half,
  );
  y = Math.max(yC, yD) + 8;

  doc.image(qr, left + width - qrSize, 108, { width: qrSize, height: qrSize });
  doc
    .font('regular')
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text('Scan to verify', left + width - qrSize, 108 + qrSize + 3, {
      width: qrSize,
      align: 'center',
    });

  if (departure?.pickupInstructions) {
    y = Math.max(y, 108 + qrSize + 16);
    doc.roundedRect(left, y, width, 1, 0).fill(COLORS.border);
    y += 8;
    field(doc, 'Pickup instructions', departure.pickupInstructions, left, y, width);
    y = doc.y + 6;
  }
  y = Math.max(y, 108 + qrSize + 18);

  // Travellers
  doc.font('bold').fontSize(10).fillColor(COLORS.accent).text('Travellers', left, y);
  y = table(doc, {
    x: left,
    y: doc.y + 4,
    columns: [
      { label: '#', width: 24 },
      { label: 'Name', width: width - 24 - 50 - 70 },
      { label: 'Age', width: 50, align: 'right' },
      { label: 'Gender', width: 70 },
    ],
    rows: booking.travellers.map((t, i) => [i + 1, t.name, t.age, GENDER[t.gender] ?? t.gender]),
  });

  // Payment
  y += 12;
  doc.font('bold').fontSize(10).fillColor(COLORS.accent).text('Payment', left, y);
  y = doc.y + 4;
  // Amount is short; the payment id and the date need more room.
  const w1 = (width - 20) * 0.24;
  const w2 = (width - 20) * 0.38;
  const w3 = width - 20 - w1 - w2;
  const amountLabel = `${booking.seats} × ${money(booking.unitPrice)}`;
  field(doc, amountLabel, money(booking.amount), left, y, w1);
  field(doc, 'Payment reference', payment?.providerPaymentId ?? '—', left + w1 + 10, y, w2);
  const paidOn = booking.confirmedAt ? dateTime(booking.confirmedAt) : '—';
  field(doc, 'Paid on', paidOn, left + w1 + w2 + 20, y, w3);

  // Footer
  // The footer sits inside the bottom margin; without this PDFKit would start a new page.
  doc.page.margins.bottom = 0;
  const footerY = doc.page.height - 84;
  doc.rect(left, footerY - 8, width, 0.5).fill(COLORS.border);
  doc
    .font('bold')
    .fontSize(8)
    .fillColor(COLORS.text)
    .text('Carry a government photo ID for every traveller.', left, footerY, { width });
  doc
    .font('regular')
    .fontSize(7.5)
    .fillColor(COLORS.muted)
    .text(
      `Cancellation charges apply as per our policy: ${policyUrl}. Help: ${SELLER.phone} · ${SELLER.email}`,
      left,
      doc.y + 2,
      { width },
    )
    .text(
      `Issued ${dateTime(booking.ticket?.generatedAt ?? new Date())} · Page 1 of 1`,
      left,
      doc.y + 2,
      {
        width,
      },
    );

  return toBuffer(doc);
}
