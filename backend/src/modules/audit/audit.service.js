import { AuditLog } from '../../models/AuditLog.js';
import { escapeRegex } from '../../utils/crypto.js';
import { addDays, istMidnight } from '../../utils/dates.js';
import { pageMeta, skipFor } from '../../utils/pagination.js';
import { toAuditEntry } from './audit.mapper.js';

/**
 * Record a sensitive action. Never store secrets in before/after.
 * @param {{ actor?: any, action: string, entityType: string, entityId: unknown,
 *   before?: object, after?: object, reason?: string, req?: import('express').Request }} entry
 */
export function recordAudit({ actor, action, entityType, entityId, before, after, reason, req }) {
  return AuditLog.create({
    actor: actor?._id ?? null,
    actorRole: actor?.role ?? 'system',
    action,
    entityType,
    entityId,
    before,
    after,
    reason,
    ip: req?.ip,
    requestId: req?.id,
  });
}

/** Audit list for admins: newest first; `action` is a prefix ("booking." finds all booking actions). */
export async function listAuditLogs({
  actor,
  action,
  entityType,
  entityId,
  from,
  to,
  page,
  limit,
}) {
  const filter = {};
  if (actor) filter.actor = actor;
  if (action) filter.action = new RegExp(`^${escapeRegex(action)}`); // prefix: "booking."
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  if (from || to) {
    filter.createdAt = {
      ...(from && { $gte: istMidnight(from) }),
      ...(to && { $lt: addDays(istMidnight(to), 1) }),
    };
  }
  const [entries, total] = await Promise.all([
    AuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipFor({ page, limit }))
      .limit(limit)
      .populate('actor', 'name email'),
    AuditLog.countDocuments(filter),
  ]);
  return { entries: entries.map(toAuditEntry), meta: pageMeta({ page, limit }, total) };
}
