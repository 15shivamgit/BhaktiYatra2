# Phase 5 — Booking and Inventory

**Goal:** users can create bookings that hold seats safely, see them, and cancel pending ones; holds expire reliably. Payments are mocked in this phase (order creation uses a provider stub returning a fake order id) so inventory logic is proven in isolation. Specs: `05-features/04-booking-inventory.md`, `04-api/05-bookings-payments.md`.

## Tasks

### Backend
1. Models: `Booking`, `Payment` (shape final; Razorpay fields filled in Phase 6).
2. Reference generator `BY-YYYYMMDD-XXXXX` (nanoid, uppercase alphanumerics without ambiguous characters), unique retry on collision.
3. Booking service: `createBooking` (all preconditions, atomic hold, compensation on failure, Idempotency-Key store), `getMyBookings`, `getByReference` (owner/admin, 404 otherwise), `cancelByUser`, transition table, timeline helper.
4. Payment provider interface with `createOrder` implemented by a **stub provider** selected when `PAYMENTS_PROVIDER=stub`.
5. `expire-holds` job (every minute) with per-booking transactions.
6. `reconcile-inventory` job (hourly) + script with `--fix`.
7. Departure cancel now transitions bookings (pending → expired, confirmed → cancellation_requested) — confirmed bookings created via test fixtures.
8. Tests: concurrency (20 parallel creates on 5 seats), preconditions each error, idempotency replay, expiry job releases seats and toggles `full`, user cancel pending, transition table exhaustive test, reconciliation detects mismatch, departure cancel effects.

### Frontend
9. `/tours/[slug]/book?departure=` page: form (contact prefilled from user, seats stepper, traveller rows, terms), summary card, submit with idempotency key, 409 handling (refresh availability).
10. After creation: payment panel shell with countdown and "Pay" button that, with the stub provider, offers "Simulate success/failure" in development only (hidden in production builds).
11. `/account/bookings` (tabs) and `/account/bookings/[reference]` with timeline and cancel dialog.
12. Banner when user has pending bookings.
13. Playwright: create booking → see countdown → cancel → seats restored on tour page; expiry simulated with a short `HOLD_MINUTES` in test env.

## Exit criteria

- [ ] Concurrency test passes reliably 10 runs in a row.
- [ ] Expired holds released within 2 minutes in a manual run with `HOLD_MINUTES=1`.
- [ ] Reconciliation reports zero mismatches after a randomized test run (create/cancel/expire mix).
- [ ] User cannot see another user's booking by reference (404).
- [ ] Policy from `07-content/05-cancellation-refund-policy.md` shown on the refund-policy page and booking detail; `CANCELLATION_SLABS` used for the suggested refund.
- [ ] All Phase 5 tests green.
