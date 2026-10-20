import { fileURLToPath } from 'node:url';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { SELLER } from '../../config/documents.js';

const FONT_DIR = fileURLToPath(new URL('../../../assets/fonts/', import.meta.url));
export const COLORS = Object.freeze({
  accent: '#7A1F2B',
  primary: '#B4580F',
  text: '#1F1B16',
  muted: '#6B6157',
  border: '#E8E0D2',
  soft: '#F6F1E8',
  success: '#256B42',
});

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});
export const money = (rupees) => INR.format(rupees);

const DATE = new Intl.DateTimeFormat('en-GB', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Kolkata',
});
const DATE_TIME = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  hour12: true,
  minute: '2-digit',
  timeZone: 'Asia/Kolkata',
});
export const date = (value) => DATE.format(new Date(value));
export const dateTime = (value) => `${DATE_TIME.format(new Date(value))} IST`;

/**
 * New PDF with the bundled Noto Sans (it has the ₹ sign). Text is not compressed in tests so
 * assertions can read it; production output is compressed.
 * @param {{ size: 'A4' | 'A5', title: string, margin?: number }} options
 */
export function createDocument({ size, title, margin = 36 }) {
  const doc = new PDFDocument({
    size,
    margin,
    compress: process.env.NODE_ENV !== 'test',
    info: { Title: title, Author: SELLER.name, Creator: SELLER.name },
  });
  doc.registerFont('regular', `${FONT_DIR}NotoSans-Regular.ttf`);
  doc.registerFont('bold', `${FONT_DIR}NotoSans-Bold.ttf`);
  doc.font('regular').fillColor(COLORS.text);
  return doc;
}

/** Collect a finished document into a Buffer. */
export function toBuffer(doc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}

/** QR code PNG for a URL. */
export function qrPng(url) {
  return QRCode.toBuffer(url, { errorCorrectionLevel: 'M', margin: 1, width: 360 });
}

/** Small uppercase label followed by a value. Returns the y after the block. */
export function field(doc, label, value, x, y, width) {
  doc.font('regular').fontSize(7).fillColor(COLORS.muted).text(label.toUpperCase(), x, y, {
    width,
    characterSpacing: 0.6,
  });
  doc
    .font('bold')
    .fontSize(9.5)
    .fillColor(COLORS.text)
    .text(value || '—', x, doc.y + 1, { width });
  return doc.y;
}

/** Simple table: header row then rows; columns = [{ label, width, align }]. Returns end y. */
export function table(doc, { x, y, columns, rows, fontSize = 9 }) {
  const rowHeight = fontSize + 9;
  const totalWidth = columns.reduce((sum, c) => sum + c.width, 0);
  doc.rect(x, y, totalWidth, rowHeight).fill(COLORS.soft);
  let cx = x;
  doc
    .font('bold')
    .fontSize(fontSize - 1)
    .fillColor(COLORS.muted);
  for (const column of columns) {
    doc.text(column.label, cx + 6, y + 5, {
      width: column.width - 12,
      align: column.align ?? 'left',
    });
    cx += column.width;
  }
  let cy = y + rowHeight;
  doc.font('regular').fontSize(fontSize).fillColor(COLORS.text);
  for (const row of rows) {
    // Each row is as tall as its longest (wrapped) cell.
    const height =
      Math.max(
        ...row.map((cell, i) => doc.heightOfString(String(cell), { width: columns[i].width - 12 })),
      ) + 10;
    cx = x;
    row.forEach((cell, i) => {
      doc.text(String(cell), cx + 6, cy + 5, {
        width: columns[i].width - 12,
        align: columns[i].align ?? 'left',
      });
      cx += columns[i].width;
    });
    cy += height;
    doc
      .moveTo(x, cy)
      .lineTo(x + totalWidth, cy)
      .lineWidth(0.5)
      .strokeColor(COLORS.border)
      .stroke();
  }
  return cy;
}
