import { User } from '../../models/User.js';
import { pkceChallenge, randomToken, safeEqual } from '../../utils/crypto.js';
import { safeNextPath } from '../../utils/safe-redirect.js';
import { recordAudit } from '../audit/audit.service.js';
import { enqueueNotification } from '../notifications/notifications.service.js';

/** Expected sign-in failures; `reason` becomes `/login?error=<reason>`. */
export class GoogleAuthError extends Error {
  /** @param {'google_cancelled' | 'google_failed' | 'account_disabled'} reason @param {string} [detail] */
  constructor(reason, detail) {
    super(detail ?? reason);
    this.name = 'GoogleAuthError';
    this.reason = reason;
  }
}

/**
 * Prepare a Google sign-in: random state, nonce and PKCE verifier plus the consent URL.
 * @param {import('../../providers/google.provider.js').GoogleProvider} google
 * @param {unknown} next
 */
export function startGoogleSignIn(google, next) {
  const state = randomToken(24);
  const nonce = randomToken(24);
  const codeVerifier = randomToken(48);
  const url = google.authUrl({ state, nonce, codeChallenge: pkceChallenge(codeVerifier) });
  return { url, oauthState: { state, nonce, codeVerifier, next: safeNextPath(next) } };
}

function displayName(claims, email) {
  const name = typeof claims.name === 'string' ? claims.name.trim().slice(0, 80) : '';
  return name.length >= 2 ? name : email.split('@')[0].slice(0, 80).padEnd(2, '_');
}

/**
 * Finish a Google sign-in. Returns the user to sign in and where to send them.
 * @param {{ env: any, logger: import('pino').Logger, providers: { google: any } }} ctx
 * @param {{ code?: string, state?: string, error?: string }} query
 * @param {{ state: string, nonce: string, codeVerifier: string, next: string } | null} saved
 * @param {import('express').Request} req
 */
export async function completeGoogleSignIn(ctx, query, saved, req) {
  if (query.error) {
    throw new GoogleAuthError(
      query.error === 'access_denied' ? 'google_cancelled' : 'google_failed',
      query.error,
    );
  }
  if (!saved) throw new GoogleAuthError('google_failed', 'missing or expired state cookie');
  if (!query.code || !safeEqual(query.state, saved.state)) {
    throw new GoogleAuthError('google_failed', 'state mismatch');
  }

  const idToken = await ctx.providers.google.exchangeCode({
    code: query.code,
    codeVerifier: saved.codeVerifier,
  });
  const claims = await ctx.providers.google.verifyIdToken(idToken);

  if (!safeEqual(claims.nonce, saved.nonce))
    throw new GoogleAuthError('google_failed', 'nonce mismatch');
  if (
    claims.email_verified !== true ||
    typeof claims.email !== 'string' ||
    typeof claims.sub !== 'string'
  ) {
    throw new GoogleAuthError('google_failed', 'email not verified');
  }

  const email = claims.email.trim().toLowerCase();
  const now = new Date();
  let created = false;

  let user = await User.findOne({ googleId: claims.sub }).select('+passwordHash');
  if (!user) {
    // Google has verified ownership of this address, so linking it to the account is safe.
    user = await User.findOne({ email }).select('+passwordHash');
    if (user) {
      user.googleId = claims.sub;
    } else {
      user = new User({ name: displayName(claims, email), email, googleId: claims.sub });
      created = true;
    }
  }
  if (!user.isActive) throw new GoogleAuthError('account_disabled');

  if (!user.avatarUrl && typeof claims.picture === 'string') user.avatarUrl = claims.picture;
  user.emailVerifiedAt ??= now;
  user.lastLoginAt = now;
  await user.save();

  if (created) {
    await enqueueNotification(ctx, {
      type: 'welcome',
      to: user.email,
      user: user._id,
      dedupeKey: `welcome:${user._id}`,
      payload: { name: user.name },
    });
  }
  if (user.role === 'admin') {
    await recordAudit({
      actor: user,
      action: 'auth.admin_login',
      entityType: 'User',
      entityId: user._id,
      after: { method: 'google' },
      req,
    });
  }
  return { user, next: saved.next };
}
