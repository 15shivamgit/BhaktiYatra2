# Phase 4 report: Tours and Departures

**Date:** 2026-10-20 · **Branch:** `shivam-kumar-dev` · **Status:** built and tested; Lighthouse mobile Performance on the tour page is below target (same cause as Phase 3)

## What was built

| Area | Result |
|---|---|
| Models | `Tour` (itinerary, inclusions, temples, pickup cities, FAQs, images), `TourDeparture` (dates in IST, price, seats, cutoff, status), `Booking` schema (read by inventory rules; bookings are created from Phase 5) |
| Public API | Tour list with `fromPrice` and `nextDeparture` from one aggregation; filters for month, price, days, destination, pickup city, temple, circuit, open dates only; five sorts; filter facets; detail with temples in order and 12 months of departures; 301 for renamed slugs; `GET /departures/:id` for live seats (never cached) |
| Admin API | Tours CRUD, publish checklist, archive guard (refused while upcoming departures have bookings), delete rules, images; departures create, weekly or monthly bulk add, edit (dates locked once seats are booked or held), seat changes in one conditional update that never goes below committed seats, cancel in a transaction (pending bookings expire, confirmed ones flagged for refund), delete only without bookings; every change audited and revalidates the tour page |
| Jobs | In-process scheduler with an hourly `complete-departures` job |
| Seed | `npm run seed:sample-tours -w backend`: 5 sample tours on real routes (Char Dham, Kashi–Ayodhya, Ujjain–Omkareshwar, Dwarka–Somnath, Puri) with 13 departures. Prices and stays are placeholders. Seeded on the dev database and in the E2E server |
| Public pages | `/tours` (URL filters, sorting, pagination), `/tours/[slug]` (gallery, itinerary accordion, inclusions, temples, dates table with seat badges, FAQs, booking panel with date picker, sticky bar on phones, TouristTrip, FAQPage and breadcrumb JSON-LD); upcoming tours on the home page; tours on temple and circuit pages; Tours in navigation, footer and sitemap |
| Booking switch | "Book now" appears only with `NEXT_PUBLIC_FEATURE_BOOKING=true` (Phase 5). Until then the panel offers an enquiry (contact form opens with the tour as subject) and a call button |
| Admin pages | Tours list; create draft; tabbed editor (basics, content, itinerary with one row per day and "match days", inclusions, temples, photos, FAQs, SEO, departures); departures table with booked, held, available and revenue; dialogs to add, repeat, edit, change seats and cancel |

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| Backend `vitest run` | 19 files, 234 tests passed |
| Frontend `vitest run` | 7 files, 60 tests passed |
| `playwright test` (production build, desktop + mobile) | 101 passed, 7 skipped (admin journeys run on desktop only; the phone bar test runs on mobile only) |
| `npm run lint` / `format:check` | clean |
| `next build` | compiled |

Backend coverage of the Phase 4 acceptance criteria:

- **Pricing:** `fromPrice` and `nextDeparture` skip past, full, cancelled and inside-cutoff departures.
- **Month filter:** returns only tours with a departure in that month.
- **Publish rules:** images with alt text, one titled itinerary day per tour day, inclusions and pickup cities.
- **Inventory:** a reduction below booked plus held seats gives 409 with counts. Concurrent seat changes and simulated holds keep `totalSeats − seatsAvailable` equal to the seats taken. `full` and `scheduled` switch automatically.
- **Cancel:** with one pending and one confirmed booking, the pending one expires and its seats are released; the confirmed one becomes `cancellation_requested` with `departureCancelled`.
- **Archive and delete guards, completion job, sample seed** (idempotent).

E2E journeys added:

- **Tour list:** cards, filters, sorting.
- **Tour detail:** itinerary, dates, booking panel, enquiry prefill, JSON-LD, phone bar, 404.
- **Elsewhere:** tours on temple pages, upcoming tours on home, sitemap.
- **Admin:** create a tour, see what is missing, fill the itinerary, inclusions and temples, upload a photo, publish; add one departure and a weekly series; raise seats; cancel a date; the public page shows the remaining three dates and the sitemap lists the tour.
- **axe:** tour list, tour detail and the admin tour editor including the departures tab.

## CI

GitHub Actions run 39436691152 passed all three jobs: secrets-scan, build-and-test, e2e.

## Lighthouse (mobile, local production build, `lighthouse@12.8.2`)

`/tours/char-dham-yatra-haridwar`, two runs:

| Category | Target | Result |
|---|---|---|
| Performance | ≥ 85 | 57 and 59 (LCP 5.4–5.7 s, TBT 840–900 ms, CLS 0) |
| Accessibility | ≥ 90 | 100 |
| Best practices | — | 100 |
| SEO | ≥ 95 | 92 with the default user agent (streamed metadata, ADR-026) |

The hero photo now starts loading within 0.2 s. Most of the remaining time is React hydration on a throttled CPU, the same open item as the temple page in Phase 3.

## Bugs found and fixed during the phase

1. **Render-time clock reads** (`Date.now()` for the month list, `new Date()` in JSON-LD) were flagged by Next.js during prerendering. The month list now waits for the request (`connection()`), and the JSON-LD no longer contains a "valid from" date.
2. **The booking panel was rendered twice** (phone and desktop), which duplicated ids and joined the two radio groups. One panel now serves both layouts.
3. **Dropdowns looked disabled** everywhere: Chrome treats `<select>` as read-only, and the input style greyed read-only fields.
4. **Departure dialogs would have nested forms** inside the tour form; the departures tab now sits outside it.
5. **E2E timing:** the long admin journeys needed more time when four workers run in parallel, and a filter test could count a tour created by the admin test. Both are fixed.

## Exit criteria

| Criterion | Status |
|---|---|
| Admin creates a tour with itinerary and two departures and publishes it; it appears in list, detail, temple pages and sitemap | Met (admin E2E plus temple page tests) |
| Inventory reduction below committed seats is refused (seeded bookings fixture) | Met (backend integration tests) |
| Departure within cutoff shows "Booking closed" | Met (API `isBookable` tests; badge in the dates table and booking panel) |
| Lighthouse and axe targets on tour detail | **Partly met:** axe clean and Accessibility 100; **Performance 57–59 and SEO 92 not met** |
| All Phase 4 tests green | Met |

## Not done in this phase

- **Traveller email when a departure is cancelled:** arrives with Phase 7 (email queue).
- **Online booking:** Phase 5. The tour page offers an enquiry instead.

## Owner actions

1. **Replace the sample tours** with real products in Admin → Tours (prices, hotels, dates), or archive them.
2. **Larger photos** are still needed for heroes (1600 px or more).
3. Still open from earlier phases: review the drafted temple content, rotate the leaked credentials, delete the personal files from Cloudinary.

## Decisions recorded

ADR-030 (IST dates, Booking schema early, atomic inventory, cancel transaction, job scheduler, booking switch).
