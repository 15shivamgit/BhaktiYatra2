# Vision, Goals and Success Criteria

## Vision

Become the most useful starting point on the web for anyone planning a visit to a temple in India, and the most trusted way to book an organised pilgrimage.

## Goals for v1

| # | Goal | Measure |
|---|---|---|
| G1 | Launch a credible temple directory | At least 60 published temples across 5+ circuits with complete core fields (see `07-content/01-content-guidelines.md`) |
| G2 | Be discoverable | Every temple, circuit and tour page server-rendered with unique title, description, Open Graph tags and structured data; sitemap submitted |
| G3 | Sell tours reliably | A user can book a departure end-to-end in test mode; no overselling under concurrent load test |
| G4 | Keep money safe | Payment confirmed only after server-side signature verification; webhook and client verify are idempotent |
| G5 | Deliver documents | Ticket and invoice generated after confirmation, downloadable only by the owner or admin, emailed with retry |
| G6 | Run operations | Admin manages temples, circuits, tours, departures, inventory, bookings, users, contacts; sensitive actions audited |
| G7 | Be maintainable | Documented API and schema, automated tests on critical paths, no duplicate modules |

## Non-goals for v1

Multilingual UI, reviews, coupons, refunds automation, multi-operator marketplace, mobile apps, online darshan booking, hotel/transport add-ons. Listed in `01-requirements/04-scope-and-future.md`.

## Success criteria checklist (release gate)

The owner signs off v1 when every line is true and demonstrated:

- [ ] Public site is responsive at 360, 768 and 1280 px with no horizontal scroll.
- [ ] Lighthouse on a temple detail page: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95 (mobile, production build).
- [ ] Users register, log in, log out, reset password; sessions survive refresh; expired tokens handled gracefully.
- [ ] Ordinary users receive 403 on every admin API and are redirected from `/admin` pages.
- [ ] Admin creates a temple with images, publishes it, and it appears in listing, search and sitemap.
- [ ] Admin creates a tour and two departures with inventory.
- [ ] Concurrency test: 20 parallel bookings for 5 seats result in exactly 5 confirmed seats.
- [ ] Abandoned checkout releases its hold within 16 minutes.
- [ ] Payment with a tampered signature is rejected; a replayed webhook does not double-confirm.
- [ ] Ticket PDF opens, QR resolves to the verification endpoint, invoice has a unique number.
- [ ] User A cannot download user B's ticket by changing the URL.
- [ ] Confirmation email arrives; a forced SMTP failure is retried and logged, and the booking still shows confirmed.
- [ ] Admin dashboard numbers match database queries run by hand.
- [ ] `git log -p | grep -i secret` style audit finds no credentials; `.env` is not tracked.
- [ ] All tests in `10-testing/02-critical-test-cases.md` marked Must are green in CI.
- [ ] Deployment guide followed on a clean account reproduces a working staging environment.
