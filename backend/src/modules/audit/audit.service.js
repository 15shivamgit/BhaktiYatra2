import { AuditLog } from '../../models/AuditLog.js';

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
