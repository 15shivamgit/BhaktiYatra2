import { ERROR_CODES } from '../../config/constants.js';
import { User } from '../../models/User.js';
import { AppError } from '../../utils/app-error.js';
import { escapeRegex } from '../../utils/crypto.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { recordAudit } from '../audit/audit.service.js';
import { SORTS } from './users.schemas.js';

export async function listUsers({ q, role, isActive, sort, page, limit }) {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive;
  if (q) {
    const pattern = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }];
  }
  const [users, total] = await Promise.all([
    User.find(filter)
      .select('+passwordHash')
      .sort(SORTS[sort])
      .skip(skipFor({ page, limit }))
      .limit(limit),
    User.countDocuments(filter),
  ]);
  return { users, meta: pageMeta({ page, limit }, total) };
}

export async function getUser(id) {
  const user = await User.findById(id).select('+passwordHash');
  if (!user) throw AppError.notFound('User not found');
  return user;
}

/**
 * Change role and/or active state. Admins cannot change their own account, so there is always
 * at least one admin able to undo a mistake.
 * @param {any} actor @param {string} id @param {{ role?: string, isActive?: boolean }} changes
 * @param {import('express').Request} req
 */
export async function updateUser(actor, id, changes, req) {
  if (actor._id.equals(id)) {
    throw AppError.forbidden(
      ERROR_CODES.CANNOT_MODIFY_SELF,
      'You cannot change your own role or status',
    );
  }
  const user = await getUser(id);

  if (changes.role !== undefined && changes.role !== user.role) {
    const before = user.role;
    user.role = changes.role;
    await user.save();
    await recordAudit({
      actor,
      action: 'user.role.change',
      entityType: 'User',
      entityId: user._id,
      before: { role: before },
      after: { role: user.role },
      req,
    });
  }
  if (changes.isActive !== undefined && changes.isActive !== user.isActive) {
    const before = user.isActive;
    user.isActive = changes.isActive;
    await user.save();
    await recordAudit({
      actor,
      action: 'user.active.change',
      entityType: 'User',
      entityId: user._id,
      before: { isActive: before },
      after: { isActive: user.isActive },
      req,
    });
  }
  return user;
}
