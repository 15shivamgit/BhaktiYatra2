import { randomUUID } from 'node:crypto';

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Reuse a caller-supplied X-Request-Id when it is safe, otherwise generate one. */
export function requestId() {
  return (req, res, next) => {
    const incoming = req.get('x-request-id');
    req.id = incoming && SAFE_ID.test(incoming) ? incoming : randomUUID();
    res.set('X-Request-Id', req.id);
    next();
  };
}
