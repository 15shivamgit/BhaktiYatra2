# End-to-End Journeys (Playwright)

As built (Phase 9): journeys live in `frontend/e2e/*.spec.js`; J2, J3 (ticket "Valid"), J7, J9, J10 and J11 are in `journeys.spec.js`, together with a keyboard-only booking. The E2E API exposes a test-only `GET /__e2e/ticket-token/:reference` for J3. Run `E2E_BROWSERS=all npm run test:e2e -w frontend` to add Firefox, WebKit desktop and WebKit iPhone. J2 step 2 reads the itinerary as a list: the itinerary is always open, not an accordion.

Seed with `npm run seed:e2e -w backend`. CI uses stubbed Razorpay (`window.Razorpay` replaced by a fake that calls the handler or failure callback); manual runs use real test mode.

## J1 — Visitor explores a temple (Must)
1. Open `/` → hero visible, search box focusable.
2. Search "Kedar" → suggestion → open temple page.
3. Assert H1, timings table, "How to reach" tiles; map section loads after scroll.
4. Click a nearby temple → navigates; breadcrumb back to Temples.
5. On `/temples`, filter State=Uttarakhand, Deity=Shiva → URL updated; reload keeps filters; results count matches.
6. axe check on each page.

## J2 — Circuit to tour (Must)
1. `/circuits/char-dham` → numbered route, map polyline present.
2. "Tours covering this circuit" → open tour → itinerary accordion expands with keyboard.

## J3 — Register, book, pay, ticket (Must)
1. Open tour → choose departure → "Book now" → redirected to login → Register new user → returned to booking page.
2. Seats 2 → traveller fields appear → fill → accept terms → Continue.
3. Countdown visible; seats-left on tour page decreased by 2 (check in a second page).
4. Pay → fake Checkout succeeds → "Booking confirmed" with reference.
5. `/account/bookings` shows confirmed booking; ticket button eventually enabled (poll ≤ 30 s) → download returns PDF.
6. Open `/verify/<token>` from booking detail (test helper exposes token) → "Valid".

## J4 — Payment failure and retry (Must)
1. Create booking → fake Checkout fails → failure message with remaining hold time.
2. Retry → succeeds → confirmed.

## J5 — Hold expiry (Must)
Env `HOLD_MINUTES=1`, jobs enabled in this run.
1. Create booking → wait for countdown 0 → Pay disabled, "Hold expired".
2. Within 2 min, tour page seats restored.
3. "Try again" creates a new booking.

## J6 — Verify endpoint blocked (Must)
Route-intercept `POST /payments/verify` to hang → UI shows "Confirming…" then "Payment received, we'll email you" within 60 s. Simulate webhook via test helper → booking page updates to confirmed on poll.

## J7 — Access control (Must)
1. As user, visit `/admin` → redirected home with toast.
2. Logged out, visit `/account/bookings` → login with `next`.
3. As user A, open user B's booking URL → 404 page.
4. As user A, request B's ticket URL → 404.

## J8 — Admin content to public (Must)
1. Admin logs in → Temples → New → fill Basics → Save draft.
2. Try Publish → errors listed (location, image, description, timing).
3. Fill missing (map picker, upload fixture image, description, one timing) → Publish → toast with link.
4. Public page renders new temple; appears in `/temples` and `/sitemap.xml`.

## J9 — Admin tour and inventory (Must)
1. Create tour (itinerary rows match duration) → publish.
2. Add departure 3 seats → user books 2 (separate context) → admin adjusts seats to 1 → refused with committed count 2 → adjust to 5 → available 3.

## J10 — Admin booking operations (Must)
1. User requests cancellation on confirmed booking.
2. Admin sees it in list filter → detail → Cancel with refund record → seats released; user sees cancelled; email logged.
3. Audit log shows the action with reason.

## J11 — Responsive smoke (Must)
For each viewport in the matrix: home, temple detail, tour detail, booking page, account bookings, admin bookings list → no horizontal scroll, primary CTA visible, menu operable.

## J12 — Real Razorpay test mode (manual, Must before Phase 6 exit)
Follow J3 with real Checkout using test card and UPI success/failure ids; confirm webhook 200 in dashboard; replay webhook; check no duplicate email.
