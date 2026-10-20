import { Router } from 'express';
import { API_PREFIX } from '../../config/constants.js';
import { createRateLimiter } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { nearbySchema, publicListSchema, slugParamSchema } from './temples.schemas.js';
import * as service from './temples.public.service.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

/** Public temple endpoints (docs/04-api/03-temples-circuits.md). */
export function templesRouter({ env }) {
  const router = Router();
  const viewLimit = createRateLimiter({
    enabled: env.RATE_LIMIT_ENABLED,
    windowMs: 60_000,
    limit: 30,
  });

  router.get('/', validate(publicListSchema), async (req, res) => {
    const { temples, meta } = await service.listTemples(req.valid.query);
    res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: temples, meta });
  });

  router.get('/filters', async (_req, res) => {
    res
      .set('Cache-Control', PUBLIC_CACHE)
      .json({ success: true, data: await service.templeFilters() });
  });

  router.get('/:slug', validate(slugParamSchema), async (req, res) => {
    const result = await service.getTempleBySlug(req.valid.params.slug);
    if (result.redirectTo) {
      res
        .status(301)
        .location(`${API_PREFIX}/temples/${result.redirectTo}`)
        .json({ success: true, data: { redirect: { slug: result.redirectTo } } });
      return;
    }
    res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: result.temple });
  });

  router.get('/:slug/nearby', validate(nearbySchema), async (req, res) => {
    const data = await service.getNearbyBySlug(req.valid.params.slug, req.valid.query);
    res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data });
  });

  router.post('/:slug/views', viewLimit, validate(slugParamSchema), async (req, res) => {
    await service.recordView(req.valid.params.slug);
    res.status(204).end();
  });

  return router;
}
