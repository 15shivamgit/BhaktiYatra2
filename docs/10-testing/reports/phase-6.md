# Phase 6 report: Razorpay payments

**Date:** 2026-10-20 · **Branch:** `shivam-kumar-dev` · **Status:** built and tested against a fake Razorpay; a real test-mode payment is blocked because the configured Razorpay test keys are rejected

## What was built

| Area | Result |
|---|---|
| Provider | Razorpay over REST (create order, fetch payment, list order payments) with basic auth; signature helpers with constant-time comparison; only whitelisted payment fields stored (no card or UPI details) |
| Orders | Booking creation now creates a real Razorpay order: amount from the server, receipt = booking reference, `notes.bookingReference`; a provider failure returns 502 and releases the hold |
| Verify | `POST /payments/verify`: owner check, signature check, fetch of the payment (order, amount, currency, capture). Mismatches are refused and reported to the admin. `authorized` waits for the capture webhook. A fetch failure trusts the signature |
| Webhooks | `POST /webhooks/razorpay`: raw body, signature, event-id dedupe, own rate limit; `payment.captured`, `order.paid`, `payment.failed`, `refund.processed` (partial and full) |
| Confirmation | The Phase 5 `confirmBooking` handles both paths: exactly one confirmation whichever arrives first, late payments re-hold seats or become `payment_received_no_seats` |
| Reconciliation | Hourly job confirms captured payments whose verify call and webhook were both lost |
| Config | `PAYMENTS_PROVIDER` defaults to `razorpay`; staging and production refuse to start without all three Razorpay values or with the stub |
| Frontend | Razorpay Checkout loaded only on payment pages; payment step with every spec state (awaiting payment, checkout open, verifying, confirmed, failed with retry on the same order, cancelled with retry, expired, pending confirmation, paid without seats); pay from the booking page or from My bookings; a spinner never lasts more than 60 seconds |
| Docs | Local test-mode setup and webhook tunnel steps, API and env changes, ADR-032 |

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| Backend `vitest run` | 22 files, 334 tests passed |
| Payments module coverage | 90.9 % statements, 95.5 % lines (target 90 %) |
| Frontend `vitest run` | 8 files, 62 tests passed |
| `playwright test` (production build, desktop + mobile) | 121 passed, 7 skipped (full run after the last fix) |
| `npm run lint` / `format:check` | clean (one existing React Compiler warning) |

Critical cases TC-PAY-01 to TC-PAY-12 are covered.

- **Integration tests (TC-PAY-01 to TC-PAY-11)** use the real Razorpay provider code with a fake REST API and real HMAC signatures.
- **TC-PAY-12 (E2E):** the verify call is blocked, and the page reaches "Payment received, confirming" within 60 seconds.
- **Other E2E journeys** go through a stub of `checkout.js` that signs like Razorpay, so the API's real verify path runs:
  - pay right after booking;
  - pay from My bookings;
  - dismiss Checkout, then a declined card, then success, all on the same order.

## Manual check

A real test-mode order was attempted with the keys in `backend/.env`. Razorpay answered **"Authentication failed"**. These are the keys that leaked in the old repository, so they have most likely been revoked or rotated. The webhook secret is also empty. Local development therefore keeps `PAYMENTS_PROVIDER=stub` (simulate buttons) until new test keys are added.

## Bugs found and fixed during the phase

1. **Provider messages ran into the next sentence** ("Card declined by bank Your seats are…"). The UI now adds the missing full stop.
2. **The global rate limiter would have throttled Razorpay** (300 requests per 15 minutes per IP). Webhooks are now mounted before it, with their own limit of 600 per minute.
3. **The verify response is a summary**, which would have emptied the travellers and history on the booking detail page after paying. The page now reloads the full booking.
4. **CI: "pay from My bookings" clicked the old page's Pay button** while the app was still navigating to the booking page, so nothing happened. The tests now wait for the booking page before paying.
5. **Two admin accessibility tests timed out** under the heavier parallel E2E load; they now wait for the editor URL and have more time.

## Exit criteria

| Criterion | Status |
|---|---|
| Real test-mode payment confirms a booking; webhook shows 200 in the dashboard; exactly one captured Payment | **Not done:** blocked by rejected test keys (see owner actions). The same flow passes against the fake Razorpay, including exactly one captured Payment |
| Replaying the webhook from the dashboard causes no changes | **Covered by tests, not by a dashboard replay:** a replayed event answers `duplicate` and leaves the Payment unchanged |
| Tampered signature rejected; booking remains pending until expiry | Met |
| UI never stays on a spinner beyond 60 s | Met (E2E with the verify endpoint blocked) |
| All Phase 6 tests green; coverage ≥ 90 % on the payments service | Met |

## Owner actions

1. **Create new Razorpay test keys:** Dashboard → Test mode → API keys. Put them in `backend/.env` and set `PAYMENTS_PROVIDER=razorpay`.
2. **Add a test webhook** through a tunnel (`docs/09-config/02-local-setup.md`). Copy its secret into `RAZORPAY_WEBHOOK_SECRET`.
3. **Make one test payment** with a test card or `success@razorpay`. Check that the webhook shows 200 and "Resend" changes nothing. Then I can close the last two exit criteria.
4. **Rotate the old keys** if not already done (they leaked in Git history).
5. Keep `NEXT_PUBLIC_FEATURE_BOOKING` off in production until live keys and the production webhook are set (Phase 10).

## Decisions recorded

ADR-032 (REST instead of the SDK, provider default and env rules, verify path, webhook mounting, reconciliation now, E2E approach, 60-second UI rule).
