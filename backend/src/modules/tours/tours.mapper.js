import { primaryImage } from '../../models/shared.js';
import { toIstYmd } from '../../utils/dates.js';

const sortedImages = (images = []) =>
  [...images]
    .sort((a, b) => a.order - b.order)
    .map(({ url, publicId, alt, width, height, isPrimary, order }) => ({
      url,
      publicId,
      alt,
      width: width ?? null,
      height: height ?? null,
      isPrimary: Boolean(isPrimary),
      order,
    }));

/**
 * List shape (docs/04-api/04-tours-departures.md "TourCard").
 * @param {any} tour
 * @param {{ fromPrice?: number, nextDeparture?: any }} pricing from the departures aggregation
 */
export function toTourCard(tour, { fromPrice, nextDeparture } = {}) {
  const bookablePrice = typeof fromPrice === 'number' ? fromPrice : null;
  return {
    id: tour._id.toString(),
    slug: tour.slug,
    title: tour.title,
    summary: tour.summary,
    destinations: tour.destinations ?? [],
    durationDays: tour.durationDays,
    durationNights: tour.durationNights,
    primaryImage: primaryImage(tour.images),
    fromPrice: bookablePrice ?? tour.basePrice,
    /** True when no bookable departure exists and the base price is shown ("Indicative"). */
    priceIsIndicative: bookablePrice === null,
    nextDeparture: nextDeparture
      ? {
          id: nextDeparture._id.toString(),
          startDate: toIstYmd(nextDeparture.startDate),
          seatsAvailable: nextDeparture.seatsAvailable,
          price: nextDeparture.price,
        }
      : null,
    featured: Boolean(tour.featured),
  };
}

/** Public detail fields (temples and departures are added by the service). */
export function toTourPublic(tour, pricing) {
  return {
    ...toTourCard(tour, pricing),
    description: tour.description ?? '',
    highlights: tour.highlights ?? [],
    itinerary: (tour.itinerary ?? []).map(({ day, title, description, meals, stay }) => ({
      day,
      title: title ?? '',
      description: description ?? '',
      meals: meals ?? [],
      stay: stay ?? '',
    })),
    inclusions: tour.inclusions ?? [],
    exclusions: tour.exclusions ?? [],
    pickupCities: tour.pickupCities ?? [],
    basePrice: tour.basePrice,
    currency: tour.currency ?? 'INR',
    images: sortedImages(tour.images),
    faqs: (tour.faqs ?? []).map(({ question, answer }) => ({ question, answer })),
    seo: tour.seo ?? null,
    publishedAt: tour.publishedAt ?? null,
    updatedAt: tour.updatedAt,
  };
}

/** Admin shape: everything, temples as ids or populated summaries. */
export function toTourAdmin(tour) {
  const { fromPrice: _f, priceIsIndicative: _p, nextDeparture: _n, ...rest } = toTourPublic(tour);
  return {
    ...rest,
    temples: (tour.temples ?? []).map((t) =>
      typeof t === 'object' && t.name
        ? { id: t._id.toString(), name: t.name, slug: t.slug, city: t.city, status: t.status }
        : { id: t.toString() },
    ),
    status: tour.status,
    notes: tour.notes ?? '',
    createdAt: tour.createdAt,
  };
}

export function toTourAdminListItem(tour, counts = {}) {
  return {
    id: tour._id.toString(),
    slug: tour.slug,
    title: tour.title,
    durationDays: tour.durationDays,
    basePrice: tour.basePrice,
    status: tour.status,
    featured: Boolean(tour.featured),
    primaryImage: primaryImage(tour.images),
    imageCount: tour.images?.length ?? 0,
    departureCount: counts.departureCount ?? 0,
    upcomingDepartureCount: counts.upcomingDepartureCount ?? 0,
    updatedAt: tour.updatedAt,
  };
}
