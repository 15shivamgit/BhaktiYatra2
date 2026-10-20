import { Router } from 'express';
import { API_PREFIX } from '../../config/constants.js';
import { requireAuth, requireRole } from '../../middleware/auth.js';
import { imageUpload } from '../../middleware/upload.js';
import { validate } from '../../middleware/validate.js';
import * as schemas from './circuits.schemas.js';
import * as service from './circuits.service.js';

const PUBLIC_CACHE = 'public, max-age=60, stale-while-revalidate=300';

export function circuitsRouter() {
  const router = Router();

  router.get('/', validate(schemas.publicListSchema), async (req, res) => {
    const { circuits, meta } = await service.listCircuits(req.valid.query);
    res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: circuits, meta });
  });

  router.get('/:slug', validate(schemas.slugParamSchema), async (req, res) => {
    const result = await service.getCircuitBySlug(req.valid.params.slug);
    if (result.redirectTo) {
      res
        .status(301)
        .location(`${API_PREFIX}/circuits/${result.redirectTo}`)
        .json({ success: true, data: { redirect: { slug: result.redirectTo } } });
      return;
    }
    res.set('Cache-Control', PUBLIC_CACHE).json({ success: true, data: result.circuit });
  });

  return router;
}

export function adminCircuitsRouter(ctx) {
  const router = Router();
  router.use(requireAuth(ctx.env), requireRole('admin'), (_req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });
  const one = async (circuit) => ({
    success: true,
    data: service.toCircuitAdmin(circuit),
    meta: { publishProblems: await service.circuitPublishProblems(circuit) },
  });

  router.get('/', validate(schemas.adminListSchema), async (req, res) => {
    const { circuits, meta } = await service.listCircuitsAdmin(req.valid.query);
    res.json({
      success: true,
      data: circuits.map((c) => ({ ...service.toCircuitAdmin(c), templeCount: c.temples.length })),
      meta,
    });
  });

  router.post('/', validate(schemas.createCircuitSchema), async (req, res) => {
    res
      .status(201)
      .json(await one(await service.createCircuit(ctx, req.valid.body, req.user, req)));
  });

  router.get('/:id', validate(schemas.circuitIdSchema), async (req, res) => {
    res.json(await one(await service.getCircuitAdmin(req.valid.params.id)));
  });

  router.patch('/:id', validate(schemas.updateCircuitSchema), async (req, res) => {
    res.json(
      await one(
        await service.updateCircuit(ctx, req.valid.params.id, req.valid.body, req.user, req),
      ),
    );
  });

  for (const [action, fn] of Object.entries({
    publish: service.publishCircuit,
    unpublish: service.unpublishCircuit,
    archive: service.archiveCircuit,
  })) {
    router.post(`/:id/${action}`, validate(schemas.circuitIdSchema), async (req, res) => {
      res.json(await one(await fn(ctx, req.valid.params.id, req.user, req)));
    });
  }

  router.delete('/:id', validate(schemas.circuitIdSchema), async (req, res) => {
    await service.deleteCircuit(ctx, req.valid.params.id, req.user, req);
    res.status(204).end();
  });

  router.post(
    '/:id/image',
    ...imageUpload({ field: 'file', maxFiles: 1 }),
    validate(schemas.imageAltSchema),
    async (req, res) => {
      const circuit = await service.setCircuitImage(
        ctx,
        req.valid.params.id,
        req.uploadedFiles[0],
        req.valid.body.alt,
        req.user,
        req,
      );
      res.status(201).json(await one(circuit));
    },
  );

  return router;
}
