/**
 * Every non-2xx API response or network failure becomes an ApiError with the same shape,
 * so UI code can branch on `code` (docs/04-api/07-uploads-revalidate-misc.md).
 */
export class ApiError extends Error {
  /**
   * @param {{ status: number, code: string, message: string, details?: unknown, requestId?: string }} init
   */
  constructor({ status, code, message, details, requestId }) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

/**
 * Build an ApiError from an HTTP status and a (possibly non-JSON) body.
 * @param {number} status
 * @param {unknown} body parsed JSON or null
 */
export function toApiError(status, body) {
  const envelope = body && typeof body === 'object' ? /** @type {any} */ (body) : {};
  return new ApiError({
    status,
    code: typeof envelope.code === 'string' ? envelope.code : `HTTP_${status}`,
    message:
      typeof envelope.message === 'string' ? envelope.message : `Request failed with ${status}`,
    details: envelope.details,
    requestId: typeof envelope.requestId === 'string' ? envelope.requestId : undefined,
  });
}

/** @param {unknown} cause */
export function networkError(cause) {
  const error = new ApiError({
    status: 0,
    code: 'NETWORK_ERROR',
    message: 'Could not reach the server',
  });
  error.cause = cause;
  return error;
}

/**
 * Parse a fetch Response into the envelope's data, or throw ApiError.
 * @param {Response} res
 */
export async function parseResponse(res) {
  if (res.status === 204) return null;
  let body = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (!res.ok || body?.success === false) throw toApiError(res.status, body);
  return body;
}
