import { Router } from 'express';
import { adminAuditRouter } from './modules/audit/audit.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { adminBookingsRouter } from './modules/bookings/bookings.admin.routes.js';
import { bookingsRouter } from './modules/bookings/bookings.routes.js';
import { ticketsRouter } from './modules/documents/tickets.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { adminCircuitsRouter, circuitsRouter } from './modules/circuits/circuits.routes.js';
import { circuitSitemapEntries } from './modules/circuits/circuits.service.js';
import { adminContactsRouter, contactRouter } from './modules/contacts/contacts.routes.js';
import { adminDashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { adminPaymentsRouter } from './modules/payments/payments.admin.routes.js';
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
  router.use('/bookings', bookingsRouter(ctx));
  router.use('/payments', paymentsRouter(ctx));
  router.use('/tickets', ticketsRouter(ctx));
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
  router.use('/admin/dashboard', adminDashboardRouter(ctx));
  router.use('/admin/bookings', adminBookingsRouter(ctx));
  router.use('/admin/payments', adminPaymentsRouter(ctx));
  router.use('/admin/audit-logs', adminAuditRouter(ctx));
  return router;
}
