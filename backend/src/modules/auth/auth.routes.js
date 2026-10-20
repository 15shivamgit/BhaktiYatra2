import { Router } from 'express';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { toPublicUser } from '../../models/User.js';
import { createRateLimiter } from '../../middleware/rate-limit.js';
import { validate } from '../../middleware/validate.js';
import { authController } from './auth.controller.js';
import * as schemas from './auth.schemas.js';

/** @param {import('./auth.controller.js').Ctx} ctx */
export function authRouter(ctx) {
  const { env } = ctx;
  const router = Router();
  const c = authController(ctx);
  const authLimit = createRateLimiter({
    enabled: env.RATE_LIMIT_ENABLED,
    windowMs: env.RATE_LIMIT_AUTH_WINDOW_MIN * 60_000,
    limit: env.RATE_LIMIT_AUTH_MAX,
  });
  const signedIn = requireAuth(env);

  router.post('/register', authLimit, validate(schemas.registerSchema), c.register);
  router.post('/login', authLimit, validate(schemas.loginSchema), c.login);
  router.post('/logout', c.logout);
  router.get('/me', signedIn, c.me);
  // Session probe for page loads: 200 with user or null, so guests cause no 401 noise.
  router.get('/session', optionalAuth(env), (req, res) => {
    res.set('Cache-Control', 'no-store').json({
      success: true,
      data: { user: req.user ? toPublicUser(req.user) : null },
    });
  });
  router.patch('/me', signedIn, validate(schemas.updateMeSchema), c.updateMe);
  router.post(
    '/change-password',
    signedIn,
    validate(schemas.changePasswordSchema),
    c.changePassword,
  );
  router.post(
    '/forgot-password',
    authLimit,
    validate(schemas.forgotPasswordSchema),
    c.forgotPassword,
  );
  router.post('/reset-password', authLimit, validate(schemas.resetPasswordSchema), c.resetPassword);
  router.get('/google', authLimit, validate(schemas.googleStartSchema), c.googleStart);
  router.get('/google/callback', validate(schemas.googleCallbackSchema), c.googleCallback);

  return router;
}
