import { vi } from 'vitest';

/** A real 1×1 PNG, so server-side type sniffing sees genuine image bytes. */
export const PNG_1X1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

/** Windows executable header: must be rejected even when named "photo.jpg". */
export const FAKE_EXE = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(200, 0x90)]);

/** In-memory image store recording uploads and deletions. */
export function createFakeImages({ enabled = true } = {}) {
  const fake = {
    enabled,
    failNext: 0,
    uploadImage: vi.fn(async (_buffer, { folder, publicId }) => {
      if (fake.failNext > 0) {
        fake.failNext -= 1;
        throw new Error('simulated storage failure');
      }
      const id = `${folder}/${publicId}`;
      return {
        url: `https://res.cloudinary.com/demo/image/upload/${id}.png`,
        publicId: id,
        width: 1600,
        height: 1067,
      };
    }),
    destroy: vi.fn(async () => {}),
  };
  return fake;
}

export function createFakeFrontend() {
  return { enabled: true, revalidate: vi.fn(async () => {}) };
}

/** Stub-like payment provider whose next order creations can be made to fail. */
export function createFakePayments({ simulate = true } = {}) {
  let counter = 0;
  const fake = {
    name: 'stub',
    keyId: null,
    simulate,
    failNext: 0,
    createOrder: vi.fn(async ({ amountPaise, currency = 'INR' }) => {
      if (fake.failNext > 0) {
        fake.failNext -= 1;
        throw new Error('simulated provider outage');
      }
      counter += 1;
      return { id: `order_fake_${counter}`, amount: amountPaise, currency };
    }),
  };
  return fake;
}

/**
 * Fake Razorpay REST API for the real provider (createPaymentsProvider with fetchImpl).
 * Tests register payments with `addPayment` and can make order creation fail.
 */
export function createFakeRazorpayApi() {
  const orders = new Map();
  const payments = new Map();
  let counter = 0;
  const api = {
    orders,
    payments,
    failOrders: 0,
    failFetch: false,
    addPayment(payment) {
      payments.set(payment.id, { currency: 'INR', status: 'captured', method: 'upi', ...payment });
      return payments.get(payment.id);
    },
    fetch: vi.fn(async (url, init = {}) => {
      const path = new URL(url).pathname.replace('/v1', '');
      const json = (status, body) => ({ ok: status < 400, status, json: async () => body });
      if (init.method === 'POST' && path === '/orders') {
        if (api.failOrders > 0) {
          api.failOrders -= 1;
          return json(500, { error: { description: 'Server error' } });
        }
        counter += 1;
        const body = JSON.parse(init.body);
        const order = {
          id: `order_fake${String(counter).padStart(8, '0')}`,
          ...body,
          status: 'created',
        };
        orders.set(order.id, order);
        return json(200, order);
      }
      if (api.failFetch) throw new Error('network down');
      const paymentMatch = path.match(/^\/payments\/(.+)$/);
      if (paymentMatch) {
        const payment = payments.get(decodeURIComponent(paymentMatch[1]));
        return payment ? json(200, payment) : json(404, { error: { description: 'not found' } });
      }
      const orderPayments = path.match(/^\/orders\/(.+)\/payments$/);
      if (orderPayments) {
        const id = decodeURIComponent(orderPayments[1]);
        return json(200, { items: [...payments.values()].filter((p) => p.order_id === id) });
      }
      return json(404, { error: { description: 'unknown route' } });
    }),
  };
  return api;
}
