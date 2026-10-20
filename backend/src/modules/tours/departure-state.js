import { toIstYmd } from '../../utils/dates.js';

const HOUR_MS = 3_600_000;

/** Moment after which a departure no longer takes bookings: startDate − cutoff hours. */
export function bookingClosesAt(departure) {
  return new Date(
    new Date(departure.startDate).getTime() - (departure.bookingCutoffHours ?? 0) * HOUR_MS,
  );
}

/** FR-TOUR-05: scheduled, seats left, and before the booking cutoff. */
export function isBookable(departure, now = new Date()) {
  return (
    departure.status === 'scheduled' &&
    departure.seatsAvailable > 0 &&
    now < bookingClosesAt(departure)
  );
}

/** Public departure shape (docs/04-api/04-tours-departures.md "DeparturePublic"). */
export function toDeparturePublic(departure, now = new Date()) {
  return {
    id: departure._id.toString(),
    startDate: toIstYmd(departure.startDate),
    endDate: toIstYmd(departure.endDate),
    pickupCity: departure.pickupCity ?? null,
    pickupInstructions: departure.pickupInstructions || null,
    price: departure.price,
    seatsAvailable: departure.seatsAvailable,
    totalSeats: departure.totalSeats,
    status: departure.status,
    isBookable: isBookable(departure, now),
    bookingClosesAt: bookingClosesAt(departure).toISOString(),
  };
}

/** Admin shape: public fields plus internal notes, cutoff and seat counts. */
export function toDepartureAdmin(departure, counts = {}, now = new Date()) {
  return {
    ...toDeparturePublic(departure, now),
    tour: departure.tour?._id?.toString?.() ?? departure.tour?.toString(),
    bookingCutoffHours: departure.bookingCutoffHours,
    notes: departure.notes ?? '',
    cancellation: departure.cancellation
      ? { reason: departure.cancellation.reason, at: departure.cancellation.at }
      : null,
    bookedSeats: counts.bookedSeats ?? 0,
    heldSeats: counts.heldSeats ?? 0,
    revenue: counts.revenue ?? 0,
    createdAt: departure.createdAt,
    updatedAt: departure.updatedAt,
  };
}
