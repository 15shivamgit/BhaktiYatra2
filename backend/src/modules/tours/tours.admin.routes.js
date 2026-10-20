import { Router } from 'express';
import { MAX_BULK_DEPARTURES, MAX_TOUR_DAYS, MAX_TOUR_IMAGES, MEALS } from '../../config/tours.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { imageUpload } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import * as departures from './departures.service.js';
import { toTourAdmin, toTourAdminListItem } from './tours.mapper.js';
import * as schemas from './tours.schemas.js';
import * as service from './tours.admin.service.js';

function adminOnly(ctx) {
  return [
    requireAuth(ctx.env),
    requireRole('admin'),
    (_req, res, next) => {
      res.set('Cache-Control', 'no-store');
      next();
    },
  ];
}

/** Admin tour management, including a tour's departures (docs/04-api/04-tours-departures.md). */
export function adminToursRouter(ctx) {
  const router = Router();
  router.use(...adminOnly(ctx));

  const one = (tour, meta = {}) => ({
    success: true,
    data: toTourAdmin(tour),
    meta: { publishProblems: service.publishProblems(tour), ...meta },
  });

  router.get('/options', (_req, res) => {
    res.json({
      success: true,
      data: { meals: MEALS, maxDays: MAX_TOUR_DAYS, maxImages: MAX_TOUR_IMAGES },
    });
  });

  router.get('/', validate(schemas.adminListSchema), async (req, res) => {
    const { tours, counts, meta } = await service.listToursAdmin(req.valid.query);
    res.json({
      success: true,
      data: tours.map((t) => toTourAdminListItem(t, counts.get(t._id.toString()))),
      meta,
    });
  });

  router.post('/', validate(schemas.createTourSchema), async (req, res) => {
    const tour = await service.createTour(ctx, req.valid.body, req.user, req);
    res.status(201).json(one(tour));
  });

  router.get('/:id', validate(schemas.tourIdSchema), async (req, res) => {
    res.json(one(await service.getTourAdmin(req.valid.params.id, { populate: true })));
  });

  router.patch('/:id', validate(schemas.updateTourSchema), async (req, res) => {
    const { tour, warnings } = await service.updateTour(
      ctx,
      req.valid.params.id,
      req.valid.body,
      req.user,
      req,
    );
    await tour.populate('temples', 'name slug city status');
    res.json(one(tour, { warnings }));
  });

  for (const [action, fn] of Object.entries({
    publish: service.publishTour,
    unpublish: service.unpublishTour,
    archive: service.archiveTour,
  })) {
    router.post(`/:id/${action}`, validate(schemas.tourIdSchema), async (req, res) => {
      const tour = await fn(ctx, req.valid.params.id, req.user, req);
      await tour.populate('temples', 'name slug city status');
      res.json(one(tour));
    });
  }

  router.delete('/:id', validate(schemas.tourIdSchema), async (req, res) => {
    await service.deleteTour(ctx, req.valid.params.id, req.user, req);
    res.status(204).end();
  });

  /* images */

  router.post(
    '/:id/images',
    ...imageUpload({ field: 'files', maxFiles: MAX_TOUR_IMAGES }),
    validate(schemas.imageUploadFieldsSchema),
    async (req, res) => {
      const { tour, failed } = await service.addTourImages(
        ctx,
        req.valid.params.id,
        req.uploadedFiles,
        req.valid.body.alts,
        req.user,
        req,
      );
      res.status(201).json({ success: true, data: toTourAdmin(tour).images, meta: { failed } });
    },
  );

  router.patch('/:id/images', validate(schemas.imageEditsSchema), async (req, res) => {
    const tour = await service.editTourImages(
      ctx,
      req.valid.params.id,
      req.valid.body.images,
      req.user,
      req,
    );
    res.json({ success: true, data: toTourAdmin(tour).images });
  });

  router.delete('/:id/images', validate(schemas.imageDeleteSchema), async (req, res) => {
    await service.removeTourImage(
      ctx,
      req.valid.params.id,
      req.valid.query.publicId,
      req.user,
      req,
    );
    res.status(204).end();
  });

  /* departures of a tour */

  router.get('/:id/departures', validate(schemas.adminDeparturesListSchema), async (req, res) => {
    const data = await departures.listDeparturesAdmin(req.valid.params.id, req.valid.query);
    res.json({ success: true, data });
  });

  router.post('/:id/departures', validate(schemas.createDepartureSchema), async (req, res) => {
    const data = await departures.createDeparture(
      ctx,
      req.valid.params.id,
      req.valid.body,
      req.user,
      req,
    );
    res.status(201).json({ success: true, data });
  });

  router.post('/:id/departures/bulk', validate(schemas.bulkDeparturesSchema), async (req, res) => {
    const data = await departures.createDeparturesBulk(
      ctx,
      req.valid.params.id,
      req.valid.body,
      req.user,
      req,
      MAX_BULK_DEPARTURES,
    );
    res.status(201).json({ success: true, data, meta: { created: data.length } });
  });

  return router;
}

/** Admin actions on a single departure. */
export function adminDeparturesRouter(ctx) {
  const router = Router();
  router.use(...adminOnly(ctx));

  router.get('/:id', validate(schemas.departureIdSchema), async (req, res) => {
    res.json({ success: true, data: await departures.getDepartureAdmin(req.valid.params.id) });
  });

  router.patch('/:id', validate(schemas.updateDepartureSchema), async (req, res) => {
    const data = await departures.updateDeparture(
      ctx,
      req.valid.params.id,
      req.valid.body,
      req.user,
      req,
    );
    res.json({ success: true, data });
  });

  router.patch('/:id/inventory', validate(schemas.inventorySchema), async (req, res) => {
    const data = await departures.adjustInventory(
      ctx,
      req.valid.params.id,
      req.valid.body,
      req.user,
      req,
    );
    res.json({ success: true, data });
  });

  router.post('/:id/cancel', validate(schemas.cancelDepartureSchema), async (req, res) => {
    const data = await departures.cancelDeparture(
      ctx,
      req.valid.params.id,
      req.valid.body,
      req.user,
      req,
    );
    res.json({ success: true, data });
  });

  router.delete('/:id', validate(schemas.departureIdSchema), async (req, res) => {
    await departures.deleteDeparture(ctx, req.valid.params.id, req.user, req);
    res.status(204).end();
  });

  return router;
}
