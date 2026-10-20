import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';

/** Booking endpoints (docs/04-api/05-bookings-payments.md). Each returns the full envelope. */
export const bookingsApi = {
  departure: (id) => apiFetch(`/departures/${id}`),
  create: (body, idempotencyKey) =>
    apiFetch('/bookings', { method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey } }),
  mine: (params = '') => apiFetch(`/bookings/my${params}`),
  get: (reference) => apiFetch(`/bookings/${reference}`),
  cancel: (reference, reason) =>
    apiFetch(`/bookings/${reference}/cancel`, {
      method: 'POST',
      body: reason ? { reason } : {},
    }),
  simulate: (reference, outcome) =>
    apiFetch(`/bookings/${reference}/simulate-payment`, { method: 'POST', body: { outcome } }),
};

/** Milliseconds to add to Date.now() to get the server's clock (from a response's serverTime). */
export function clockOffset(serverTime) {
  const server = serverTime ? new Date(serverTime).getTime() : NaN;
  return Number.isFinite(server) ? server - Date.now() : 0;
}

/**
 * Seconds left until `expiresAt` on the server's clock, ticking every second.
 * @param {string | null} expiresAt
 * @param {number} offsetMs from clockOffset()
 */
export function useCountdown(expiresAt, offsetMs = 0) {
  const target = expiresAt ? new Date(expiresAt).getTime() : null;
  const compute = () =>
    target ? Math.max(0, Math.ceil((target - Date.now() - offsetMs) / 1000)) : 0;
  const [seconds, setSeconds] = useState(compute);

  useEffect(() => {
    if (!target) return undefined;
    const id = setInterval(() => {
      const next = Math.max(0, Math.ceil((target - Date.now() - offsetMs) / 1000));
      setSeconds(next);
      if (next === 0) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [target, offsetMs]);

  const minutes = Math.floor(seconds / 60);
  return {
    seconds,
    expired: Boolean(target) && seconds === 0,
    label: `${minutes}:${String(seconds % 60).padStart(2, '0')}`,
  };
}

/** Today in India as "YYYY-MM-DD". */
export function todayIst() {
  return new Date(Date.now() + 330 * 60_000).toISOString().slice(0, 10);
}

const ACTIVE = new Set([
  'pending',
  'confirmed',
  'cancellation_requested',
  'payment_received_no_seats',
]);

/** Split bookings into the "My bookings" tabs. */
export function groupBookings(bookings, today = todayIst()) {
  const groups = { upcoming: [], past: [], cancelled: [] };
  for (const booking of bookings) {
    if (!ACTIVE.has(booking.bookingStatus)) groups.cancelled.push(booking);
    else if (booking.departure.endDate < today) groups.past.push(booking);
    else groups.upcoming.push(booking);
  }
  return groups;
}

export const BOOKING_STATUS_TONES = {
  pending: 'warning',
  confirmed: 'success',
  cancellation_requested: 'info',
  payment_received_no_seats: 'danger',
  cancelled: 'muted',
  expired: 'muted',
};
