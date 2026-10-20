/**
 * Seller details printed on tickets and invoices (docs/PROJECT_CONTEXT.md). BhaktiYatra is not
 * GST-registered yet, so documents are an "Invoice / Payment Receipt" without tax lines; set
 * GSTIN and TAX_ENABLED when registration happens.
 */
export const SELLER = Object.freeze({
  name: 'BhaktiYatra',
  address: 'Ramdiri-3, Begusarai, Bihar, India 851129',
  phone: '+91 74888 81563',
  email: '15shivambgs@gmail.com',
  gstin: null,
});
export const TAX_ENABLED = false;

/** Tickets stay verifiable until a week after the departure starts. */
export const TICKET_VALID_DAYS_AFTER_START = 7;

/** Email retry backoff after attempts 1, 2 and 3 (docs/05-features/06-tickets-invoices-email.md). */
export const EMAIL_BACKOFF_MINUTES = Object.freeze([1, 5, 30]);
export const EMAIL_MAX_ATTEMPTS = 3;
/** A message stuck in "sending" this long (crashed worker) is picked up again. */
export const EMAIL_STALE_SENDING_MIN = 10;
export const EMAIL_BATCH_SIZE = 20;
