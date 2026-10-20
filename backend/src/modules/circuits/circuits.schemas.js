import { z } from 'zod';
import { CONTENT_STATUSES } from '../../config/content.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';
import { SLUG_PATTERN } from '../../utils/slug.js';

const text = (max) => z.string().trim().max(max);

const circuitFields = {
  name: text(120).min(2),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .max(100)
    .regex(SLUG_PATTERN, 'Use lowercase letters, numbers and hyphens'),
  shortDescription: text(300).min(10, 'Write at least a sentence'),
  description: z.string().max(20_000),
  temples: z
    .array(objectIdParam)
    .max(60)
    .refine((ids) => new Set(ids).size === ids.length, 'A temple can appear only once'),
  region: text(80),
  featured: z.boolean(),
  seo: z.object({ title: text(60), description: text(160) }).partial(),
  notes: text(4000),
};

const optional = (fields) =>
  Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.optional()]));
const { name, shortDescription, ...rest } = circuitFields;

export const createCircuitSchema = {
  body: z.object({ name, shortDescription, ...optional(rest) }).strict(),
};

export const updateCircuitSchema = {
  params: z.object({ id: objectIdParam }),
  body: z
    .object(optional(circuitFields))
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'Provide at least one field to update'),
};

export const circuitIdSchema = { params: z.object({ id: objectIdParam }) };

export const adminListSchema = {
  query: z.object({
    ...paginationQuery,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().max(100).optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
  }),
};

export const publicListSchema = {
  query: z.object({
    ...paginationQuery,
    featured: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
  }),
};

export const slugParamSchema = {
  params: z.object({
    slug: z.string().trim().toLowerCase().max(120).regex(SLUG_PATTERN, 'Invalid slug'),
  }),
};

export const imageAltSchema = {
  params: z.object({ id: objectIdParam }),
  body: z.object({ alt: text(200).optional() }).strict(),
};
