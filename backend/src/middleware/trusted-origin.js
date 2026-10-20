import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence in depth (docs/02-architecture/04-security.md §6). Browsers send `Origin` on
 * cross-origin and same-origin POSTs; a state-changing request from an origin that is not on
 * the allow-list is refused. Requests without `Origin` (server-to-server, curl, tests) pass
 * unless the browser marks them `Sec-Fetch-Site: cross-site`.
 * @param {string[]} allowedOrigins
 */
export function requireTrustedOrigin(allowedOrigins) {
  const allowed = new Set(allowedOrigins);
  return (req, _res, next) => {
    if (SAFE_METHODS.has(req.method)) return next();
    const origin = req.get('origin');
    const crossSite = req.get('sec-fetch-site') === 'cross-site';
    if ((origin && !allowed.has(origin)) || (!origin && crossSite)) {
      return next(
        AppError.forbidden(ERROR_CODES.FORBIDDEN_ORIGIN, 'Request origin is not allowed'),
      );
    }
    return next();
  };
}
