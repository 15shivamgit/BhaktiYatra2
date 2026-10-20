/** Audit entry for admin screens; `actor` is populated with name and email when present. */
export function toAuditEntry(entry) {
  const actor =
    entry.actor && typeof entry.actor === 'object' && entry.actor._id ? entry.actor : null;
  return {
    id: entry._id.toString(),
    action: entry.action,
    actor: actor ? { id: actor._id.toString(), name: actor.name, email: actor.email } : null,
    actorRole: entry.actorRole ?? null,
    entityType: entry.entityType,
    entityId: entry.entityId.toString(),
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
    createdAt: entry.createdAt,
  };
}
