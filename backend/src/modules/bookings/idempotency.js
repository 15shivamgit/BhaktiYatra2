import { createHash } from 'node:crypto';
import { ERROR_CODES } from '../../config/constants.js';
import { IdempotencyRecord } from '../../models/IdempotencyRecord.js';
import { AppError } from '../../utils/app-error.js';

const hash = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');

/**
 * Run `handler` once per (user, scope, key). A replay with the same body returns the stored
 * response; the same key with a different body is refused; a replay while the first request
 * is still running gets 409. Failed requests release the key so the client can retry.
 * Without a key the handler simply runs.
 * @template T
 * @param {{ userId: unknown, scope: string, key?: string, request: unknown }} options
 * @param {() => Promise<{ statusCode: number, body: T }>} handler
 * @returns {Promise<{ statusCode: number, body: T, replayed: boolean }>}
 */
export async function withIdempotency({ userId, scope, key, request }, handler) {
  if (!key) return { ...(await handler()), replayed: false };
  const filter = { user: userId, scope, key };
  const requestHash = hash(request);

  try {
    await IdempotencyRecord.create({ ...filter, requestHash });
  } catch (error) {
    if (error?.code !== 11000) throw error;
    const existing = await IdempotencyRecord.findOne(filter);
    if (existing && existing.requestHash !== requestHash) {
      throw new AppError(
        422,
        ERROR_CODES.IDEMPOTENCY_KEY_REUSED,
        'This Idempotency-Key was already used for a different request',
      );
    }
    if (existing?.state === 'done') {
      return { statusCode: existing.statusCode, body: existing.body, replayed: true };
    }
    throw AppError.conflict(ERROR_CODES.CONFLICT, 'The same request is still being processed');
  }

  try {
    const result = await handler();
    // Store and return the JSON form so the first response and any replay are identical.
    const body = JSON.parse(JSON.stringify(result.body));
    await IdempotencyRecord.updateOne(filter, {
      $set: { state: 'done', statusCode: result.statusCode, body },
    });
    return { statusCode: result.statusCode, body, replayed: false };
  } catch (error) {
    await IdempotencyRecord.deleteOne(filter);
    throw error;
  }
}
