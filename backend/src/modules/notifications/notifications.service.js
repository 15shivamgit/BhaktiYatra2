import { NotificationLog } from '../../models/NotificationLog.js';
import { maskEmail } from '../../utils/phone.js';

/**
 * Queue an email. Delivery is implemented in Phase 7; until then the record stays `pending`.
 * A repeated dedupeKey is ignored, so retries never queue the same email twice.
 * @param {{ logger: import('pino').Logger }} ctx
 * @param {{ type: string, to: string, dedupeKey: string, user?: unknown, booking?: unknown, payload?: object }} message
 * @param {{ session?: import('mongoose').ClientSession }} [options] join a transaction
 * @returns {Promise<boolean>} true when queued, false when it was a duplicate
 */
export async function enqueueNotification(
  ctx,
  { type, to, dedupeKey, user, booking, payload = {} },
  { session } = {},
) {
  try {
    await NotificationLog.create([{ type, to, dedupeKey, user, booking, payload }], { session });
    ctx.logger.info({ type, to: maskEmail(to), dedupeKey }, 'Notification queued');
    return true;
  } catch (error) {
    if (error?.code === 11000) return false;
    throw error;
  }
}
