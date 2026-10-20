import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { DASHBOARD_RANGES, dashboardData } from './dashboard.service.js';

export const DASHBOARD_CACHE_MS = 60_000;

/**
 * GET /admin/dashboard. Results are cached per range for 60 seconds (per server process), so
 * a busy admin screen does not rerun every aggregation; `meta.cachedAt` says how fresh it is.
 */
export function adminDashboardRouter({ env }) {
  const router = Router();
  const cache = new Map();
  router.use(requireAuth(env), requireRole('admin'));

  router.get(
    '/',
    validate({ query: z.object({ range: z.enum(DASHBOARD_RANGES).default('7d') }) }),
    async (req, res) => {
      const { range } = req.valid.query;
      let entry = cache.get(range);
      if (!entry || Date.now() - entry.at >= DASHBOARD_CACHE_MS) {
        entry = { at: Date.now(), data: await dashboardData(range) };
        cache.set(range, entry);
      }
      res
        .set('Cache-Control', 'no-store')
        .json({ success: true, data: entry.data, meta: { cachedAt: new Date(entry.at) } });
    },
  );
  return router;
}
