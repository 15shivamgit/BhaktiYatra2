/**
 * Convert between the admin API temple shape and flat form values (all strings, so inputs stay
 * controlled), and back to a PATCH payload the API accepts (temples.schemas.js).
 */

const lines = (text) =>
  String(text ?? '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

const commaList = (text) =>
  String(text ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

const orUndefined = (value) => (value === '' || value === null ? undefined : value);

export function emptyTempleValues() {
  return {
    name: '',
    slug: '',
    deity: '',
    religion: 'hindu',
    state: '',
    city: '',
    district: '',
    address: '',
    pincode: '',
    featured: false,
    shortDescription: '',
    description: '',
    history: '',
    significance: '',
    bestTimeToVisit: '',
    entryFee: 'Free',
    officialWebsite: '',
    darshanBookingUrl: '',
    contactPhone: '',
    timings: [],
    aartiSchedule: [],
    festivals: [],
    howToReach: { nearestAirport: '', nearestRailway: '', nearestBusStand: '', byRoad: '' },
    rulesText: '',
    tagsText: '',
    lat: '',
    lng: '',
    seo: { title: '', description: '' },
    notes: '',
  };
}

/** @param {any} temple admin API shape */
export function toFormValues(temple) {
  const base = emptyTempleValues();
  return {
    ...base,
    name: temple.name ?? '',
    slug: temple.slug ?? '',
    deity: temple.deity ?? '',
    religion: temple.religion ?? 'hindu',
    state: temple.state ?? '',
    city: temple.city ?? '',
    district: temple.district ?? '',
    address: temple.address ?? '',
    pincode: temple.pincode ?? '',
    featured: Boolean(temple.featured),
    shortDescription: temple.shortDescription ?? '',
    description: temple.description ?? '',
    history: temple.history ?? '',
    significance: temple.significance ?? '',
    bestTimeToVisit: temple.bestTimeToVisit ?? '',
    entryFee: temple.entryFee ?? '',
    officialWebsite: temple.officialWebsite ?? '',
    darshanBookingUrl: temple.darshanBookingUrl ?? '',
    contactPhone: temple.contactPhone ?? '',
    timings: (temple.timings ?? []).map((r) => ({
      label: r.label ?? '',
      open: r.open ?? '',
      close: r.close ?? '',
      note: r.note ?? '',
    })),
    aartiSchedule: (temple.aartiSchedule ?? []).map((r) => ({
      name: r.name ?? '',
      time: r.time ?? '',
      note: r.note ?? '',
    })),
    festivals: (temple.festivals ?? []).map((r) => ({
      name: r.name ?? '',
      month: r.month ? String(r.month) : '',
      description: r.description ?? '',
    })),
    howToReach: { ...base.howToReach, ...(temple.howToReach ?? {}) },
    rulesText: (temple.rules ?? []).join('\n'),
    tagsText: (temple.tags ?? []).join(', '),
    lat: temple.location ? String(temple.location.lat) : '',
    lng: temple.location ? String(temple.location.lng) : '',
    seo: { title: temple.seo?.title ?? '', description: temple.seo?.description ?? '' },
    notes: temple.notes ?? '',
  };
}

function location(values) {
  if (values.lat === '' && values.lng === '') return null;
  const lat = Number(values.lat);
  const lng = Number(values.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : { lat: NaN, lng: NaN };
}

/**
 * Body for POST (create) or PATCH (update). Empty optional strings are omitted on create; on
 * update they are sent so a field can be cleared.
 * @param {ReturnType<typeof emptyTempleValues>} values
 * @param {{ mode: 'create' | 'update', originalSlug?: string }} options
 */
export function toPayload(values, { mode, originalSlug } = { mode: 'update' }) {
  const payload = {
    name: values.name.trim(),
    deity: values.deity.trim(),
    religion: values.religion,
    state: values.state,
    city: values.city.trim(),
    shortDescription: values.shortDescription.trim(),
    description: values.description,
    featured: Boolean(values.featured),
  };
  if (mode === 'create') {
    if (values.slug.trim()) payload.slug = values.slug.trim();
    return payload;
  }

  if (values.slug.trim() && values.slug.trim() !== originalSlug) payload.slug = values.slug.trim();
  Object.assign(payload, {
    district: values.district.trim(),
    address: values.address.trim(),
    pincode: values.pincode.trim(),
    history: values.history,
    significance: values.significance,
    bestTimeToVisit: values.bestTimeToVisit.trim(),
    entryFee: values.entryFee.trim(),
    officialWebsite: values.officialWebsite.trim(),
    darshanBookingUrl: values.darshanBookingUrl.trim(),
    contactPhone: values.contactPhone.trim(),
    location: location(values),
    timings: values.timings
      .filter((r) => r.label.trim())
      .map((r) => ({
        label: r.label.trim(),
        open: orUndefined(r.open),
        close: orUndefined(r.close),
        note: orUndefined(r.note.trim()),
      })),
    aartiSchedule: values.aartiSchedule
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        time: orUndefined(r.time),
        note: orUndefined(r.note.trim()),
      })),
    festivals: values.festivals
      .filter((r) => r.name.trim())
      .map((r) => ({
        name: r.name.trim(),
        month: r.month ? Number(r.month) : null,
        description: orUndefined(r.description.trim()),
      })),
    howToReach: Object.fromEntries(
      Object.entries(values.howToReach).map(([k, v]) => [k, v.trim()]),
    ),
    rules: lines(values.rulesText),
    tags: commaList(values.tagsText),
    seo: { title: values.seo.title.trim(), description: values.seo.description.trim() },
    notes: values.notes,
  });
  return payload;
}

/** Which tab holds each top-level field, for per-tab error counts. */
export const FIELD_TABS = {
  name: 'basics',
  slug: 'basics',
  deity: 'basics',
  religion: 'basics',
  state: 'basics',
  city: 'basics',
  district: 'basics',
  address: 'basics',
  pincode: 'basics',
  featured: 'basics',
  shortDescription: 'content',
  description: 'content',
  history: 'content',
  significance: 'content',
  timings: 'timings',
  aartiSchedule: 'timings',
  festivals: 'timings',
  howToReach: 'reach',
  rules: 'reach',
  rulesText: 'reach',
  entryFee: 'reach',
  bestTimeToVisit: 'reach',
  officialWebsite: 'reach',
  darshanBookingUrl: 'reach',
  contactPhone: 'reach',
  location: 'location',
  lat: 'location',
  lng: 'location',
  images: 'media',
  seo: 'seo',
  tags: 'seo',
  tagsText: 'seo',
  notes: 'seo',
};
