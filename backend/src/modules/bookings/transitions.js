import { ERROR_CODES } from '../../config/constants.js';
import { BOOKING_STATUSES } from '../../config/tours.js';
import { AppError } from '../../utils/app-error.js';

/**
 * The booking state machine (docs/05-features/04-booking-inventory.md). Every status change in
 * the code goes through assertTransition; anything not listed here is refused with 409.
 */
export const TRANSITIONS = Object.freeze({
  pending: ['confirmed', 'cancelled', 'expired'],
  expired: ['confirmed', 'payment_received_no_seats'],
  cancelled: ['confirmed', 'payment_received_no_seats'],
  payment_received_no_seats: ['confirmed', 'cancelled'],
  confirmed: ['cancellation_requested', 'cancelled'],
  cancellation_requested: ['cancelled', 'confirmed'],
});

export function canTransition(from, to) {
  return Boolean(TRANSITIONS[from]?.includes(to));
}

export function assertTransition(from, to) {
  if (!BOOKING_STATUSES.includes(to) || !canTransition(from, to)) {
    throw new AppError(
      409,
      ERROR_CODES.INVALID_TRANSITION,
      `A ${from.replaceAll('_', ' ')} booking cannot become ${to.replaceAll('_', ' ')}`,
      { from, to },
    );
  }
}

/** Timeline entry: human-readable history on the booking. */
export function timelineEntry(event, { by = 'system', meta, at = new Date() } = {}) {
  return { at, event, by, ...(meta && { meta }) };
}
