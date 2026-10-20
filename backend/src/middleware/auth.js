import { ERROR_CODES, SESSION_COOKIE } from '../config/constants.js';
import { User } from '../models/User.js';
import { clearSession, verifySession } from '../modules/auth/session.js';
import { AppError } from '../utils/app-error.js';

/**
 * Resolve the session cookie to an active user. The user is reloaded on every request so
 * deactivation, demotion and password changes take effect immediately.
 * @param {import('../config/env.js').Env} env
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @returns {Promise<{ user: any } | { error: AppError } | null>} null when there is no cookie
 */
async function resolveSession(env, req, res) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;

  const expired = () => {
    clearSession(res, env);
    return {
      error: AppError.unauthenticated(
        ERROR_CODES.SESSION_EXPIRED,
        'Your session has expired. Please log in again.',
      ),
    };
  };

  const claims = await verifySession(env, token);
  if (!claims) return expired();

  const user = await User.findById(claims.sub).select('+passwordHash');
  if (!user || user.sessionVersion !== claims.sv) return expired();
  if (!user.isActive) {
    clearSession(res, env);
    return {
      error: AppError.unauthenticated(
        ERROR_CODES.ACCOUNT_DISABLED,
        'This account has been disabled',
      ),
    };
  }
  return { user };
}

/** Require a signed-in, active user; sets `req.user`. */
export function requireAuth(env) {
  return async (req, res, next) => {
    const result = await resolveSession(env, req, res);
    if (!result) return next(AppError.unauthenticated());
    if ('error' in result) return next(result.error);
    req.user = result.user;
    return next();
  };
}

/** Attach `req.user` when a valid session exists; never rejects. */
export function optionalAuth(env) {
  return async (req, res, next) => {
    const result = await resolveSession(env, req, res);
    if (result && 'user' in result) req.user = result.user;
    return next();
  };
}

/** Must run after requireAuth. */
export function requireRole(role) {
  return (req, _res, next) => {
    if (req.user?.role === role) return next();
    return next(
      AppError.forbidden(
        role === 'admin' ? ERROR_CODES.ADMIN_ONLY : ERROR_CODES.FORBIDDEN,
        role === 'admin' ? 'Admin access only' : 'You do not have access to this',
      ),
    );
  };
}
