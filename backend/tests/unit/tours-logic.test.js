import { describe, expect, it, vi } from 'vitest';
import { startJobs } from '../../src/jobs/index.js';
import { bookingClosesAt, isBookable } from '../../src/modules/tours/departure-state.js';
import { repeatDates } from '../../src/modules/tours/departures.service.js';
import {
  addDays,
  addMonths,
  daysBetween,
  isValidYmd,
  istMidnight,
  istMonthRange,
  toIstYmd,
  todayIst,
} from '../../src/utils/dates.js';

describe('IST dates', () => {
  it('stores a calendar day as midnight IST and reads it back', () => {
    const date = istMidnight('2026-05-10');
    expect(date.toISOString()).toBe('2026-05-09T18:30:00.000Z');
    expect(toIstYmd(date)).toBe('2026-05-10');
  });

  it('uses the Indian calendar day around UTC midnight', () => {
    // 20:00 UTC on 9 May is 01:30 on 10 May in India.
    expect(toIstYmd(new Date('2026-05-09T20:00:00Z'))).toBe('2026-05-10');
    expect(todayIst(new Date('2026-05-09T20:00:00Z')).toISOString()).toBe(
      '2026-05-09T18:30:00.000Z',
    );
    // 18:00 UTC on 9 May is still 23:30 on 9 May in India.
    expect(toIstYmd(new Date('2026-05-09T18:00:00Z'))).toBe('2026-05-09');
  });

  it('validates real dates only', () => {
    expect(isValidYmd('2026-02-28')).toBe(true);
    expect(isValidYmd('2026-02-30')).toBe(false);
    expect(isValidYmd('2026-5-1')).toBe(false);
    expect(isValidYmd(20260501)).toBe(false);
  });

  it('adds months without overflowing short months', () => {
    expect(toIstYmd(addMonths(istMidnight('2026-01-31'), 1))).toBe('2026-02-28');
    expect(toIstYmd(addMonths(istMidnight('2026-11-15'), 2))).toBe('2027-01-15');
  });

  it('gives month ranges and day differences', () => {
    const [start, end] = istMonthRange('2026-05');
    expect(toIstYmd(start)).toBe('2026-05-01');
    expect(toIstYmd(end)).toBe('2026-06-01');
    expect(daysBetween(istMidnight('2026-05-10'), istMidnight('2026-05-16'))).toBe(6);
    expect(toIstYmd(addDays(istMidnight('2026-12-31'), 1))).toBe('2027-01-01');
  });
});

describe('departure bookability (FR-TOUR-05)', () => {
  const departure = {
    status: 'scheduled',
    seatsAvailable: 4,
    startDate: istMidnight('2026-05-10'),
    bookingCutoffHours: 24,
  };

  it('closes bookings cutoff hours before the start', () => {
    expect(bookingClosesAt(departure).toISOString()).toBe('2026-05-08T18:30:00.000Z');
    expect(isBookable(departure, new Date('2026-05-08T18:29:00Z'))).toBe(true);
    expect(isBookable(departure, new Date('2026-05-08T18:30:00Z'))).toBe(false);
  });

  it('is not bookable when full, cancelled or out of seats', () => {
    const before = new Date('2026-05-01T00:00:00Z');
    expect(isBookable({ ...departure, status: 'full' }, before)).toBe(false);
    expect(isBookable({ ...departure, status: 'cancelled' }, before)).toBe(false);
    expect(isBookable({ ...departure, seatsAvailable: 0 }, before)).toBe(false);
  });
});

describe('bulk departure dates', () => {
  it('repeats weekly and monthly, inclusive of the last date', () => {
    expect(
      repeatDates({ firstDate: '2026-05-01', lastDate: '2026-05-29', every: 'week' }, 52),
    ).toEqual(['2026-05-01', '2026-05-08', '2026-05-15', '2026-05-22', '2026-05-29']);
    expect(
      repeatDates({ firstDate: '2026-01-31', lastDate: '2026-04-30', every: 'month' }, 52),
    ).toEqual(['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);
  });

  it('stops one past the limit so the caller can refuse', () => {
    expect(
      repeatDates({ firstDate: '2026-01-01', lastDate: '2027-12-31', every: 'week' }, 3),
    ).toHaveLength(4);
  });
});

describe('job runner', () => {
  it('runs each job after start-up and on its interval, and logs failures', async () => {
    vi.useFakeTimers();
    const logger = { info: vi.fn(), error: vi.fn() };
    const ok = vi.fn().mockResolvedValue({ completed: 2 });
    const failing = vi.fn().mockRejectedValue(new Error('boom'));
    const stop = startJobs({ logger }, [
      { name: 'ok', everyMs: 60_000, run: ok },
      { name: 'failing', everyMs: 60_000, run: failing },
    ]);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(ok).toHaveBeenCalledTimes(1);
    expect(logger.error).toHaveBeenCalledWith({ job: 'failing', err: 'boom' }, 'Job failed');
    await vi.advanceTimersByTimeAsync(60_000);
    expect(ok).toHaveBeenCalledTimes(2);
    stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(ok).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
