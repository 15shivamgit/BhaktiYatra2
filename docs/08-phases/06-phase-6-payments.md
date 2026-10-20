# Phase 6 — Razorpay Payments

**Goal:** real test-mode payments that confirm bookings exactly once through either the client verify or the webhook. Specs: `05-features/05-payments.md`, `04-api/05-bookings-payments.md`.

## Tasks

### Backend
1. Razorpay provider: `createOrder`, `fetchPayment`, `fetchOrderPayments`, signature helpers (`verifyPaymentSignature`, `verifyWebhookSignature`) with `timingSafeEqual`.
2. Switch `createBooking` to the provider chosen by env (`razorpay` default, `stub` for tests).
3. `confirmBooking` service in a transaction: Payment upsert by payment id, conditional booking update, late-payment path (re-hold), audit, NotificationLog `booking_confirmed:<id>` (sending in Phase 7), emit `booking.confirmed`.
4. `POST /payments/verify` (owner check, signature, optional fetch and amount check).
5. `POST /webhooks/razorpay` with raw body, signature, event-id dedupe, handlers for `payment.captured`, `order.paid`, `payment.failed`, `refund.processed`.
6. Payment reconciliation job (Should): pending bookings 20–120 min old → fetch order payments → confirm missed captures.
7. Tests with mocked provider and real HMAC: valid/invalid signature, amount mismatch, verify→webhook and webhook→verify ordering, duplicate webhook, late payment with and without seats, failed payment keeps pending, order-creation failure releases hold.

### Frontend
8. `useRazorpay()` loads Checkout script lazily.
9. Payment panel state machine with all states from the spec, retry with same order, dismiss handling, verify timeout → polling → pending message.
10. Success view with reference and links.
11. Playwright: test-mode flow with Razorpay test card/UPI in a headed run (manual-assisted), plus automated flow with stubbed `window.Razorpay` to assert UI states, including blocked verify endpoint.

### Ops
12. ngrok (or Cloudflare Tunnel) setup documented; Razorpay test webhook pointed at the tunnel; webhook secret in `.env`.

## Exit criteria

Status on 2026-10-20 (details in `10-testing/reports/phase-6.md`):

- [ ] Real test-mode payment confirms a booking; webhook delivery shows 200 in Razorpay dashboard; booking has exactly one captured Payment. (Blocked: the configured test keys are rejected by Razorpay; needs new keys, a webhook secret and a tunnel.)
- [ ] Replaying the webhook from the dashboard causes no changes. (Covered by tests with real HMAC; dashboard replay pending the same keys.)
- [x] Tampered signature rejected; booking remains pending until expiry.
- [x] UI never stays on a spinner beyond 60 s.
- [x] All Phase 6 tests green; coverage ≥ 90 % on payments service.
