import { rateLimit } from 'express-rate-limit';
import { ERROR_CODES } from '../config/constants.js';

/**
 * Build a rate limiter that answers with the standard error envelope.
 * Returns a pass-through middleware when limits are disabled (tests, local debugging).
 * @param {{ enabled: boolean, windowMs: number, limit: number, keyGenerator?: (req: any) => string }} options
 */
export function createRateLimiter({ enabled, windowMs, limit, keyGenerator }) {
  if (!enabled) return (_req, _res, next) => next();
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    ...(keyGenerator && { keyGenerator }),
    handler: (req, res, _next, options) => {
      res.status(options.statusCode).json({
        success: false,
        code: ERROR_CODES.RATE_LIMITED,
        message: 'Too many requests. Please try again later.',
        details: { retryAfterSec: Math.ceil(options.windowMs / 1000) },
        requestId: req.id,
      });
    },
  });
}
