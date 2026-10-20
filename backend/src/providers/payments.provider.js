import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../utils/app-error.js';
import { randomToken } from '../utils/crypto.js';

/**
 * Payment provider interface:
 *   name        'stub' | 'razorpay'
 *   keyId       public key for Checkout (null for the stub)
 *   simulate    true when the dev-only "simulate payment" endpoint may be used
 *   createOrder({ amountPaise, currency, receipt, notes }) → { id, amount, currency }
 *
 * Phase 5 ships the stub, which fakes order ids so seat holds can be proven without money
 * (docs/08-phases/05-phase-5-booking.md). Phase 6 implements Razorpay here.
 * @param {{ provider: 'stub' | 'razorpay', nodeEnv: string, keyId?: string }} options
 */
export function createPaymentsProvider({ provider, nodeEnv, keyId }) {
  if (provider === 'stub') {
    return {
      name: 'stub',
      keyId: null,
      simulate: nodeEnv !== 'production',
      async createOrder({ amountPaise, currency = 'INR' }) {
        return { id: `order_stub_${randomToken(10)}`, amount: amountPaise, currency };
      },
    };
  }
  return {
    name: 'razorpay',
    keyId: keyId ?? null,
    simulate: false,
    async createOrder() {
      throw new AppError(
        503,
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Online payment is not available yet. Please call us to book.',
      );
    },
  };
}
