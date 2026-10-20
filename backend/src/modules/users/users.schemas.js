import { z } from 'zod';
import { ROLES } from '../../config/constants.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';

export const SORTS = Object.freeze({
  '-createdAt': { createdAt: -1 },
  createdAt: { createdAt: 1 },
  name: { name: 1 },
  '-lastLoginAt': { lastLoginAt: -1 },
});

export const listUsersSchema = {
  query: z.object({
    ...paginationQuery,
    q: z.string().trim().max(100).optional(),
    role: z.enum(ROLES).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    sort: z.enum(Object.keys(SORTS)).default('-createdAt'),
  }),
};

export const userIdSchema = { params: z.object({ id: objectIdParam }) };

export const updateUserSchema = {
  params: z.object({ id: objectIdParam }),
  body: z
    .object({ role: z.enum(ROLES).optional(), isActive: z.boolean().optional() })
    .strict()
    .refine((body) => Object.keys(body).length > 0, 'Provide role or isActive'),
};
