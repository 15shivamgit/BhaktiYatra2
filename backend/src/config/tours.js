/** Closed sets and limits for tours, departures and bookings (docs/03-database/02-models.md). */

export const DEPARTURE_STATUSES = Object.freeze(['scheduled', 'full', 'completed', 'cancelled']);
/** Departures a visitor can still see (and, if bookable, book). */
export const UPCOMING_DEPARTURE_STATUSES = Object.freeze(['scheduled', 'full']);

export const BOOKING_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'cancelled',
  'expired',
  'cancellation_requested',
  'payment_received_no_seats',
]);
export const PAYMENT_STATUSES = Object.freeze([
  'pending',
  'paid',
  'failed',
  'refunded',
  'partially_refunded',
]);
/** Bookings that hold seats on a departure. */
export const SEAT_HOLDING_STATUSES = Object.freeze([
  'pending',
  'confirmed',
  'cancellation_requested',
]);
export const GENDERS = Object.freeze(['male', 'female', 'other']);

export const MEALS = Object.freeze(['breakfast', 'lunch', 'dinner']);

export const MAX_TOUR_IMAGES = 12;
export const MAX_TOUR_DAYS = 30;
export const MAX_DEPARTURE_SEATS = 200;
export const DEFAULT_BOOKING_CUTOFF_HOURS = 24;
/** Public tour pages list departures this far ahead. */
export const DEPARTURE_WINDOW_MONTHS = 12;
/** "Few seats left" badge threshold. */
export const FEW_SEATS_THRESHOLD = 5;
/** Bulk add never creates more than this many departures in one request. */
export const MAX_BULK_DEPARTURES = 52;
