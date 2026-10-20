import { createHmac, timingSafeEqual } from 'node:crypto';

/** HMAC-SHA256 as lowercase hex. */
export function hmacHex(secret, payload) {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/** Constant-time comparison of two hex strings (false for any length or type mismatch). */
export function safeEqualHex(expected, actual) {
  if (typeof expected !== 'string' || typeof actual !== 'string') return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(actual, 'utf8');
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Checkout success signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret).
 * https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/
 */
export function verifyPaymentSignature({ orderId, paymentId, signature }, keySecret) {
  if (!keySecret || !orderId || !paymentId) return false;
  return safeEqualHex(hmacHex(keySecret, `${orderId}|${paymentId}`), signature);
}

/** Webhook signature: HMAC_SHA256(raw request body, webhook_secret) in X-Razorpay-Signature. */
export function verifyWebhookSignature(rawBody, signature, webhookSecret) {
  if (!webhookSecret || !rawBody) return false;
  return safeEqualHex(hmacHex(webhookSecret, rawBody), signature);
}

const SNAPSHOT_FIELDS = [
  'id',
  'order_id',
  'amount',
  'currency',
  'status',
  'method',
  'email',
  'contact',
  'created_at',
  'error_code',
  'error_description',
];

/** Only these payment fields are stored (no card or UPI details; docs/05-features/05-payments.md). */
export function paymentSnapshot(entity) {
  if (!entity || typeof entity !== 'object') return undefined;
  return Object.fromEntries(
    SNAPSHOT_FIELDS.filter((key) => entity[key] !== undefined).map((key) => [key, entity[key]]),
  );
}
