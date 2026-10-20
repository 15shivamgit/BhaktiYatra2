import { describe, expect, it } from 'vitest';
import { allowedActions, csvCell } from '../../src/modules/bookings/bookings.admin.service.js';
import { rangeStart } from '../../src/modules/dashboard/dashboard.service.js';
import { toIstDateTime, toIstYmd } from '../../src/utils/dates.js';

describe('CSV cells', () => {
  it('quotes commas, quotes and line breaks', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(42)).toBe('42');
  });

  it('neutralises values a spreadsheet would run as formulas', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('+919876543210')).toBe("'+919876543210");
    expect(csvCell('-5')).toBe("'-5");
    expect(csvCell('@cmd')).toBe("'@cmd");
    expect(csvCell(-5)).toBe('-5'); // real numbers stay numbers
  });

  it('keeps Hindi text and the rupee sign as they are', () => {
    expect(csvCell('आशा देवी')).toBe('आशा देवी');
    expect(csvCell('₹7,999')).toBe('"₹7,999"');
  });
});

describe('dashboard ranges', () => {
  const now = new Date('2026-10-21T10:00:00+05:30');

  it('counts the last N calendar days in India, including today', () => {
    expect(toIstYmd(rangeStart('7d', now))).toBe('2026-10-15');
    expect(toIstYmd(rangeStart('30d', now))).toBe('2026-09-22');
    expect(toIstYmd(rangeStart('90d', now))).toBe('2026-07-24');
  });

  it('month to date starts on the 1st in IST', () => {
    expect(toIstYmd(rangeStart('mtd', now))).toBe('2026-10-01');
    // 1 Nov 00:30 IST is still 31 Oct in UTC.
    expect(toIstYmd(rangeStart('mtd', new Date('2026-10-31T19:00:00Z')))).toBe('2026-11-01');
  });

  it('formats IST date and time for exports', () => {
    expect(toIstDateTime(new Date('2026-10-21T08:35:00Z'))).toBe('2026-10-21 14:05');
  });
});

describe('admin booking actions', () => {
  const actions = (bookingStatus, cancellation) => allowedActions({ bookingStatus, cancellation });

  it('offers only what the state machine allows', () => {
    expect(actions('pending')).toEqual(['addNote', 'markPaid', 'cancel']);
    expect(actions('confirmed')).toEqual([
      'addNote',
      'cancel',
      'regenerateDocuments',
      'resendConfirmation',
    ]);
    expect(actions('cancellation_requested')).toEqual(['addNote', 'cancel', 'rejectCancellation']);
    expect(actions('cancellation_requested', { departureCancelled: true })).toEqual([
      'addNote',
      'cancel',
    ]);
    expect(actions('payment_received_no_seats')).toEqual(['addNote', 'cancel', 'confirmSeats']);
    expect(actions('expired')).toEqual(['addNote']);
    expect(actions('cancelled')).toEqual(['addNote']);
  });
});
