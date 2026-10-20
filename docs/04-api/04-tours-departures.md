# Tours and Departures API

Requirements: FR-TOUR-01…08.

## Shapes

**TourCard**:
```json
{ "id", "slug", "title", "summary", "destinations": ["Haridwar","Kedarnath"], "durationDays", "durationNights", "primaryImage", "fromPrice", "nextDeparture": { "id", "startDate", "seatsAvailable", "price" } | null, "featured" }
```
`fromPrice` = min price among upcoming bookable departures, else `basePrice`.

**DeparturePublic**:
```json
{ "id", "startDate", "endDate", "pickupCity", "price", "seatsAvailable", "totalSeats", "status", "isBookable", "bookingClosesAt" }
```
`isBookable` = status scheduled, seatsAvailable > 0, now < startDate − cutoffHours.

**TourPublic**: full public fields + `images[]`, `itinerary[]`, `inclusions`, `exclusions`, `pickupCities`, `faqs`, `temples: TempleCard[]`, `departures: DeparturePublic[]` (upcoming, next 12 months, sorted by startDate).

---

## Public

### GET /tours
Query: `q`, `destination`, `temple` (slug), `circuit` (slug), `minPrice`, `maxPrice`, `minDays`, `maxDays`, `month` (`YYYY-MM`, has a departure that month), `pickupCity`, `featured`, `page`, `limit`, `sort` (`-featured,-publishedAt` default; `price`, `-price`, `durationDays`, `nextDeparture`)  
200: `TourCard[]` with `meta`. Only published tours. Tours with no upcoming departures are still listed with `nextDeparture: null` and a "No upcoming dates" badge, unless `bookableOnly=true`.

### GET /tours/:slug
200: `TourPublic`. 301 on redirect. 404 if not published.

### GET /tours/:slug/departures
Query: `from` (date, default today), `to` (default +12 months)  
200: `DeparturePublic[]`.

### GET /departures/:id
Public, used by the booking page to refresh availability.  
200: `DeparturePublic` + `tour: { id, slug, title, durationDays, primaryImage }`.

---

## Admin: tours

### GET /admin/tours
Query: `q`, `status`, `featured`, `page`, `limit`, `sort`  
200: list with `departureCount`, `upcomingDepartureCount`.

### POST /admin/tours
Body: writable fields; required `title`, `summary`, `description`, `destinations[]`, `durationDays`, `pickupCities[]`, `basePrice`. `itinerary` optional on create.  
201: `TourAdmin`. Audit.

### GET /admin/tours/:id · PATCH /admin/tours/:id
As temples. Changing `durationDays` does not alter existing departures; a warning is returned in `meta.warnings` if departures exist.

### POST /admin/tours/:id/publish
Prerequisites: ≥ 1 image, `itinerary.length === durationDays`, inclusions ≥ 1, pickupCities ≥ 1.  
200. Audit. Revalidate.

### POST /admin/tours/:id/unpublish · /archive
Archive is refused (409 `HAS_ACTIVE_DEPARTURES`) if any departure is `scheduled`/`full` with future `startDate` and pending/confirmed bookings; admin must cancel departures first.

### DELETE /admin/tours/:id
Draft with no departures only.

### Images
Same endpoints as temples under `/admin/tours/:id/images`.

---

## Admin: departures

### GET /admin/tours/:tourId/departures
Query: `status`, `from`, `to`  
200: departures with `bookedSeats` (confirmed), `heldSeats` (pending), `revenue` (sum of captured payments).

### POST /admin/tours/:tourId/departures
Body:
```json
{ "startDate": "2026-05-10", "endDate": "2026-05-16", "pickupCity": "Delhi", "price": 24999, "totalSeats": 40, "bookingCutoffHours": 24, "notes": "" }
```
Rules: tour must not be archived; `startDate ≥ today`; `endDate ≥ startDate`; `price ≥ 1`; `totalSeats 1–200`. `seatsAvailable = totalSeats`.  
201: `DepartureAdmin`. Audit `departure.create`.

### PATCH /admin/departures/:id
Body: any of `startDate`, `endDate`, `pickupCity`, `price`, `bookingCutoffHours`, `notes`. Date changes allowed only if no confirmed bookings (409 `HAS_BOOKINGS`); price change affects future bookings only.  
200. Audit.

### PATCH /admin/departures/:id/inventory
Body: `{ "totalSeats": 45, "reason": "Added second bus" }`  
Rule: new `totalSeats ≥ bookedSeats + heldSeats`; `seatsAvailable += (new − old)` atomically.  
200: departure with recalculated counts. Audit `departure.inventory.update` with before/after and reason.  
Errors: 409 `BELOW_COMMITTED_SEATS` with `details: { bookedSeats, heldSeats }`.

### POST /admin/departures/:id/cancel
Body: `{ "reason" }`  
Effect: status `cancelled`; pending bookings → `expired` with seats released; confirmed bookings → `cancellation_requested` flagged `departureCancelled: true` for admin refund processing; notification `departure_cancelled` (Should) to affected users.  
200: `{ departure, affected: { pending: n, confirmed: m } }`. Audit.

### DELETE /admin/departures/:id
Only when zero bookings of any status. 204.
