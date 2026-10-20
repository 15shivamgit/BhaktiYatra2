import { Router } from 'express';
import { ERROR_CODES } from '../../config/constants.js';
import { getHealth } from './health.service.js';

/** @param {{ env: import('../../config/env.js').Env }} deps */
export function healthRouter({ env }) {
  const router = Router();

  router.get('/', async (req, res) => {
    const { healthy, report } = await getHealth({ version: env.APP_VERSION });
    res.set('Cache-Control', 'no-store');
    if (healthy) {
      res.json({ success: true, data: report });
      return;
    }
    res.status(503).json({
      success: false,
      code: ERROR_CODES.SERVICE_UNAVAILABLE,
      message: 'Database is unreachable',
      details: report,
      requestId: req.id,
    });
  });

  return router;
}
