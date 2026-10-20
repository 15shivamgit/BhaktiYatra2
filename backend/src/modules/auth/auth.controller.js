import { ERROR_CODES, OAUTH_COOKIE } from '../../config/constants.js';
import { toPublicUser } from '../../models/User.js';
import { AppError } from '../../utils/app-error.js';
import * as authService from './auth.service.js';
import { completeGoogleSignIn, GoogleAuthError, startGoogleSignIn } from './google.service.js';
import {
  clearOAuthState,
  clearSession,
  readOAuthState,
  setOAuthState,
  startSession,
} from './session.js';

/** @typedef {{ env: import('../../config/env.js').Env, logger: import('pino').Logger, providers: import('../../providers/index.js').Providers }} Ctx */

/** @param {Ctx} ctx */
export function authController(ctx) {
  const { env } = ctx;
  const userBody = (user) => ({ success: true, data: { user: toPublicUser(user) } });

  return {
    async register(req, res) {
      const user = await authService.register(ctx, req.valid.body);
      await startSession(res, env, user);
      res.status(201).json(userBody(user));
    },

    async login(req, res) {
      const user = await authService.login(ctx, req.valid.body, req);
      await startSession(res, env, user);
      res.json(userBody(user));
    },

    logout(_req, res) {
      clearSession(res, env);
      res.status(204).end();
    },

    me(req, res) {
      res.set('Cache-Control', 'no-store');
      res.json(userBody(req.user));
    },

    async updateMe(req, res) {
      const user = await authService.updateProfile(req.user, req.valid.body);
      res.json(userBody(user));
    },

    async changePassword(req, res) {
      const user = await authService.changePassword(ctx, req.user, req.valid.body);
      await startSession(res, env, user); // keep this device signed in with the new version
      res.status(204).end();
    },

    async forgotPassword(req, res) {
      await authService.requestPasswordReset(ctx, req.valid.body);
      res.status(202).json({
        success: true,
        data: null,
        message: 'If an account exists for this email, we have sent a reset link.',
      });
    },

    async resetPassword(req, res) {
      await authService.resetPassword(ctx, req.valid.body);
      res.status(204).end();
    },

    async googleStart(req, res) {
      if (!ctx.providers.google.enabled) {
        throw new AppError(404, ERROR_CODES.GOOGLE_DISABLED, 'Google sign-in is not configured');
      }
      const { url, oauthState } = startGoogleSignIn(ctx.providers.google, req.valid.query.next);
      await setOAuthState(res, env, oauthState);
      res.redirect(302, url);
    },

    async googleCallback(req, res) {
      const saved = await readOAuthState(env, req.cookies?.[OAUTH_COOKIE]);
      clearOAuthState(res, env);
      try {
        const { user, next } = await completeGoogleSignIn(ctx, req.valid.query, saved, req);
        await startSession(res, env, user);
        res.redirect(302, `${env.SITE_URL}${next}`);
      } catch (error) {
        // This is a browser navigation, so failures redirect to the login page instead of JSON.
        const reason = error instanceof GoogleAuthError ? error.reason : 'google_failed';
        const level = error instanceof GoogleAuthError ? 'warn' : 'error';
        (req.log ?? ctx.logger)[level]({ reason, err: error.message }, 'Google sign-in failed');
        res.redirect(302, `${env.SITE_URL}/login?error=${reason}`);
      }
    },
  };
}
