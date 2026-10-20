import { DEPARTURE_WINDOW_MONTHS, UPCOMING_DEPARTURE_STATUSES } from '../../config/tours.js';
import { Circuit } from '../../models/Circuit.js';
import { SlugRedirect } from '../../models/SlugRedirect.js';
import { Temple } from '../../models/Temple.js';
import { Tour } from '../../models/Tour.js';
import { TourDeparture } from '../../models/TourDeparture.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex } from '../../utils/crypto.js';
import { addMonths, istMidnight, istMonthRange, todayIst } from '../../utils/dates.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { toTempleCard } from '../temples/temples.mapper.js';
import { isBookable, toDeparturePublic } from './departure-state.js';
import { toTourCard, toTourPublic } from './tours.mapper.js';

const FAR_FUTURE = new Date('9999-12-31T00:00:00Z');

const SORTS = Object.freeze({
  default: { featured: -1, publishedAt: -1, _id: 1 },
  price: { effectivePrice: 1, _id: 1 },
  '-price': { effectivePrice: -1, _id: 1 },
  durationDays: { durationDays: 1, _id: 1 },
  nextDeparture: { nextDepartureSort: 1, _id: 1 },
});

/**
 * Aggregation stages that attach upcoming departures, `fromPrice` (cheapest bookable departure)
 * and `nextDeparture` (earliest bookable departure) to each tour (FR-TOUR-02).
 */
function pricingStages(now) {
  const today = todayIst(now);
  return [
    {
      $lookup: {
        from: TourDeparture.collection.name,
        let: { tourId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$tour', '$$tourId'] },
              status: { $in: [...UPCOMING_DEPARTURE_STATUSES] },
              startDate: { $gte: today },
            },
          },
          { $sort: { startDate: 1 } },
          {
            $project: {
              startDate: 1,
              price: 1,
              seatsAvailable: 1,
              status: 1,
              bookingCutoffHours: 1,
            },
          },
        ],
        as: 'upcoming',
      },
    },
    {
      $addFields: {
        bookable: {
          $filter: {
            input: '$upcoming',
            as: 'd',
            cond: {
              $and: [
                { $eq: ['$$d.status', 'scheduled'] },
                { $gt: ['$$d.seatsAvailable', 0] },
                {
                  $lt: [
                    now,
                    {
                      $subtract: [
                        '$$d.startDate',
                        { $multiply: [{ $ifNull: ['$$d.bookingCutoffHours', 0] }, 3_600_000] },
                      ],
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    },
    {
      $addFields: {
        fromPrice: { $min: '$bookable.price' },
        nextDeparture: { $first: '$bookable' },
      },
    },
    {
      $addFields: {
        effectivePrice: { $ifNull: ['$fromPrice', '$basePrice'] },
        nextDepartureSort: { $ifNull: ['$nextDeparture.startDate', FAR_FUTURE] },
      },
    },
  ];
}

const cardFromAggregate = (doc) =>
  toTourCard(doc, { fromPrice: doc.fromPrice, nextDeparture: doc.nextDeparture });

/**
 * Tour cards for a base filter, with pricing, optional post-pricing filters, sort and paging.
 * @returns {Promise<{ tours: any[], total: number }>}
 */
async function aggregateTourCards(match, { after = {}, sort = 'default', skip = 0, limit, now }) {
  const pipeline = [
    { $match: { status: 'published', ...match } },
    ...pricingStages(now),
    ...(Object.keys(after).length ? [{ $match: after }] : []),
    { $sort: SORTS[sort] },
    {
      $facet: {
        items: [{ $skip: skip }, ...(limit ? [{ $limit: limit }] : [])],
        total: [{ $count: 'n' }],
      },
    },
  ];
  const [result] = await Tour.aggregate(pipeline);
  return { tours: result.items.map(cardFromAggregate), total: result.total[0]?.n ?? 0 };
}

/** GET /tours (docs/04-api/04-tours-departures.md). */
export async function listTours(query, now = new Date()) {
  const match = {};
  const after = {};
  if (query.featured !== undefined) match.featured = query.featured;
  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    match.$or = [{ title: pattern }, { summary: pattern }, { destinations: pattern }];
  }
  if (query.destination) {
    match.destinations = new RegExp(`^${escapeRegex(query.destination)}$`, 'i');
  }
  if (query.pickupCity) {
    match.pickupCities = new RegExp(`^${escapeRegex(query.pickupCity)}$`, 'i');
  }
  if (query.minDays !== undefined || query.maxDays !== undefined) {
    match.durationDays = {
      ...(query.minDays !== undefined && { $gte: query.minDays }),
      ...(query.maxDays !== undefined && { $lte: query.maxDays }),
    };
  }
  const templeIds = [];
  if (query.temple) {
    const temple = await Temple.findOne({ slug: query.temple, status: 'published' }).select('_id');
    if (!temple) return { tours: [], meta: pageMeta(query, 0) };
    templeIds.push(temple._id);
  }
  if (query.circuit) {
    const circuit = await Circuit.findOne({ slug: query.circuit, status: 'published' }).select(
      'temples',
    );
    if (!circuit?.temples.length) return { tours: [], meta: pageMeta(query, 0) };
    match.temples = { $in: circuit.temples };
  }
  if (templeIds.length) match.temples = { ...match.temples, $all: templeIds };

  if (query.month) {
    const [start, end] = istMonthRange(query.month);
    after.upcoming = { $elemMatch: { startDate: { $gte: start, $lt: end } } };
  }
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    after.effectivePrice = {
      ...(query.minPrice !== undefined && { $gte: query.minPrice }),
      ...(query.maxPrice !== undefined && { $lte: query.maxPrice }),
    };
  }
  if (query.bookableOnly) after.nextDeparture = { $ne: null };

  const { tours, total } = await aggregateTourCards(match, {
    after,
    sort: query.sort,
    skip: skipFor(query),
    limit: query.limit,
    now,
  });
  return { tours, meta: pageMeta(query, total) };
}

/** Values for the tour filter controls, from published tours. */
export async function tourFilters() {
  const [destinations, pickupCities, range] = await Promise.all([
    Tour.distinct('destinations', { status: 'published' }),
    Tour.distinct('pickupCities', { status: 'published' }),
    Tour.aggregate([
      { $match: { status: 'published' } },
      {
        $group: {
          _id: null,
          minPrice: { $min: '$basePrice' },
          maxPrice: { $max: '$basePrice' },
          maxDays: { $max: '$durationDays' },
        },
      },
    ]),
  ]);
  const sort = (list) => [...list].sort((a, b) => a.localeCompare(b));
  return {
    destinations: sort(destinations),
    pickupCities: sort(pickupCities),
    priceRange: range[0] ? { min: range[0].minPrice, max: range[0].maxPrice } : { min: 0, max: 0 },
    maxDays: range[0]?.maxDays ?? 0,
  };
}

function upcomingFilter(tourId, now, { from, to } = {}) {
  const start = from ? istMidnight(from) : todayIst(now);
  const today = todayIst(now);
  const end = to ? istMidnight(to) : addMonths(today, DEPARTURE_WINDOW_MONTHS);
  return {
    tour: tourId,
    status: { $in: [...UPCOMING_DEPARTURE_STATUSES] },
    startDate: { $gte: start < today ? today : start, $lte: end },
  };
}

function pricingFromDepartures(departures, now) {
  const bookable = departures.filter((d) => isBookable(d, now));
  return {
    fromPrice: bookable.length ? Math.min(...bookable.map((d) => d.price)) : undefined,
    nextDeparture: bookable[0],
  };
}

async function redirectFor(slug) {
  const redirect = await SlugRedirect.findOne({ entityType: 'tour', fromSlug: slug });
  return redirect?.toSlug ?? null;
}

/** GET /tours/:slug: tour with temples in order and departures for the next 12 months. */
export async function getTourBySlug(slug, now = new Date()) {
  const tour = await Tour.findOne({ slug, status: 'published' });
  if (!tour) {
    const redirectTo = await redirectFor(slug);
    if (redirectTo) return { redirectTo };
    throw AppError.notFound('Tour not found');
  }
  const [temples, departures] = await Promise.all([
    Temple.find({ _id: { $in: tour.temples }, status: 'published' }),
    TourDeparture.find(upcomingFilter(tour._id, now)).sort({ startDate: 1 }),
  ]);
  const byId = new Map(temples.map((t) => [t._id.toString(), t]));
  return {
    tour: {
      ...toTourPublic(tour, pricingFromDepartures(departures, now)),
      temples: tour.temples
        .map((id) => byId.get(id.toString()))
        .filter(Boolean)
        .map((t) => toTempleCard(t)),
      departures: departures.map((d) => toDeparturePublic(d, now)),
    },
  };
}

export async function listDeparturesBySlug(slug, range, now = new Date()) {
  const tour = await Tour.findOne({ slug, status: 'published' }).select('_id');
  if (!tour) throw AppError.notFound('Tour not found');
  const departures = await TourDeparture.find(upcomingFilter(tour._id, now, range)).sort({
    startDate: 1,
  });
  return departures.map((d) => toDeparturePublic(d, now));
}

/** GET /departures/:id: fresh availability for the booking page. */
export async function getDeparturePublic(id, now = new Date()) {
  const departure = await TourDeparture.findById(id).populate(
    'tour',
    'slug title durationDays images status',
  );
  if (!departure?.tour || departure.tour.status !== 'published') {
    throw AppError.notFound('Departure not found');
  }
  const { tour } = departure;
  const card = toTourCard(tour);
  return {
    ...toDeparturePublic(departure, now),
    tour: {
      id: card.id,
      slug: card.slug,
      title: card.title,
      durationDays: card.durationDays,
      primaryImage: card.primaryImage,
    },
  };
}

/** Published tours that visit any of these temples (temple and circuit pages). */
export async function toursCoveringTemples(templeIds, { limit = 6, now = new Date() } = {}) {
  if (!templeIds.length) return [];
  const { tours } = await aggregateTourCards(
    { temples: { $in: templeIds } },
    { sort: 'nextDeparture', limit, now },
  );
  return tours;
}

export async function tourSitemapEntries() {
  const tours = await Tour.find({ status: 'published' }).select('slug updatedAt').sort({ slug: 1 });
  return tours.map((t) => ({ slug: t.slug, updatedAt: t.updatedAt }));
}
