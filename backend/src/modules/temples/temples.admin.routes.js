import { Router } from 'express';
import {
  INDIAN_STATES,
  DEITY_SUGGESTIONS,
  RELIGIONS,
  MAX_TEMPLE_IMAGES,
} from '../../config/content.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { imageUpload } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import { toTempleAdmin, toTempleAdminListItem } from './temples.mapper.js';
import * as schemas from './temples.schemas.js';
import * as service from './temples.admin.service.js';

/** Admin temple management (docs/04-api/03-temples-circuits.md "Admin"). */
export function adminTemplesRouter(ctx) {
  const router = Router();
  router.use(requireAuth(ctx.env), requireRole('admin'), (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  const one = (temple, extra = {}) => ({ success: true, data: toTempleAdmin(temple), ...extra });

  router.get('/options', (_req, res) => {
    res.json({
      success: true,
      data: {
        states: INDIAN_STATES,
        deities: DEITY_SUGGESTIONS,
        religions: RELIGIONS,
        maxImages: MAX_TEMPLE_IMAGES,
      },
    });
  });

  router.get('/', validate(schemas.adminListSchema), async (req, res) => {
    const { temples, meta } = await service.listTemplesAdmin(req.valid.query);
    res.json({ success: true, data: temples.map(toTempleAdminListItem), meta });
  });

  router.post('/', validate(schemas.createTempleSchema), async (req, res) => {
    const temple = await service.createTemple(ctx, req.valid.body, req.user, req);
    res.status(201).json(one(temple));
  });

  router.get('/:id', validate(schemas.templeIdSchema), async (req, res) => {
    const temple = await service.getTempleAdmin(req.valid.params.id);
    res.json({ ...one(temple), meta: { publishProblems: service.publishProblems(temple) } });
  });

  router.patch('/:id', validate(schemas.updateTempleSchema), async (req, res) => {
    const temple = await service.updateTemple(
      ctx,
      req.valid.params.id,
      req.valid.body,
      req.user,
      req,
    );
    res.json({ ...one(temple), meta: { publishProblems: service.publishProblems(temple) } });
  });

  for (const [action, fn] of Object.entries({
    publish: service.publishTemple,
    unpublish: service.unpublishTemple,
    archive: service.archiveTemple,
  })) {
    router.post(`/:id/${action}`, validate(schemas.templeIdSchema), async (req, res) => {
      res.json(one(await fn(ctx, req.valid.params.id, req.user, req)));
    });
  }

  router.delete('/:id', validate(schemas.templeIdSchema), async (req, res) => {
    await service.deleteTemple(ctx, req.valid.params.id, req.user, req);
    res.status(204).end();
  });

  router.post(
    '/:id/images',
    ...imageUpload({ field: 'files', maxFiles: MAX_TEMPLE_IMAGES }),
    validate(schemas.imageUploadFieldsSchema),
    async (req, res) => {
      const { temple, failed } = await service.addTempleImages(
        ctx,
        req.valid.params.id,
        req.uploadedFiles,
        req.valid.body.alts,
        req.user,
        req,
      );
      res.status(201).json({ success: true, data: toTempleAdmin(temple).images, meta: { failed } });
    },
  );

  router.patch('/:id/images', validate(schemas.imageEditsSchema), async (req, res) => {
    const temple = await service.editTempleImages(
      ctx,
      req.valid.params.id,
      req.valid.body.images,
      req.user,
      req,
    );
    res.json({ success: true, data: toTempleAdmin(temple).images });
  });

  router.delete('/:id/images', validate(schemas.imageDeleteSchema), async (req, res) => {
    await service.removeTempleImage(
      ctx,
      req.valid.params.id,
      req.valid.query.publicId,
      req.user,
      req,
    );
    res.status(204).end();
  });

  return router;
}
