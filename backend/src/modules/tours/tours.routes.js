import { Router } from 'express';
import { API_PREFIX } from '../../config/constants.js';
import { validate } from '../../middleware/validate.js';
import {
  departureIdSchema,
  publicDeparturesSchema,
  publicListSchema,
  slugParamSchema,
} from './tours.schemas.js';
import * as service from './tours.public.service.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

/** Public tour endpoints (docs/04-api/04-tours-departures.md). */
export function toursRouter() {
  const router = Router();

  router.get('/', validate(publicListSchema), async (req, res) => {
    const { tours, meta } = await service.listTours(req.valid.query);
    res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: tours, meta });
  });

  router.get('/filters', async (_req, res) => {
    res
      .set('Cache-Control', PUBLIC_CACHE)
      .json({ success: true, data: await service.tourFilters() });
  });

  router.get('/:slug', validate(slugParamSchema), async (req, res) => {
    const result = await service.getTourBySlug(req.valid.params.slug);
    if (result.redirectTo) {
      res
        .status(301)
        .location(`${API_PREFIX}/tours/${result.redirectTo}`)
        .json({ success: true, data: { redirect: { slug: result.redirectTo } } });
      return;
    }
    res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: result.tour });
  });

  router.get('/:slug/departures', validate(publicDeparturesSchema), async (req, res) => {
    const data = await service.listDeparturesBySlug(req.valid.params.slug, req.valid.query);
    res.set('Cache-Control', 'no-store').json({ success: true, data });
  });

  return router;
}

/** GET /departures/:id: live seat availability, never cached. */
export function departuresRouter() {
  const router = Router();
  router.get('/:id', validate(departureIdSchema), async (req, res) => {
    const data = await service.getDeparturePublic(req.valid.params.id);
    res.set('Cache-Control', 'no-store').json({ success: true, data });
  });
  return router;
}
