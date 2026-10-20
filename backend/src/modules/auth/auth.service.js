import { ERROR_CODES, PASSWORD_RESET_TTL_MIN } from '../../config/constants.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/app-error.js';
import { randomToken, sha256Hex } from '../../utils/crypto.js';
import { recordAudit } from '../audit/audit.service.js';
import { sendPasswordResetEmail } from '../notifications/mailer.service.js';
import { enqueueNotification } from '../notifications/notifications.service.js';
import { burnPasswordCheck, hashPassword, verifyPassword } from './password.js';

/** @typedef {{ env: import('../../config/env.js').Env, logger: import('pino').Logger }} Ctx */

const invalidCredentials = () =>
  AppError.unauthenticated(ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');

/** @param {Ctx} ctx */
export async function register(ctx, { name, email, password, phone }) {
  if (await User.exists({ email })) {
    throw AppError.conflict(ERROR_CODES.EMAIL_TAKEN, 'An account with this email already exists');
  }
  const passwordHash = await hashPassword(password, ctx.env.BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, phone, lastLoginAt: new Date() });
  await enqueueNotification(ctx, {
    type: 'welcome',
    to: user.email,
    user: user._id,
    dedupeKey: `welcome:${user._id}`,
    payload: { name: user.name },
  });
  return user;
}

/** @param {Ctx} ctx @param {import('express').Request} req */
export async function login(ctx, { email, password }, req) {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user?.passwordHash) {
    await burnPasswordCheck(password, ctx.env.BCRYPT_ROUNDS);
    throw invalidCredentials();
  }
  if (!(await verifyPassword(password, user.passwordHash))) throw invalidCredentials();
  // Revealed only after a correct password, so it does not leak which accounts exist.
  if (!user.isActive) {
    throw AppError.unauthenticated(ERROR_CODES.ACCOUNT_DISABLED, 'This account has been disabled');
  }
  user.lastLoginAt = new Date();
  await user.save();
  if (user.role === 'admin') {
    await recordAudit({
      actor: user,
      action: 'auth.admin_login',
      entityType: 'User',
      entityId: user._id,
      req,
    });
  }
  return user;
}

/** @param {any} user */
export async function updateProfile(user, { name, phone }) {
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone === '' ? undefined : phone;
  await user.save();
  return user;
}

/**
 * Change (or, for Google-only accounts, set) the password. Other sessions are signed out by
 * bumping sessionVersion; the caller issues a fresh cookie for this device.
 * @param {Ctx} ctx @param {any} user loaded with +passwordHash
 */
export async function changePassword(ctx, user, { currentPassword, newPassword }) {
  if (user.passwordHash) {
    const ok = currentPassword ? await verifyPassword(currentPassword, user.passwordHash) : false;
    if (!ok) {
      throw AppError.unauthenticated(
        ERROR_CODES.INVALID_CREDENTIALS,
        'Current password is incorrect',
      );
    }
  }
  user.passwordHash = await hashPassword(newPassword, ctx.env.BCRYPT_ROUNDS);
  user.sessionVersion += 1;
  await user.save();
  return user;
}

/**
 * Always succeeds from the caller's point of view (no account enumeration).
 * The raw token exists only in the emailed link; the database keeps its SHA-256 hash.
 * @param {Ctx} ctx
 */
export async function requestPasswordReset(ctx, { email }) {
  const user = await User.findOne({ email, isActive: true });
  if (!user) return;

  const token = randomToken(32);
  user.passwordReset = {
    tokenHash: sha256Hex(token),
    expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MIN * 60_000),
  };
  await user.save();

  const resetUrl = `${ctx.env.SITE_URL}/reset-password?token=${token}`;
  // Sent now, never queued: the token must not be stored anywhere (ADR-025).
  await sendPasswordResetEmail(ctx, user, { resetUrl, expiresInMinutes: PASSWORD_RESET_TTL_MIN });
  if (ctx.env.NODE_ENV === 'development' && ctx.providers.mail.name === 'console') {
    ctx.logger.info({ resetUrl }, 'DEV ONLY: password reset link (console mail provider)');
  }
}

/** @param {Ctx} ctx */
export async function resetPassword(ctx, { token, newPassword }) {
  const user = await User.findOne({
    'passwordReset.tokenHash': sha256Hex(token),
    'passwordReset.expiresAt': { $gt: new Date() },
  }).select('+passwordReset');
  if (!user) {
    throw new AppError(
      400,
      ERROR_CODES.INVALID_OR_EXPIRED_TOKEN,
      'This reset link is invalid or has expired',
    );
  }
  user.passwordHash = await hashPassword(newPassword, ctx.env.BCRYPT_ROUNDS);
  user.passwordReset = undefined;
  user.sessionVersion += 1;
  await user.save();
}
