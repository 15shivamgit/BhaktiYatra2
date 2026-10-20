import { z } from 'zod';
import { CONTENT_STATUSES, INDIAN_STATES, RELIGIONS } from '../../config/content.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';
import { SLUG_PATTERN } from '../../utils/slug.js';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const time = z.string().regex(TIME, 'Use 24-hour time, for example 05:30');
const text = (max) => z.string().trim().max(max);
const richText = z.string().max(20_000);
/** Optional URL; an empty string clears the field. */
const optionalUrl = z.union([z.literal(''), z.url().max(500)]);

export const latLngSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const timing = z.object({
  label: text(60).min(1),
  open: time.optional(),
  close: time.optional(),
  note: text(200).optional(),
});
const aarti = z.object({
  name: text(80).min(1),
  time: time.optional(),
  note: text(200).optional(),
});
const festival = z.object({
  name: text(80).min(1),
  month: z.number().int().min(1).max(12).nullable().optional(),
  description: text(500).optional(),
});
const howToReach = z
  .object({
    nearestAirport: text(300),
    nearestRailway: text(300),
    nearestBusStand: text(300),
    byRoad: text(300),
  })
  .partial();

/** Every writable temple field, all optional. Required ones are enforced on create. */
const templeFields = {
  name: text(120).min(2),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and hyphens'),
  deity: text(60).min(2),
  religion: z.enum(RELIGIONS),
  state: z.enum(INDIAN_STATES, { error: 'Choose a state or union territory' }),
  city: text(80).min(2),
  district: text(80),
  address: text(300),
  pincode: z.union([z.literal(''), z.string().regex(/^\d{6}$/, 'Pincode has 6 digits')]),
  location: latLngSchema.nullable(),
  shortDescription: text(300).min(10, 'Write at least a sentence'),
  description: richText,
  history: richText,
  significance: richText,
  timings: z.array(timing).max(12),
  aartiSchedule: z.array(aarti).max(12),
  festivals: z.array(festival).max(20),
  bestTimeToVisit: text(300),
  howToReach,
  rules: z.array(text(200).min(1)).max(20),
  entryFee: text(200),
  officialWebsite: optionalUrl,
  darshanBookingUrl: optionalUrl,
  contactPhone: text(40),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(40)).max(20),
  featured: z.boolean(),
  seo: z.object({ title: text(60), description: text(160) }).partial(),
  notes: text(4000),
};

const { name, deity, state, city, shortDescription, description, ...optionalFields } = templeFields;

export const createTempleSchema = {
  body: z
    .object({
      name,
      deity,
      state,
      city,
      shortDescription,
      description,
      ...Object.fromEntries(Object.entries(optionalFields).map(([k, v]) => [k, v.optional()])),
    })
    .strict(),
};

export const updateTempleSchema = {
  params: z.object({ id: objectIdParam }),
  body: z
    .object(Object.fromEntries(Object.entries(templeFields).map(([k, v]) => [k, v.optional()])))
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update'),
};

export const templeIdSchema = { params: z.object({ id: objectIdParam }) };

export const ADMIN_SORTS = Object.freeze({
  '-updatedAt': { updatedAt: -1 },
  name: { name: 1 },
  '-publishedAt': { publishedAt: -1 },
});

export const adminListSchema = {
  query: z.object({
    ...paginationQuery,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().max(100).optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
    state: z.string().trim().max(80).optional(),
    deity: z.string().trim().max(60).optional(),
    sort: z.enum(Object.keys(ADMIN_SORTS)).default('-updatedAt'),
  }),
};

/** "lat,lng" → { lat, lng } */
const latLngQuery = z
  .string()
  .regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, 'Use "lat,lng"')
  .transform((value) => {
    const [lat, lng] = value.split(',').map(Number);
    return { lat, lng };
  })
  .pipe(latLngSchema);

/** "minLng,minLat,maxLng,maxLat" → corners */
const bboxQuery = z
  .string()
  .regex(/^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/, 'Use "minLng,minLat,maxLng,maxLat"')
  .transform((value) => value.split(',').map(Number))
  .refine(([minLng, minLat, maxLng, maxLat]) => minLng < maxLng && minLat < maxLat, 'Invalid box');

export const publicListSchema = {
  query: z
    .object({
      ...paginationQuery,
      q: z.string().trim().max(100).optional(),
      state: z.string().trim().max(80).optional(),
      deity: z.string().trim().max(60).optional(),
      circuit: z.string().trim().max(100).optional(),
      religion: z.enum(RELIGIONS).optional(),
      featured: z
        .enum(['true', 'false'])
        .transform((v) => v === 'true')
        .optional(),
      near: latLngQuery.optional(),
      radiusKm: z.coerce.number().min(1).max(300).default(50),
      bbox: bboxQuery.optional(),
      sort: z.enum(['relevance', 'default', 'name', '-viewCount']).default('default'),
    })
    .refine((q) => !(q.near && q.bbox), 'Use either near or bbox, not both'),
};

export const slugParamSchema = {
  params: z.object({
    slug: z.string().trim().toLowerCase().max(120).regex(SLUG_PATTERN, 'Invalid slug'),
  }),
};

export const nearbySchema = {
  ...slugParamSchema,
  query: z.object({
    limit: z.coerce.number().int().min(1).max(12).default(6),
    radiusKm: z.coerce.number().min(1).max(300).default(100),
  }),
};

export const imageEditsSchema = {
  params: z.object({ id: objectIdParam }),
  body: z
    .object({
      images: z
        .array(
          z
            .object({
              publicId: z.string().min(1).max(300),
              alt: text(200).optional(),
              order: z.number().int().min(0).max(100).optional(),
              isPrimary: z.boolean().optional(),
            })
            .strict(),
        )
        .min(1)
        .max(50),
    })
    .strict(),
};

export const imageUploadFieldsSchema = {
  params: z.object({ id: objectIdParam }),
  // multipart text field "alts": JSON array of alt texts in file order
  body: z
    .object({
      alts: z
        .string()
        .max(5000)
        .optional()
        .transform((value, ctx) => {
          if (!value) return [];
          try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed) && parsed.every((a) => typeof a === 'string')) return parsed;
          } catch {
            // handled below
          }
          ctx.addIssue({ code: 'custom', message: 'alts must be a JSON array of strings' });
          return z.NEVER;
        }),
    })
    .strict(),
};

export const imageDeleteSchema = {
  params: z.object({ id: objectIdParam }),
  query: z.object({ publicId: z.string().min(1).max(300) }),
};
