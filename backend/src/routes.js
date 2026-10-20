import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminCircuitsRouter, circuitsRouter } from './modules/circuits/circuits.routes.js';
import { circuitSitemapEntries } from './modules/circuits/circuits.service.js';
import { adminContactsRouter, contactRouter } from './modules/contacts/contacts.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { adminTemplesRouter } from './modules/temples/temples.admin.routes.js';
import { templeSitemapEntries } from './modules/temples/temples.public.service.js';
import { templesRouter } from './modules/temples/temples.routes.js';
import { adminDeparturesRouter, adminToursRouter } from './modules/tours/tours.admin.routes.js';
import { tourSitemapEntries } from './modules/tours/tours.public.service.js';
import { departuresRouter, toursRouter } from './modules/tours/tours.routes.js';
import { adminUsersRouter } from './modules/users/users.routes.js';

/**
 * Mounts every module router under /api/v1. Add new modules here, one line each.
 * @param {import('./modules/auth/auth.controller.js').Ctx} ctx
 */
export function apiRouter(ctx) {
  const router = Router();
  router.use('/health', healthRouter(ctx));
  router.use('/auth', authRouter(ctx));
  router.use('/temples', templesRouter(ctx));
  router.use('/circuits', circuitsRouter(ctx));
  router.use('/tours', toursRouter(ctx));
  router.use('/departures', departuresRouter(ctx));
  router.use('/contact', contactRouter(ctx));

  router.get('/sitemap', async (_req, res) => {
    const [temples, circuits, tours] = await Promise.all([
      templeSitemapEntries(),
      circuitSitemapEntries(),
      tourSitemapEntries(),
    ]);
    res
      .set('Cache-Control', 'public, max-age=300')
      .json({ success: true, data: { temples, circuits, tours } });
  });

  router.use('/admin/users', adminUsersRouter(ctx));
  router.use('/admin/temples', adminTemplesRouter(ctx));
  router.use('/admin/circuits', adminCircuitsRouter(ctx));
  router.use('/admin/tours', adminToursRouter(ctx));
  router.use('/admin/departures', adminDeparturesRouter(ctx));
  router.use('/admin/contacts', adminContactsRouter(ctx));
  return router;
}
