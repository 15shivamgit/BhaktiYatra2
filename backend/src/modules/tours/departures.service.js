import mongoose from 'mongoose';
import { ERROR_CODES } from '../../config/constants.js';
import { SEAT_HOLDING_STATUSES, UPCOMING_DEPARTURE_STATUSES } from '../../config/tours.js';
import { Booking } from '../../models/Booking.js';
import { Tour } from '../../models/Tour.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { AppError } from '../../utils/app-error.js';
import {
  addDays,
  addMonths,
  daysBetween,
  istMidnight,
  toIstYmd,
  todayIst,
} from '../../utils/dates.js';
import { recordAudit } from '../audit/audit.service.js';
import { revalidateContent } from '../content/revalidate.js';
import { toDepartureAdmin } from './departure-state.js';

const MAX_RETRIES = 5;

/* ---------- seat counts ---------- */

/**
 * Seats per departure from bookings: `bookedSeats` (confirmed or awaiting cancellation),
 * `heldSeats` (pending payment) and `revenue` (paid bookings).
 * @param {import('mongoose').Types.ObjectId[]} departureIds
 * @returns {Promise<Map<string, { bookedSeats: number, heldSeats: number, revenue: number, bookings: number }>>}
 */
export async function seatCounts(departureIds) {
  const rows = await Booking.aggregate([
    { $match: { departure: { $in: departureIds } } },
    {
      $group: {
        _id: '$departure',
        bookedSeats: {
          $sum: {
            $cond: [
              { $in: ['$bookingStatus', ['confirmed', 'cancellation_requested']] },
              '$seats',
              0,
            ],
          },
        },
        heldSeats: { $sum: { $cond: [{ $eq: ['$bookingStatus', 'pending'] }, '$seats', 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] } },
        bookings: { $sum: 1 },
      },
    },
  ]);
  return new Map(rows.map((r) => [r._id.toString(), r]));
}

async function countsFor(departure) {
  return (await seatCounts([departure._id])).get(departure._id.toString()) ?? {};
}

/* ---------- helpers ---------- */

async function getTour(id) {
  const tour = await Tour.findById(id);
  if (!tour) throw AppError.notFound('Tour not found');
  return tour;
}

async function getDeparture(id) {
  const departure = await TourDeparture.findById(id);
  if (!departure) throw AppError.notFound('Departure not found');
  return departure;
}

function assertEditable(departure) {
  if (!UPCOMING_DEPARTURE_STATUSES.includes(departure.status)) {
    throw AppError.conflict(
      ERROR_CODES.INVALID_TRANSITION,
      `A ${departure.status} departure cannot be changed`,
    );
  }
}

function assertPickupCity(tour, pickupCity) {
  if (pickupCity && !tour.pickupCities.includes(pickupCity)) {
    throw AppError.validation([
      {
        path: 'pickupCity',
        message: `Pickup city must be one of: ${tour.pickupCities.join(', ')}`,
      },
    ]);
  }
}

/** Keep `full` and `scheduled` in step with seatsAvailable (spec: full is derived). */
export async function syncFullStatus(departureId) {
  await TourDeparture.updateOne(
    { _id: departureId, status: 'scheduled', seatsAvailable: { $lte: 0 } },
    { $set: { status: 'full' } },
  );
  await TourDeparture.updateOne(
    { _id: departureId, status: 'full', seatsAvailable: { $gt: 0 } },
    { $set: { status: 'scheduled' } },
  );
}

async function refreshTourPage(ctx, tourOrId) {
  const tour =
    tourOrId?.slug !== undefined ? tourOrId : await Tour.findById(tourOrId).select('slug status');
  if (tour?.status === 'published') revalidateContent(ctx, [`tour:${tour.slug}`]);
}

/* ---------- queries ---------- */

/** GET /admin/tours/:id/departures with seat counts and revenue. */
export async function listDeparturesAdmin(tourId, { status, from, to }, now = new Date()) {
  await getTour(tourId);
  const filter = { tour: tourId };
  if (status) filter.status = status;
  if (from || to) {
    filter.startDate = {
      ...(from && { $gte: istMidnight(from) }),
      ...(to && { $lte: istMidnight(to) }),
    };
  }
  const departures = await TourDeparture.find(filter).sort({ startDate: 1 });
  const counts = await seatCounts(departures.map((d) => d._id));
  return departures.map((d) => toDepartureAdmin(d, counts.get(d._id.toString()), now));
}

export async function getDepartureAdmin(id, now = new Date()) {
  const departure = await getDeparture(id);
  return toDepartureAdmin(departure, await countsFor(departure), now);
}

/* ---------- create ---------- */

function departureFields(tour, input, now) {
  const start = istMidnight(input.startDate);
  if (start < todayIst(now)) {
    throw AppError.validation([{ path: 'startDate', message: 'Start date cannot be in the past' }]);
  }
  const end = input.endDate ? istMidnight(input.endDate) : addDays(start, tour.durationDays - 1);
  if (end < start) {
    throw AppError.validation([
      { path: 'endDate', message: 'End date cannot be before start date' },
    ]);
  }
  assertPickupCity(tour, input.pickupCity);
  return {
    tour: tour._id,
    startDate: start,
    endDate: end,
    pickupCity: input.pickupCity || null,
    price: input.price ?? tour.basePrice,
    totalSeats: input.totalSeats,
    seatsAvailable: input.totalSeats,
    status: 'scheduled',
    bookingCutoffHours: input.bookingCutoffHours,
    pickupInstructions: input.pickupInstructions,
    notes: input.notes,
  };
}

function assertTourAcceptsDepartures(tour) {
  if (tour.status === 'archived') {
    throw AppError.conflict(
      ERROR_CODES.INVALID_TRANSITION,
      'An archived tour cannot get new departures',
    );
  }
}

/** POST /admin/tours/:id/departures */
export async function createDeparture(ctx, tourId, input, actor, req, now = new Date()) {
  const tour = await getTour(tourId);
  assertTourAcceptsDepartures(tour);
  const departure = await TourDeparture.create({
    ...departureFields(tour, input, now),
    createdBy: actor._id,
    updatedBy: actor._id,
  });
  await recordAudit({
    actor,
    action: 'departure.create',
    entityType: 'TourDeparture',
    entityId: departure._id,
    after: {
      tour: tour._id,
      startDate: toIstYmd(departure.startDate),
      totalSeats: departure.totalSeats,
      price: departure.price,
    },
    req,
  });
  await refreshTourPage(ctx, tour);
  return toDepartureAdmin(departure, {}, now);
}

/** Dates for "every week/month from firstDate to lastDate" (inclusive). */
export function repeatDates({ firstDate, lastDate, every }, max) {
  const dates = [];
  const last = istMidnight(lastDate);
  let current = istMidnight(firstDate);
  let step = 0;
  while (current <= last) {
    dates.push(toIstYmd(current));
    if (dates.length > max) break;
    step += 1;
    current =
      every === 'week'
        ? addDays(istMidnight(firstDate), step * 7)
        : addMonths(istMidnight(firstDate), step);
  }
  return dates;
}

/** POST /admin/tours/:id/departures/bulk: one departure per week or month. */
export async function createDeparturesBulk(ctx, tourId, input, actor, req, max, now = new Date()) {
  const tour = await getTour(tourId);
  assertTourAcceptsDepartures(tour);
  const dates = repeatDates(input, max);
  if (dates.length > max) {
    throw AppError.validation([
      { path: 'lastDate', message: `That creates more than ${max} departures; shorten the range` },
    ]);
  }
  const { firstDate: _f, lastDate: _l, every: _e, ...common } = input;
  const docs = dates.map((startDate) => ({
    ...departureFields(tour, { ...common, startDate }, now),
    createdBy: actor._id,
    updatedBy: actor._id,
  }));
  const created = await TourDeparture.insertMany(docs);
  await recordAudit({
    actor,
    action: 'departure.bulk_create',
    entityType: 'Tour',
    entityId: tour._id,
    after: {
      count: created.length,
      every: input.every,
      firstDate: dates[0],
      lastDate: dates.at(-1),
    },
    req,
  });
  await refreshTourPage(ctx, tour);
  return created.map((d) => toDepartureAdmin(d, {}, now));
}

/* ---------- update ---------- */

/** PATCH /admin/departures/:id. Date changes need a departure without bookings. */
export async function updateDeparture(ctx, id, input, actor, req, now = new Date()) {
  const departure = await getDeparture(id);
  assertEditable(departure);
  const tour = await getTour(departure.tour);
  const counts = await countsFor(departure);
  const before = {
    startDate: toIstYmd(departure.startDate),
    endDate: toIstYmd(departure.endDate),
    price: departure.price,
    pickupCity: departure.pickupCity,
  };

  const changesDates =
    (input.startDate && input.startDate !== before.startDate) ||
    (input.endDate && input.endDate !== before.endDate);
  if (changesDates && (counts.bookedSeats || counts.heldSeats)) {
    throw new AppError(
      409,
      ERROR_CODES.HAS_BOOKINGS,
      'Dates cannot change once seats are booked or held; cancel the departure instead',
      { bookedSeats: counts.bookedSeats ?? 0, heldSeats: counts.heldSeats ?? 0 },
    );
  }

  if (input.startDate && input.startDate !== before.startDate) {
    const start = istMidnight(input.startDate);
    if (start < todayIst(now)) {
      throw AppError.validation([
        { path: 'startDate', message: 'Start date cannot be in the past' },
      ]);
    }
    // Keep the trip length unless a new end date is given too.
    const length = daysBetween(departure.startDate, departure.endDate);
    departure.startDate = start;
    if (!input.endDate) departure.endDate = addDays(start, length);
  }
  if (input.endDate) departure.endDate = istMidnight(input.endDate);
  if (departure.endDate < departure.startDate) {
    throw AppError.validation([
      { path: 'endDate', message: 'End date cannot be before start date' },
    ]);
  }
  if ('pickupCity' in input) {
    assertPickupCity(tour, input.pickupCity);
    departure.pickupCity = input.pickupCity || null;
  }
  for (const key of ['price', 'bookingCutoffHours', 'pickupInstructions', 'notes']) {
    if (key in input) departure[key] = input[key];
  }
  departure.updatedBy = actor._id;
  await departure.save();

  await recordAudit({
    actor,
    action: 'departure.update',
    entityType: 'TourDeparture',
    entityId: departure._id,
    before,
    after: { fields: Object.keys(input) },
    req,
  });
  await refreshTourPage(ctx, tour);
  return toDepartureAdmin(departure, counts, now);
}

/**
 * PATCH /admin/departures/:id/inventory. Changes totalSeats and seatsAvailable by the same delta
 * in one conditional update, so concurrent holds or adjustments can never push seatsAvailable
 * below zero (that is, totalSeats below committed seats).
 */
export async function adjustInventory(
  ctx,
  id,
  { totalSeats, reason },
  actor,
  req,
  now = new Date(),
) {
  let current = await getDeparture(id);
  assertEditable(current);
  const before = { totalSeats: current.totalSeats, seatsAvailable: current.seatsAvailable };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const delta = totalSeats - current.totalSeats;
    const updated = await TourDeparture.findOneAndUpdate(
      {
        _id: current._id,
        totalSeats: current.totalSeats,
        status: { $in: [...UPCOMING_DEPARTURE_STATUSES] },
        seatsAvailable: { $gte: -delta },
      },
      { $inc: { seatsAvailable: delta }, $set: { totalSeats, updatedBy: actor._id } },
      { returnDocument: 'after' },
    );
    if (updated) {
      await syncFullStatus(updated._id);
      const fresh = await getDeparture(updated._id);
      const counts = await countsFor(fresh);
      await recordAudit({
        actor,
        action: 'departure.inventory.update',
        entityType: 'TourDeparture',
        entityId: fresh._id,
        before,
        after: { totalSeats: fresh.totalSeats, seatsAvailable: fresh.seatsAvailable, reason },
        req,
      });
      await refreshTourPage(ctx, fresh.tour);
      return toDepartureAdmin(fresh, counts, now);
    }

    // No match: either the change breaches committed seats, or someone else changed the
    // departure in between. Re-read and decide.
    current = await getDeparture(id);
    assertEditable(current);
    const committed = current.totalSeats - current.seatsAvailable;
    if (totalSeats < committed) {
      const counts = await countsFor(current);
      throw new AppError(
        409,
        ERROR_CODES.BELOW_COMMITTED_SEATS,
        `At least ${committed} seats are booked or held; total seats cannot go below that`,
        { bookedSeats: counts.bookedSeats ?? 0, heldSeats: counts.heldSeats ?? 0, committed },
      );
    }
  }
  throw AppError.conflict(ERROR_CODES.CONFLICT, 'The departure is changing; try again');
}

/* ---------- cancel / delete ---------- */

/**
 * POST /admin/departures/:id/cancel. Pending bookings expire (seats released); confirmed ones
 * move to cancellation_requested with departureCancelled for refund processing (Phase 8).
 */
export async function cancelDeparture(ctx, id, { reason }, actor, req, now = new Date()) {
  const departure = await getDeparture(id);
  assertEditable(departure);

  const session = await mongoose.startSession();
  let affected = { pending: 0, confirmed: 0 };
  try {
    await session.withTransaction(async () => {
      const pending = await Booking.find(
        { departure: departure._id, bookingStatus: 'pending' },
        { seats: 1 },
        { session },
      );
      const released = pending.reduce((sum, b) => sum + b.seats, 0);
      const timelineEntry = (event) => ({
        at: now,
        event,
        by: actor._id,
        meta: { reason },
      });
      await Booking.updateMany(
        { departure: departure._id, bookingStatus: 'pending' },
        {
          $set: { bookingStatus: 'expired', cancelledAt: now },
          $push: { timeline: timelineEntry('expired_departure_cancelled') },
        },
        { session },
      );
      const confirmed = await Booking.updateMany(
        { departure: departure._id, bookingStatus: 'confirmed' },
        {
          $set: {
            bookingStatus: 'cancellation_requested',
            cancellation: { requestedAt: now, reason, departureCancelled: true },
          },
          $push: { timeline: timelineEntry('departure_cancelled') },
        },
        { session },
      );
      await TourDeparture.updateOne(
        { _id: departure._id },
        {
          $set: {
            status: 'cancelled',
            cancellation: { reason, at: now, by: actor._id },
            updatedBy: actor._id,
          },
          $inc: { seatsAvailable: released },
        },
        { session },
      );
      affected = { pending: pending.length, confirmed: confirmed.modifiedCount };
    });
  } finally {
    await session.endSession();
  }

  await recordAudit({
    actor,
    action: 'departure.cancel',
    entityType: 'TourDeparture',
    entityId: departure._id,
    before: { status: departure.status },
    after: { status: 'cancelled', reason, affected },
    req,
  });
  await refreshTourPage(ctx, departure.tour);
  // Notifying affected travellers (departure_cancelled email) arrives with Phase 7.
  return { departure: await getDepartureAdmin(departure._id, now), affected };
}

/** DELETE /admin/departures/:id: only when no booking of any status exists. */
export async function deleteDeparture(ctx, id, actor, req) {
  const departure = await getDeparture(id);
  if (await Booking.exists({ departure: departure._id })) {
    throw AppError.conflict(
      ERROR_CODES.HAS_BOOKINGS,
      'This departure has bookings; cancel it instead of deleting',
    );
  }
  await TourDeparture.deleteOne({ _id: departure._id });
  await recordAudit({
    actor,
    action: 'departure.delete',
    entityType: 'TourDeparture',
    entityId: departure._id,
    before: { tour: departure.tour, startDate: toIstYmd(departure.startDate) },
    req,
  });
  await refreshTourPage(ctx, departure.tour);
}

/* ---------- jobs ---------- */

/** Hourly job: scheduled/full departures whose end date has passed become completed. */
export async function completeDepartures(now = new Date()) {
  const result = await TourDeparture.updateMany(
    { status: { $in: [...UPCOMING_DEPARTURE_STATUSES] }, endDate: { $lt: todayIst(now) } },
    { $set: { status: 'completed' } },
  );
  return { completed: result.modifiedCount };
}

/** Archive guard: future active departures that still have pending or confirmed bookings. */
export async function activeDeparturesWithBookings(tourId, now = new Date()) {
  const departures = await TourDeparture.find({
    tour: tourId,
    status: { $in: [...UPCOMING_DEPARTURE_STATUSES] },
    startDate: { $gte: todayIst(now) },
  }).select('_id');
  if (!departures.length) return 0;
  return Booking.countDocuments({
    departure: { $in: departures.map((d) => d._id) },
    bookingStatus: { $in: [...SEAT_HOLDING_STATUSES] },
  });
}
