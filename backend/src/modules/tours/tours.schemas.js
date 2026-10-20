import { z } from 'zod';
import { CONTENT_STATUSES } from '../../config/content.js';
import {
  DEFAULT_BOOKING_CUTOFF_HOURS,
  DEPARTURE_STATUSES,
  MAX_DEPARTURE_SEATS,
  MAX_TOUR_DAYS,
  MEALS,
} from '../../config/tours.js';
import { isValidYmd } from '../../utils/dates.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';
import { SLUG_PATTERN } from '../../utils/slug.js';

export {
  imageDeleteSchema,
  imageEditsSchema,
  imageUploadFieldsSchema,
} from '../temples/temples.schemas.js';

const text = (max) => z.string().trim().max(max);
const richText = z.string().max(20_000);
const shortList = (maxItems, maxLength) => z.array(text(maxLength).min(1)).max(maxItems);
export const ymd = z.string().refine(isValidYmd, 'Use a date like 2026-05-10');
const price = z.number().int().min(1).max(10_000_000);

const itineraryDay = z
  .object({
    day: z.number().int().min(1).max(MAX_TOUR_DAYS),
    title: text(120).default(''),
    description: richText.default(''),
    meals: z.array(z.enum(MEALS)).max(3).default([]),
    stay: text(120).default(''),
  })
  .strict();

const faq = z.object({ question: text(200).min(3), answer: text(1000).min(3) }).strict();

/** Every writable tour field, all optional. Required ones are enforced on create. */
const tourFields = {
  title: text(120).min(4),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and hyphens'),
  summary: text(300).min(10, 'Write at least a sentence'),
  description: richText,
  highlights: shortList(8, 160),
  temples: z
    .array(objectIdParam)
    .max(60)
    .refine((ids) => new Set(ids).size === ids.length, 'A temple can appear only once'),
  destinations: shortList(20, 60).min(1, 'Add at least one destination'),
  durationDays: z.number().int().min(1).max(MAX_TOUR_DAYS),
  durationNights: z.number().int().min(0).max(MAX_TOUR_DAYS),
  itinerary: z
    .array(itineraryDay)
    .max(MAX_TOUR_DAYS)
    .refine(
      (days) => days.every((d, i) => d.day === i + 1),
      'Itinerary days must be numbered 1, 2, 3… in order',
    ),
  inclusions: shortList(30, 200),
  exclusions: shortList(30, 200),
  pickupCities: shortList(20, 60).min(1, 'Add at least one pickup city'),
  basePrice: price,
  faqs: z.array(faq).max(20),
  featured: z.boolean(),
  seo: z.object({ title: text(60), description: text(160) }).partial(),
  notes: text(4000),
};

const REQUIRED_ON_CREATE = [
  'title',
  'summary',
  'description',
  'destinations',
  'durationDays',
  'pickupCities',
  'basePrice',
];
const optional = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()]));
const requiredFields = Object.fromEntries(REQUIRED_ON_CREATE.map((k) => [k, tourFields[k]]));
const otherFields = Object.fromEntries(
  Object.entries(tourFields).filter(([k]) => !REQUIRED_ON_CREATE.includes(k)),
);

const nightsWithinDays = (body) =>
  body.durationNights === undefined ||
  body.durationDays === undefined ||
  body.durationNights <= body.durationDays;

export const createTourSchema = {
  body: z
    .object({ ...requiredFields, ...optional(otherFields) })
    .strict()
    .refine(nightsWithinDays, { message: 'Nights cannot exceed days', path: ['durationNights'] }),
};

export const updateTourSchema = {
  params: z.object({ id: objectIdParam }),
  body: z
    .object(optional(tourFields))
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
    .refine(nightsWithinDays, { message: 'Nights cannot exceed days', path: ['durationNights'] }),
};

export const tourIdSchema = { params: z.object({ id: objectIdParam }) };

export const ADMIN_SORTS = Object.freeze({
  '-updatedAt': { updatedAt: -1 },
  title: { title: 1 },
  '-publishedAt': { publishedAt: -1 },
});

export const adminListSchema = {
  query: z.object({
    ...paginationQuery,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().max(100).optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
    featured: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    sort: z.enum(Object.keys(ADMIN_SORTS)).default('-updatedAt'),
  }),
};

export const PUBLIC_SORTS = Object.freeze([
  'default',
  'price',
  '-price',
  'durationDays',
  'nextDeparture',
]);

export const publicListSchema = {
  query: z
    .object({
      ...paginationQuery,
      q: z.string().trim().max(100).optional(),
      destination: z.string().trim().max(60).optional(),
      temple: z.string().trim().toLowerCase().max(120).optional(),
      circuit: z.string().trim().toLowerCase().max(120).optional(),
      minPrice: z.coerce.number().int().min(0).optional(),
      maxPrice: z.coerce.number().int().min(0).optional(),
      minDays: z.coerce.number().int().min(1).max(MAX_TOUR_DAYS).optional(),
      maxDays: z.coerce.number().int().min(1).max(MAX_TOUR_DAYS).optional(),
      month: z
        .string()
        .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Use a month like 2026-05')
        .optional(),
      pickupCity: z.string().trim().max(60).optional(),
      featured: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
      bookableOnly: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
      sort: z.enum(PUBLIC_SORTS).default('default'),
    })
    .refine(
      (q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice,
      {
        message: 'minPrice cannot exceed maxPrice',
        path: ['minPrice'],
      },
    )
    .refine((q) => q.minDays === undefined || q.maxDays === undefined || q.minDays <= q.maxDays, {
      message: 'minDays cannot exceed maxDays',
      path: ['minDays'],
    }),
};

export const slugParamSchema = {
  params: z.object({
    slug: z.string().trim().toLowerCase().max(120).regex(SLUG_PATTERN, 'Invalid slug'),
  }),
};

export const publicDeparturesSchema = {
  ...slugParamSchema,
  query: z.object({ from: ymd.optional(), to: ymd.optional() }),
};

/* ---------- departures ---------- */

const departureFields = {
  startDate: ymd,
  endDate: ymd,
  pickupCity: text(60).nullable(),
  price,
  totalSeats: z.number().int().min(1).max(MAX_DEPARTURE_SEATS),
  bookingCutoffHours: z.number().int().min(0).max(720),
  pickupInstructions: text(500),
  notes: text(2000),
};

const endAfterStart = (body) => !body.startDate || !body.endDate || body.endDate >= body.startDate;

export const departureIdSchema = { params: z.object({ id: objectIdParam }) };

export const adminDeparturesListSchema = {
  params: z.object({ id: objectIdParam }),
  query: z.object({
    status: z.enum(DEPARTURE_STATUSES).optional(),
    from: ymd.optional(),
    to: ymd.optional(),
  }),
};

export const createDepartureSchema = {
  params: z.object({ id: objectIdParam }),
  body: z
    .object({
      startDate: departureFields.startDate,
      totalSeats: departureFields.totalSeats,
      endDate: departureFields.endDate.optional(),
      pickupCity: departureFields.pickupCity.optional(),
      price: departureFields.price.optional(),
      bookingCutoffHours: departureFields.bookingCutoffHours.default(DEFAULT_BOOKING_CUTOFF_HOURS),
      pickupInstructions: departureFields.pickupInstructions.optional(),
      notes: departureFields.notes.optional(),
    })
    .strict()
    .refine(endAfterStart, { message: 'End date cannot be before start date', path: ['endDate'] }),
};

/** Repeat a departure every week or month between two dates (Should, FR-TOUR-07). */
export const bulkDeparturesSchema = {
  params: z.object({ id: objectIdParam }),
  body: z
    .object({
      firstDate: ymd,
      lastDate: ymd,
      every: z.enum(['week', 'month']),
      totalSeats: departureFields.totalSeats,
      pickupCity: departureFields.pickupCity.optional(),
      price: departureFields.price.optional(),
      bookingCutoffHours: departureFields.bookingCutoffHours.default(DEFAULT_BOOKING_CUTOFF_HOURS),
      pickupInstructions: departureFields.pickupInstructions.optional(),
    })
    .strict()
    .refine((b) => b.lastDate >= b.firstDate, {
      message: 'Last date cannot be before first date',
      path: ['lastDate'],
    }),
};

export const updateDepartureSchema = {
  ...departureIdSchema,
  body: z
    .object({
      startDate: departureFields.startDate.optional(),
      endDate: departureFields.endDate.optional(),
      pickupCity: departureFields.pickupCity.optional(),
      price: departureFields.price.optional(),
      bookingCutoffHours: departureFields.bookingCutoffHours.optional(),
      pickupInstructions: departureFields.pickupInstructions.optional(),
      notes: departureFields.notes.optional(),
    })
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update')
    .refine(endAfterStart, { message: 'End date cannot be before start date', path: ['endDate'] }),
};

export const inventorySchema = {
  ...departureIdSchema,
  body: z
    .object({
      totalSeats: departureFields.totalSeats,
      reason: text(300).min(3, 'Say why the seats change'),
    })
    .strict(),
};

export const cancelDepartureSchema = {
  ...departureIdSchema,
  body: z.object({ reason: text(500).min(3, 'Give a reason') }).strict(),
};
