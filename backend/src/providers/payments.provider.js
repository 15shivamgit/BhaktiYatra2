import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';
import { randomToken } from '../utils/crypto.js';
import { verifyPaymentSignature, verifyWebhookSignature } from '../utils/razorpay-signature.js';

const RAZORPAY_API = 'https://api.razorpay.com/v1';

/**
 * Payment provider interface:
 *   name                    'stub' | 'razorpay'
 *   keyId                   public key for Checkout (null for the stub)
 *   simulate                true when the dev-only "simulate payment" endpoint may be used
 *   createOrder({ amountPaise, currency, receipt, notes }) → { id, amount, currency }
 *   fetchPayment(paymentId) → Razorpay payment entity
 *   fetchOrderPayments(orderId) → Razorpay payment entities
 *   verifyPaymentSignature({ orderId, paymentId, signature }) → boolean
 *   verifyWebhookSignature(rawBody, signature) → boolean
 *
 * @param {{ provider: 'stub' | 'razorpay', nodeEnv: string, keyId?: string, keySecret?: string,
 *   webhookSecret?: string, fetchImpl?: typeof fetch, timeoutMs?: number }} options
 */
export function createPaymentsProvider({
  provider,
  nodeEnv,
  keyId,
  keySecret,
  webhookSecret,
  fetchImpl = fetch,
  timeoutMs = 10_000,
}) {
  if (provider === 'stub') return createStubProvider(nodeEnv);
  return createRazorpayProvider({ keyId, keySecret, webhookSecret, fetchImpl, timeoutMs });
}

/** Fake orders for development and tests (ADR-031); never allowed in production. */
function createStubProvider(nodeEnv) {
  return {
    name: 'stub',
    keyId: null,
    simulate: nodeEnv !== 'production',
    async createOrder({ amountPaise, currency = 'INR' }) {
      return { id: `order_stub_${randomToken(10)}`, amount: amountPaise, currency };
    },
    async fetchPayment() {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'The stub provider has no payments');
    },
    async fetchOrderPayments() {
      return [];
    },
    verifyPaymentSignature: () => false,
    verifyWebhookSignature: () => false,
  };
}

/**
 * Razorpay REST API (Orders and Payments) with basic auth. No SDK: three calls are all we need.
 * https://razorpay.com/docs/api/orders/ · https://razorpay.com/docs/api/payments/
 */
export function createRazorpayProvider({ keyId, keySecret, webhookSecret, fetchImpl, timeoutMs }) {
  const auth = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;

  async function call(method, path, body) {
    if (!keyId || !keySecret) {
      throw new AppError(503, ERROR_CODES.SERVICE_UNAVAILABLE, 'Online payment is not configured');
    }
    let res;
    try {
      res = await fetchImpl(`${RAZORPAY_API}${path}`, {
        method,
        headers: {
          Authorization: auth,
          Accept: 'application/json',
          ...(body && { 'Content-Type': 'application/json' }),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (error) {
      throw Object.assign(new Error(`Razorpay request failed: ${error.message}`), {
        provider: true,
      });
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const description = data?.error?.description ?? `HTTP ${res.status}`;
      throw Object.assign(new Error(`Razorpay ${method} ${path}: ${description}`), {
        provider: true,
        status: res.status,
      });
    }
    return data;
  }

  return {
    name: 'razorpay',
    keyId: keyId ?? null,
    simulate: false,
    createOrder: ({ amountPaise, currency = 'INR', receipt, notes }) =>
      call('POST', '/orders', { amount: amountPaise, currency, receipt, notes }),
    fetchPayment: (paymentId) => call('GET', `/payments/${encodeURIComponent(paymentId)}`),
    fetchOrderPayments: async (orderId) =>
      (await call('GET', `/orders/${encodeURIComponent(orderId)}/payments`)).items ?? [],
    verifyPaymentSignature: (fields) => verifyPaymentSignature(fields, keySecret),
    verifyWebhookSignature: (rawBody, signature) =>
      verifyWebhookSignature(rawBody, signature, webhookSecret),
  };
}
