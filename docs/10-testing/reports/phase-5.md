# Phase 5 report: Booking and Inventory

**Date:** 2026-10-20 · **Branch:** `shivam-kumar-dev` · **Status:** done; payments are simulated with the stub provider until Razorpay is wired in Phase 6

## What was built

| Area | Result |
|---|---|
| Models | `Payment` (unique `providerPaymentId`), `IdempotencyRecord` (10-minute TTL); `Booking` from Phase 4 now in use |
| Create booking | `POST /bookings`: preconditions in spec order, one atomic seat hold, seats returned if the payment order or the save fails, prices always from the departure, `Idempotency-Key` replays, per-user rate limit, at most 3 unpaid bookings per user |
| Read and cancel | `GET /bookings/my`, `GET /bookings/:reference` (404 for other users), `POST /bookings/:reference/cancel` (unpaid → cancelled with seats released; paid → cancellation request with a refund quote from the policy slabs and an admin alert) |
| State machine | One transition table; every other change is refused with 409 |
| Payments | Provider interface with the stub (fake orders); idempotent `confirmBooking` with the late-payment path (re-hold, or `payment_received_no_seats` with an alert); dev-only simulate endpoint; the stub is refused in production |
| Jobs | `expire-holds` every minute (one transaction per booking), `reconcile-inventory` hourly (reports only); `npm run db:reconcile -w backend [-- --fix --yes]` |
| Departure cancel | Now also fails the open payments of pending bookings |
| Frontend | Booking page `/tours/[slug]/book?departure=` (contact prefilled, seats stepper, traveller rows, terms, live availability, idempotent submit, clear errors for sold-out and closed dates); payment step with countdown, simulate buttons in test mode, "hold expired" with "Try again"; `/account/bookings` with Upcoming, Past and Cancelled tabs; booking detail with travellers, history, refund quote and cancel dialog; reminder banner for unpaid bookings; "My bookings" in the account menu |
| Local setup | Dev API switched to `PAYMENTS_PROVIDER=stub`; `frontend/.env.local` turns on `NEXT_PUBLIC_FEATURE_BOOKING` |

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| Backend `vitest run` | 21 files, 308 tests passed |
| Frontend `vitest run` | 8 files, 62 tests passed |
| `playwright test` (production build, desktop + mobile) | 115 passed, 7 skipped |
| Concurrency tests (TC-BOOK-03, TC-BOOK-09) | 10 of 10 consecutive runs passed |
| `npm run lint` / `format:check` | clean (one existing React Compiler warning about react-hook-form `watch`) |

Critical cases covered: TC-BOOK-01 to TC-BOOK-13, TC-DEP-05. Highlights:

- **Concurrency:** 20 parallel requests for 5 seats give exactly 5 bookings and 15 `SEATS_UNAVAILABLE`, and the date becomes `full`.
- **Expiry:** two expiry jobs running at once release the seats only once.
- **Idempotency:** a replay returns the identical body and creates no second booking.
- **Late payments:** a payment after expiry is confirmed if seats are free; otherwise the booking becomes `payment_received_no_seats` with an alert.
- **Reconciliation:** detects injected drift, and reports zero mismatches after a random mix of 24 bookings, cancellations, payments and expiries.
- **State machine:** all 36 status pairs checked against the table.

E2E journeys: a guest logs in from the tour page and lands on the booking page for that date, books two seats, pays (simulated) and sees the booking confirmed. Cancelling an unpaid booking restores the seat count. The one-minute hold runs out and "Try again" starts over. Another user gets "not found". The unpaid-booking banner appears. axe passes on the booking form and the booking detail.

## Manual check

With `HOLD_MINUTES=1` and the real job scheduler, a two-seat booking on a two-seat date expired after about 60 seconds. The seats returned and the date went from `full` back to `scheduled`. The exit criterion is two minutes.

Screenshots of the booking form, payment step and booking detail (desktop and mobile) are in `phase-5/`.

## Bugs found and fixed during the phase

1. **"Try again" did nothing** on the booking page: a link to the same URL does not remount an App Router page. The button now resets the page in place.
2. **A production-like env test** started failing once the stub became the default. That is the new safety rule (stub refused in production), so the test now sets Razorpay.
3. **CI: a mobile filter test timed out** once (part 1 run). The trace showed the Filters button was clicked before React hydrated, so the panel stayed closed. The shared openFilters helper now retries until the panel is open.
4. **CI: the streamed page briefly holds a hidden copy** of the tour page, so two "Book now" links matched. Tour and booking tests now match only visible elements.
5. **Footer link hover failed colour contrast** (primary on the tinted footer); hover now uses the accent colour with an underline. axe caught it because the pointer rested on a footer link.
6. **The dev API** would have answered every booking with "payment not available" because `backend/.env` selected Razorpay. Switched to the stub for local work.

## Exit criteria

| Criterion | Status |
|---|---|
| Concurrency test passes reliably 10 runs in a row | Met (10/10) |
| Expired holds released within 2 minutes with `HOLD_MINUTES=1` | Met (about 60 s) |
| Reconciliation reports zero mismatches after a randomized run | Met |
| User cannot see another user's booking by reference (404) | Met (integration and E2E) |
| Policy shown on the refund-policy page and booking detail; `CANCELLATION_SLABS` used for the suggested refund | Met (refund quote on paid bookings and cancellation requests) |
| All Phase 5 tests green | Met |

## Not done in this phase (by design)

- **Real payments:** Razorpay Checkout, signature verification and webhooks come in Phase 6. `confirmBooking` is ready for them.
- **Emails:** confirmation, cancellation and "seats unavailable" messages are queued but not sent until Phase 7. Tickets and invoices also arrive in Phase 7.
- **Admin booking screens:** refunds, notes and status changes come in Phase 8. The departures table already shows booked, held and revenue.

## Owner actions

1. **Restart `npm run dev`** to pick up the new settings (stub payments on the API, "Book now" on the site). Then try a booking and use "Simulate successful payment".
2. **Keep `NEXT_PUBLIC_FEATURE_BOOKING` off in production** until Phase 6 is live.
3. Still open: replace the sample tours, upload larger photos, review the drafted temple content, rotate the leaked credentials, delete the personal files from Cloudinary.

## Decisions recorded

ADR-031 (stub provider and simulator, idempotency storage, pending limit, references, notifications after commit, booking switch, "Try again").
