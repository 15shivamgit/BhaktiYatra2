import { z } from 'zod';

/** Shared query fields for paginated lists (docs/04-api/01-conventions.md). */
export const paginationQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
};

export const objectIdParam = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

/** @param {{ page: number, limit: number }} query */
export function skipFor({ page, limit }) {
  return (page - 1) * limit;
}

/** @param {{ page: number, limit: number }} query @param {number} total */
export function pageMeta({ page, limit }, total) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
