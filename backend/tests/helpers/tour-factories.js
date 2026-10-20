import { Booking } from '../../src/models/Booking.js';
import { Tour } from '../../src/models/Tour.js';
import { TourDeparture } from '../../src/models/TourDeparture.js';
import { addDays, istMidnight, toIstYmd, todayIst } from '../../src/utils/dates.js';

let counter = 0;

/** "YYYY-MM-DD" for today + n days in IST. */
export const dayFromToday = (n) => toIstYmd(addDays(todayIst(), n));

/** A tour that satisfies every publish prerequisite unless overridden. */
export function tourDefaults(overrides = {}) {
  counter += 1;
  const durationDays = overrides.durationDays ?? 3;
  return {
    title: `Test Yatra ${counter}`,
    slug: `test-yatra-${counter}`,
    summary: 'A short guided pilgrimage with stays and transport included.',
    description: '<p>Day-by-day guided pilgrimage.</p>',
    destinations: ['Haridwar', 'Rishikesh'],
    durationDays,
    durationNights: durationDays - 1,
    itinerary: Array.from({ length: durationDays }, (_, i) => ({
      day: i + 1,
      title: `Day ${i + 1}`,
      description: '<p>Darshan and travel.</p>',
      meals: ['breakfast'],
      stay: 'Hotel',
    })),
    inclusions: ['Hotel stay', 'AC transport'],
    exclusions: ['Personal expenses'],
    pickupCities: ['Delhi', 'Haridwar'],
    basePrice: 15000,
    images: [
      {
        url: `https://res.cloudinary.com/demo/image/upload/seed/tour${counter}.jpg`,
        publicId: `BhaktiYatra/tour${counter}`,
        alt: 'Pilgrims at the ghat',
        isPrimary: true,
        order: 0,
      },
    ],
    status: 'published',
    publishedAt: new Date(),
    ...overrides,
  };
}

export function makeTour(overrides = {}) {
  return Tour.create(tourDefaults(overrides));
}

/**
 * @param {any} tour
 * @param {{ inDays?: number, seats?: number, booked?: number } & Record<string, any>} [options]
 */
export function makeDeparture(tour, { inDays = 30, seats = 20, ...overrides } = {}) {
  const startDate = istMidnight(dayFromToday(inDays));
  return TourDeparture.create({
    tour: tour._id,
    startDate,
    endDate: addDays(startDate, tour.durationDays - 1),
    price: tour.basePrice,
    totalSeats: seats,
    seatsAvailable: seats,
    status: 'scheduled',
    ...overrides,
  });
}

/**
 * A booking that holds seats. Also takes the seats off the departure, keeping the inventory
 * invariant true like the real hold will in Phase 5.
 */
export async function makeBooking(
  departure,
  user,
  { seats = 2, status = 'confirmed', ...overrides } = {},
) {
  counter += 1;
  const holdsSeats = ['pending', 'confirmed', 'cancellation_requested'].includes(status);
  if (holdsSeats) {
    await TourDeparture.updateOne({ _id: departure._id }, { $inc: { seatsAvailable: -seats } });
  }
  return Booking.create({
    bookingReference: `BY-TEST-${String(counter).padStart(5, '0')}`,
    user: user._id,
    tour: departure.tour,
    departure: departure._id,
    snapshot: {
      tourTitle: 'Test Yatra',
      tourSlug: 'test-yatra',
      startDate: departure.startDate,
      endDate: departure.endDate,
      durationDays: 3,
    },
    contact: { name: 'Asha Devi', email: 'asha@example.com', phone: '+919876543210' },
    travellers: Array.from({ length: seats }, (_, i) => ({
      name: `Traveller ${i + 1}`,
      age: 40,
      gender: 'female',
    })),
    seats,
    unitPrice: departure.price,
    amount: departure.price * seats,
    bookingStatus: status,
    paymentStatus: status === 'confirmed' ? 'paid' : 'pending',
    holdExpiresAt: addDays(new Date(), 1),
    ...overrides,
  });
}
