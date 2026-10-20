import { describe, expect, it } from 'vitest';
import { REFERENCE_PATTERN } from '../../src/config/bookings.js';
import { parseEnv } from '../../src/config/env.js';
import { BOOKING_STATUSES } from '../../src/config/tours.js';
import { cancellationQuote } from '../../src/modules/bookings/bookings.mapper.js';
import {
  assertTransition,
  canTransition,
  TRANSITIONS,
} from '../../src/modules/bookings/transitions.js';
import { bookingReference } from '../../src/utils/booking-reference.js';
import { istMidnight } from '../../src/utils/dates.js';

const ALLOWED = new Set(
  Object.entries(TRANSITIONS).flatMap(([from, targets]) => targets.map((to) => `${from}->${to}`)),
);

describe('booking state machine (TC-BOOK-12)', () => {
  it('matches the specified diagram exactly', () => {
    expect([...ALLOWED].sort()).toEqual(
      [
        'pending->confirmed',
        'pending->cancelled',
        'pending->expired',
        'expired->confirmed',
        'expired->payment_received_no_seats',
        'cancelled->confirmed',
        'cancelled->payment_received_no_seats',
        'payment_received_no_seats->confirmed',
        'payment_received_no_seats->cancelled',
        'confirmed->cancellation_requested',
        'confirmed->cancelled',
        'cancellation_requested->cancelled',
        'cancellation_requested->confirmed',
      ].sort(),
    );
  });

  for (const from of BOOKING_STATUSES) {
    for (const to of BOOKING_STATUSES) {
      const allowed = ALLOWED.has(`${from}->${to}`);
      it(`${from} → ${to} is ${allowed ? 'allowed' : 'refused with 409'}`, () => {
        expect(canTransition(from, to)).toBe(allowed);
        if (allowed) {
          expect(() => assertTransition(from, to)).not.toThrow();
        } else {
          expect(() => assertTransition(from, to)).toThrow(
            expect.objectContaining({ status: 409, code: 'INVALID_TRANSITION' }),
          );
        }
      });
    }
  }
});

describe('cancellation quote (refund policy slabs)', () => {
  const booking = (start) => ({ amount: 20000, snapshot: { startDate: istMidnight(start) } });
  const at = new Date('2026-05-01T06:00:00Z'); // 1 May in India

  it.each([
    ['2026-06-10', 40, 10, 18000],
    ['2026-05-31', 30, 10, 18000],
    ['2026-05-30', 29, 25, 15000],
    ['2026-05-16', 15, 25, 15000],
    ['2026-05-15', 14, 50, 10000],
    ['2026-05-08', 7, 50, 10000],
    ['2026-05-07', 6, 75, 5000],
    ['2026-05-04', 3, 75, 5000],
    ['2026-05-03', 2, 100, 0],
    ['2026-04-30', 0, 100, 0],
  ])('start %s: %i days before → %i%% charge, refund ₹%i', (start, days, pct, refund) => {
    expect(cancellationQuote(booking(start), at)).toEqual({
      daysBefore: days,
      chargePct: pct,
      suggestedRefund: refund,
      departureCancelled: false,
    });
  });

  it('refunds in full when BhaktiYatra cancelled the departure', () => {
    expect(
      cancellationQuote(
        { ...booking('2026-05-02'), cancellation: { departureCancelled: true } },
        at,
      ),
    ).toMatchObject({ chargePct: 0, suggestedRefund: 20000, departureCancelled: true });
  });

  it('rounds the refund down to whole rupees', () => {
    expect(
      cancellationQuote({ amount: 999, snapshot: { startDate: istMidnight('2026-05-20') } }, at)
        .suggestedRefund,
    ).toBe(749);
  });
});

describe('booking reference', () => {
  it('uses the Indian date and five unambiguous characters', () => {
    const reference = bookingReference(new Date('2026-05-09T20:00:00Z'));
    expect(reference).toMatch(/^BY-20260510-/);
    expect(reference).toMatch(REFERENCE_PATTERN);
    const many = new Set(Array.from({ length: 500 }, () => bookingReference()));
    expect(many.size).toBeGreaterThan(495);
    for (const r of many) expect(r.slice(12)).not.toMatch(/[01ILO]/);
  });
});

describe('payment provider safety', () => {
  const base = { MONGO_URL: 'mongodb://localhost/x', JWT_SECRET: 'x'.repeat(32) };

  const keys = {
    RAZORPAY_KEY_ID: 'rzp_test_x',
    RAZORPAY_KEY_SECRET: 'secret',
    RAZORPAY_WEBHOOK_SECRET: 'whsec',
    TICKET_SIGNING_SECRET: 't'.repeat(32),
    RESEND_API_KEY: 're_test',
    ADMIN_NOTIFY_EMAIL: 'owner@example.com',
  };

  it('refuses the stub payment provider in production', () => {
    expect(() =>
      parseEnv({ ...base, ...keys, NODE_ENV: 'production', PAYMENTS_PROVIDER: 'stub' }),
    ).toThrow(/PAYMENTS_PROVIDER must be razorpay/);
    expect(parseEnv({ ...base, ...keys, NODE_ENV: 'production' }).PAYMENTS_PROVIDER).toBe(
      'razorpay',
    );
  });

  it('requires all Razorpay keys in deployed environments only', () => {
    expect(() => parseEnv({ ...base, NODE_ENV: 'staging' })).toThrow(
      /RAZORPAY_KEY_ID is required in staging/,
    );
    expect(() =>
      parseEnv({ ...base, ...keys, RAZORPAY_WEBHOOK_SECRET: undefined, NODE_ENV: 'production' }),
    ).toThrow(/RAZORPAY_WEBHOOK_SECRET/);
    expect(parseEnv({ ...base, NODE_ENV: 'development' }).PAYMENTS_PROVIDER).toBe('razorpay');
  });

  it('defaults to Razorpay, a 15 minute hold and 10 seats per booking', () => {
    const env = parseEnv(base);
    expect(env.HOLD_MINUTES).toBe(15);
    expect(env.MAX_SEATS_PER_BOOKING).toBe(10);
    expect(env.PAYMENTS_PROVIDER).toBe('razorpay');
  });
});
