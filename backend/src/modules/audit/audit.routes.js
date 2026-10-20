import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { AuditLog } from '../../models/AuditLog.js';
import { AppError } from '../../utils/app-error.js';
import { objectIdParam, paginationQuery } from '../../utils/pagination.js';
import { ymd } from '../tours/tours.schemas.js';
import { toAuditEntry } from './audit.mapper.js';
import { listAuditLogs } from './audit.service.js';

const listSchema = {
  query: z.object({
    ...paginationQuery,
    limit: z.coerce.number().int().min(1).max(100).default(25),
    actor: objectIdParam.optional(),
    action: z
      .string()
      .trim()
      .max(60)
      .regex(/^[a-z_.]*$/, 'Use an action such as booking. or user.role.change')
      .optional(),
    entityType: z.string().trim().max(40).optional(),
    entityId: objectIdParam.optional(),
    from: ymd.optional(),
    to: ymd.optional(),
  }),
};

/** GET /admin/audit-logs and /admin/audit-logs/:id (docs/04-api/06-admin.md). */
export function adminAuditRouter({ env }) {
  const router = Router();
  router.use(requireAuth(env), requireRole('admin'), (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  router.get('/', validate(listSchema), async (req, res) => {
    const { entries, meta } = await listAuditLogs(req.valid.query);
    res.json({ success: true, data: entries, meta });
  });

  router.get('/:id', validate({ params: z.object({ id: objectIdParam }) }), async (req, res) => {
    const entry = await AuditLog.findById(req.valid.params.id).populate('actor', 'name email');
    if (!entry) throw AppError.notFound('Audit entry not found');
    res.json({ success: true, data: toAuditEntry(entry) });
  });

  return router;
}
