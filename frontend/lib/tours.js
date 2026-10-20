/** Shared tour list settings used by the /tours page (server) and its filter form (client). */

export const TOUR_FILTER_KEYS = [
  'q',
  'destination',
  'pickupCity',
  'days',
  'maxPrice',
  'month',
  'bookable',
];

/** "days" URL values → [minDays, maxDays]. */
export const DAY_RANGES = { '1-3': [1, 3], '4-7': [4, 7], '8+': [8, undefined] };

export const TOUR_SORTS = ['default', 'nextDeparture', 'price', '-price', 'durationDays'];

export const BUDGETS = [10000, 20000, 35000, 50000];

/** Departure status label key and tone for badges. */
export function departureBadge(departure, fewSeats = 5) {
  if (departure.status === 'full' || departure.seatsAvailable === 0) {
    return { key: 'tours.statusFull', tone: 'muted' };
  }
  if (!departure.isBookable) return { key: 'tours.statusClosed', tone: 'muted' };
  if (departure.seatsAvailable <= fewSeats) return { key: 'tours.statusFew', tone: 'warning' };
  return { key: 'tours.statusAvailable', tone: 'success' };
}
