# Feature: Tours Catalogue and Departures

Requirements: FR-TOUR-01…08. Phase 4.

## Purpose

Present tours as trustworthy products with concrete dates and prices, and give admin a safe way to manage inventory per departure.

## User flows

### Browse tours
1. `/tours` shows filters (search, destination, price range slider, duration chips 1–3 / 4–7 / 8+ days, month picker, pickup city) and a sort select.
2. Cards show image, title, duration ("6 Days / 5 Nights"), destinations (first 3 + "+2"), "From ₹24,999", next departure ("10 May · 12 seats left") or "No upcoming dates".
3. URL reflects filters.

### Tour detail
1. Hero gallery, title, destinations, duration, "From ₹", rating placeholder omitted (no reviews in v1).
2. Sticky booking card (desktop right column, mobile bottom bar): departure selector (date, pickup, price, seats left) → "Book now". Guest → login with `next` back to booking page.
3. Sections: Highlights · Itinerary (accordion by day with meals and stay) · Inclusions / Exclusions · Pickup cities · Temples covered (TempleCards) · FAQs · Policies summary (links to Cancellation & Refund).
4. Departures table lists all upcoming with badges: "Few seats left" (≤ 5), "Full", "Booking closed".

### Admin: create tour
Tabs: Basics (title, summary, destinations, duration, base price, pickup cities), Itinerary (one row per day, auto-generated from duration, editable), Inclusions/Exclusions, Temples (multi-select with search), Media, FAQs, SEO. Save draft; Publish validates.

### Admin: manage departures
1. Tour → Departures tab: table with date range, pickup, price, total, held, booked, available, revenue, status; actions Edit, Adjust seats, Cancel.
2. "Add departure" dialog; "Bulk add" (Should): weekly/monthly repetition between two dates.
3. Adjust seats dialog shows committed seats and refuses reductions below them with a clear message.
4. Cancel departure dialog warns with counts of pending and confirmed bookings and requires a reason.

## Business rules

- A tour page is public when `published`; its departures list only `scheduled`/`full` with `startDate ≥ today`.
- `isBookable` requires `scheduled`, `seatsAvailable > 0`, and `now < startDate − cutoffHours`.
- `fromPrice` = min price of bookable departures; fallback `basePrice` with label "Indicative".
- Departure `endDate` defaults from duration; admin may override for travel days.
- Price changes on a departure never alter existing bookings (snapshot).
- Changing `totalSeats` adjusts `seatsAvailable` by the delta atomically; cannot go below committed.
- Cancelling a departure: pending → expired (hold released), confirmed → `cancellation_requested` with `departureCancelled` flag for refund processing. Departure status `cancelled`; no new bookings.
- A `full` departure returns to `scheduled` automatically when seats are released (hold expiry or cancellation).

## Edge cases

| Case | Behaviour |
|---|---|
| Tour published with zero departures | Listed with "No upcoming dates"; detail shows "Request dates" link to contact |
| Duration changed after departures exist | Existing departures unchanged; admin warned |
| Departure start within cutoff | Shown as "Booking closed", not bookable |
| Two admins adjust inventory simultaneously | Atomic `$inc` with guard; second gets 409 if it would breach committed seats |
| Timezone around midnight | Dates stored as IST midnight; cutoff computed in UTC from that |

## Acceptance criteria

- [ ] Tour card `fromPrice` and `nextDeparture` match fixture expectations.
- [ ] Filters by month return only tours with a departure in that month.
- [ ] Publish prerequisites enforced (itinerary length, image, inclusions, pickup).
- [ ] Inventory reduction below committed seats → 409 with counts.
- [ ] Cancel departure transitions bookings as specified (integration test with 1 pending + 1 confirmed).
- [ ] Tour JSON-LD `TouristTrip` with `offers` for the next departure present in view-source.
- [ ] Mobile sticky "Book now" bar does not overlap footer content and is keyboard reachable.
