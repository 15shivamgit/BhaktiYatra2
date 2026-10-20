import { Router } from 'express';
import { z } from 'zod';
import { PAYMENT_RECORD_STATUSES } from '../../config/bookings.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { paginationQuery } from '../../utils/pagination.js';
import { ymd } from '../tours/tours.schemas.js';
import { listPaymentsAdmin } from './payments.admin.service.js';

const listSchema = {
  query: z.object({
    ...paginationQuery,
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(PAYMENT_RECORD_STATUSES).optional(),
    from: ymd.optional(),
    to: ymd.optional(),
    q: z.string().trim().max(100).optional(),
  }),
};

/** GET /admin/payments (docs/04-api/05-bookings-payments.md). */
export function adminPaymentsRouter({ env }) {
  const router = Router();
  router.use(requireAuth(env), requireRole('admin'));
  router.get('/', validate(listSchema), async (req, res) => {
    const { payments, meta } = await listPaymentsAdmin(req.valid.query);
    res.set('Cache-Control', 'no-store').json({ success: true, data: payments, meta });
  });
  return router;
}
