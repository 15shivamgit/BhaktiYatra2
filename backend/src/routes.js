import { Router } from 'express';
import { healthRouter } from './modules/health/health.routes.js';

/**
 * Mounts every module router under /api/v1. Add new modules here, one line each.
 * @param {{ env: import('./config/env.js').Env }} deps
 */
export function apiRouter(deps) {
  const router = Router();
  router.use('/health', healthRouter(deps));
  return router;
}
