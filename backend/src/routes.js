import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminCircuitsRouter, circuitsRouter } from './modules/circuits/circuits.routes.js';
import { circuitSitemapEntries } from './modules/circuits/circuits.service.js';
import { adminContactsRouter, contactRouter } from './modules/contacts/contacts.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { adminTemplesRouter } from './modules/temples/temples.admin.routes.js';
import { templeSitemapEntries } from './modules/temples/temples.public.service.js';
import { templesRouter } from './modules/temples/temples.routes.js';
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
  router.use('/contact', contactRouter(ctx));

  router.get('/sitemap', async (_req, res) => {
    const [temples, circuits] = await Promise.all([
      templeSitemapEntries(),
      circuitSitemapEntries(),
    ]);
    res
      .set('Cache-Control', 'public, max-age=300')
      .json({ success: true, data: { temples, circuits } });
  });

  router.use('/admin/users', adminUsersRouter(ctx));
  router.use('/admin/temples', adminTemplesRouter(ctx));
  router.use('/admin/circuits', adminCircuitsRouter(ctx));
  router.use('/admin/contacts', adminContactsRouter(ctx));
  return router;
}
