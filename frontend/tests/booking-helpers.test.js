import { describe, expect, it, vi } from 'vitest';
import { clockOffset, groupBookings } from '@/lib/bookings';

const booking = (status, endDate) => ({ bookingStatus: status, departure: { endDate } });

describe('booking helpers', () => {
  it('groups bookings into upcoming, past and cancelled tabs', () => {
    const groups = groupBookings(
      [
        booking('pending', '2026-06-01'),
        booking('confirmed', '2026-06-01'),
        booking('confirmed', '2026-04-01'),
        booking('cancellation_requested', '2026-05-20'),
        booking('expired', '2026-06-01'),
        booking('cancelled', '2026-06-01'),
      ],
      '2026-05-10',
    );
    expect(groups.upcoming.map((b) => b.bookingStatus)).toEqual([
      'pending',
      'confirmed',
      'cancellation_requested',
    ]);
    expect(groups.past.map((b) => b.departure.endDate)).toEqual(['2026-04-01']);
    expect(groups.cancelled.map((b) => b.bookingStatus)).toEqual(['expired', 'cancelled']);
  });

  it('measures the server clock offset from a response timestamp', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-05-10T10:00:00Z'));
    expect(clockOffset('2026-05-10T10:00:05Z')).toBe(5000);
    expect(clockOffset(undefined)).toBe(0);
    vi.useRealTimers();
  });
});
