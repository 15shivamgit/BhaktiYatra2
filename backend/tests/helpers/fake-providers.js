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
