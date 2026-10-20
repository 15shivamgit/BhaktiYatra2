import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { createRateLimiter } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { CONTACT_STATUSES } from '../../models/Contact.js';
import { normalizePhone } from '../../utils/phone.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';
import { listContacts, submitContact, updateContactStatus } from './contacts.service.js';

const createSchema = {
  body: z
    .object({
      name: z.string().trim().min(2, 'Enter your name').max(80),
      email: z.email('Enter a valid email address').trim().toLowerCase().max(254),
      phone: z
        .string()
        .trim()
        .max(20)
        .optional()
        .transform((value, ctx) => {
          if (!value) return undefined;
          const normalised = normalizePhone(value);
          if (!normalised) {
            ctx.addIssue({ code: 'custom', message: 'Enter a valid phone number' });
            return z.NEVER;
          }
          return normalised;
        }),
      subject: z.string().trim().max(120).optional(),
      message: z.string().trim().min(10, 'Write at least 10 characters').max(2000),
      // Honeypot: real visitors never see or fill this field.
      website: z.string().max(200).optional(),
    })
    .strict(),
};

/** Public contact form (FR-SITE-01). */
export function contactRouter(ctx) {
  const router = Router();
  const limit = createRateLimiter({
    enabled: ctx.env.RATE_LIMIT_ENABLED,
    windowMs: ctx.env.RATE_LIMIT_CONTACT_WINDOW_MIN * 60_000,
    limit: ctx.env.RATE_LIMIT_CONTACT_MAX,
  });
  router.post('/', limit, validate(createSchema), async (req, res) => {
    const contact = await submitContact(ctx, req.valid.body, req);
    res.status(201).json({
      success: true,
      data: { id: contact._id.toString() },
      message: 'Thank you. We will get back to you soon.',
    });
  });
  return router;
}

export function adminContactsRouter(ctx) {
  const router = Router();
  router.use(requireAuth(ctx.env), requireRole('admin'), (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get(
    '/',
    validate({
      query: z.object({
        ...paginationQuery,
        limit: z.coerce.number().int().min(1).max(100).default(20),
        status: z.enum(CONTACT_STATUSES).optional(),
        q: z.string().trim().max(100).optional(),
      }),
    }),
    async (req, res) => {
      const { contacts, meta } = await listContacts(req.valid.query);
      res.json({ success: true, data: contacts, meta });
    },
  );

  router.patch(
    '/:id',
    validate({
      params: z.object({ id: objectIdParam }),
      body: z.object({ status: z.enum(['read', 'replied', 'spam', 'new']) }).strict(),
    }),
    async (req, res) => {
      const contact = await updateContactStatus(
        req.valid.params.id,
        req.valid.body.status,
        req.user,
        req,
      );
      res.json({ success: true, data: contact });
    },
  );

  return router;
}
