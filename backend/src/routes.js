import { Router } from 'express';
import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { adminUsersRouter } from './modules/users/users.routes.js';

/**
 * Mounts every module router under /api/v1. Add new modules here, one line each.
 * @param {import('./modules/auth/auth.controller.js').Ctx} ctx
 */
export function apiRouter(ctx) {
  const router = Router();
  router.use('/health', healthRouter(ctx));
  router.use('/auth', authRouter(ctx));
  router.use('/admin/users', adminUsersRouter(ctx));
  return router;
}
