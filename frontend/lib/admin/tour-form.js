/**
 * Convert between the admin API tour shape and flat form values (strings, so inputs stay
 * controlled), and back to the payload tours.schemas.js accepts.
 */

const lines = (text) =>
  String(text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const commaList = (text) =>
  String(text ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

export const emptyDay = () => ({ title: '', description: '', meals: [], stay: '' });

export function emptyTourValues() {
  return {
    title: '',
    slug: '',
    summary: '',
    description: '',
    destinationsText: '',
    durationDays: '3',
    durationNights: '2',
    basePrice: '',
    pickupCitiesText: '',
    featured: false,
    highlightsText: '',
    itinerary: [],
    inclusionsText: '',
    exclusionsText: '',
    temples: [],
    faqs: [],
    seo: { title: '', description: '' },
    notes: '',
  };
}

/** @param {any} tour admin API shape */
export function toFormValues(tour) {
  return {
    ...emptyTourValues(),
    title: tour.title ?? '',
    slug: tour.slug ?? '',
    summary: tour.summary ?? '',
    description: tour.description ?? '',
    destinationsText: (tour.destinations ?? []).join(', '),
    durationDays: String(tour.durationDays ?? ''),
    durationNights: String(tour.durationNights ?? ''),
    basePrice: String(tour.basePrice ?? ''),
    pickupCitiesText: (tour.pickupCities ?? []).join(', '),
    featured: Boolean(tour.featured),
    highlightsText: (tour.highlights ?? []).join('\n'),
    itinerary: (tour.itinerary ?? []).map((d) => ({
      title: d.title ?? '',
      description: d.description ?? '',
      meals: d.meals ?? [],
      stay: d.stay ?? '',
    })),
    inclusionsText: (tour.inclusions ?? []).join('\n'),
    exclusionsText: (tour.exclusions ?? []).join('\n'),
    temples: tour.temples ?? [],
    faqs: (tour.faqs ?? []).map((f) => ({ question: f.question ?? '', answer: f.answer ?? '' })),
    seo: { title: tour.seo?.title ?? '', description: tour.seo?.description ?? '' },
    notes: tour.notes ?? '',
  };
}

const toInt = (value) => (value === '' || value === null ? undefined : Number(value));

/**
 * @param {ReturnType<typeof emptyTourValues>} values
 * @param {{ mode: 'create' | 'update', originalSlug?: string }} options
 */
export function toPayload(values, { mode, originalSlug } = { mode: 'update' }) {
  const payload = {
    title: values.title.trim(),
    summary: values.summary.trim(),
    description: values.description,
    destinations: commaList(values.destinationsText),
    durationDays: toInt(values.durationDays),
    pickupCities: commaList(values.pickupCitiesText),
    basePrice: toInt(values.basePrice),
    featured: Boolean(values.featured),
  };
  if (values.durationNights !== '') payload.durationNights = toInt(values.durationNights);
  const slug = values.slug.trim();
  if (mode === 'create') {
    if (slug) payload.slug = slug;
    return payload;
  }
  if (slug && slug !== originalSlug) payload.slug = slug;
  return {
    ...payload,
    highlights: lines(values.highlightsText),
    itinerary: values.itinerary.map((d, i) => ({
      day: i + 1,
      title: d.title.trim(),
      description: d.description ?? '',
      meals: d.meals ?? [],
      stay: d.stay.trim(),
    })),
    inclusions: lines(values.inclusionsText),
    exclusions: lines(values.exclusionsText),
    temples: values.temples.map((t) => t.id),
    faqs: values.faqs
      .filter((f) => f.question.trim() || f.answer.trim())
      .map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })),
    seo: { title: values.seo.title.trim(), description: values.seo.description.trim() },
    notes: values.notes,
  };
}

/** Itinerary rows resized to the trip length: new days are blank, extra days are dropped. */
export function resizeItinerary(itinerary, days) {
  const count = Math.max(0, Math.min(30, Number(days) || 0));
  return Array.from({ length: count }, (_, i) => itinerary[i] ?? emptyDay());
}

/** API path ("body.destinations.0", "body.itinerary.2.title") → form field. */
export function tourFieldFor(path) {
  const field = path.replace(/^body\./, '');
  const top = field.split('.')[0];
  const aliases = {
    destinations: 'destinationsText',
    pickupCities: 'pickupCitiesText',
    highlights: 'highlightsText',
    inclusions: 'inclusionsText',
    exclusions: 'exclusionsText',
  };
  if (aliases[top]) return aliases[top];
  return field;
}

/** Which tab holds each field, for per-tab error counts and publish problems. */
export const TOUR_FIELD_TABS = {
  title: 'basics',
  slug: 'basics',
  summary: 'basics',
  destinationsText: 'basics',
  destinations: 'basics',
  durationDays: 'basics',
  durationNights: 'basics',
  basePrice: 'basics',
  pickupCitiesText: 'basics',
  pickupCities: 'basics',
  featured: 'basics',
  description: 'content',
  highlightsText: 'content',
  itinerary: 'itinerary',
  inclusionsText: 'inclusions',
  inclusions: 'inclusions',
  exclusionsText: 'inclusions',
  temples: 'temples',
  images: 'media',
  faqs: 'faqs',
  seo: 'seo',
  notes: 'seo',
};
