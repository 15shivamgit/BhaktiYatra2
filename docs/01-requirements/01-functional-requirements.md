# Functional Requirements

Each requirement has an ID, a priority (Must / Should / Could) and the phase that delivers it. Feature specs in `05-features/` and tests in `10-testing/` reference these IDs.

## FR-AUTH — Authentication and accounts

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-AUTH-01 | A visitor can register with name, email, password (min 8 chars) and optional phone. Email is unique, case-insensitive. | Must | 2 |
| FR-AUTH-02 | A user can log in with email and password and receives an httpOnly session cookie. | Must | 2 |
| FR-AUTH-03 | A user can log out; the cookie is cleared server-side. | Must | 2 |
| FR-AUTH-04 | The app can fetch the current user (`/auth/me`) to render the correct navbar and guards. | Must | 2 |
| FR-AUTH-05 | A user can view and edit name and phone, and change password with the current password. | Must | 2 |
| FR-AUTH-06 | A user can request a password reset email and set a new password via a time-limited token. | Should | 2 |
| FR-AUTH-07 | Expired or invalid sessions are handled gracefully: API returns 401, UI redirects to login with a return URL. | Must | 2 |
| FR-AUTH-08 | Roles are `user` and `admin`. Only an existing admin (or a seed script) can grant admin. | Must | 2 |
| FR-AUTH-09 | Login and register endpoints are rate-limited. | Must | 2 |

## FR-TEMPLE — Temple exploration

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-TEMPLE-01 | Visitors can browse a paginated list of published temples with image, name, deity, city, state. | Must | 3 |
| FR-TEMPLE-02 | Visitors can search temples by name, city, deity or keyword with relevance ordering. | Must | 3 |
| FR-TEMPLE-03 | Visitors can filter by state, deity, circuit and "featured"; filters combine. | Must | 3 |
| FR-TEMPLE-04 | A temple detail page shows: hero image and gallery, overview, history and significance, darshan timings, aarti schedule, festivals, best time to visit, how to reach (airport, railway, bus, road), rules and dress code, entry fee, official links, map, nearby temples, related circuits, related tours. | Must | 3 |
| FR-TEMPLE-05 | Temple pages are server-rendered with unique metadata, Open Graph tags and `Place`/`HinduTemple` JSON-LD. | Must | 3 |
| FR-TEMPLE-06 | Visitors can see temples on a map (list page and detail page) using OpenStreetMap tiles. | Should | 3 |
| FR-TEMPLE-07 | "Nearby temples" uses geo distance from the current temple within 100 km. | Should | 3 |
| FR-TEMPLE-08 | Visitors can browse circuits; a circuit page lists its temples in order with a route-style layout. | Must | 3 |
| FR-TEMPLE-09 | Home page shows featured temples, featured circuits and a search box. | Must | 3 |
| FR-TEMPLE-10 | Sitemap and robots are generated for all published temple, circuit and tour pages. | Must | 3 |
| FR-TEMPLE-11 | Visitors can browse temples by state via `/temples?state=` and by deity via `/temples?deity=`; these URLs are linkable and indexable. | Should | 3 |

## FR-ADMINCONTENT — Admin content management

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-ADMINCONTENT-01 | Admin can create, edit, publish, unpublish and archive temples with all fields in FR-TEMPLE-04. | Must | 3 |
| FR-ADMINCONTENT-02 | Admin can upload up to 12 images per temple (JPEG/PNG/WebP, ≤ 5 MB each), set alt text, choose a primary image, reorder and delete. | Must | 3 |
| FR-ADMINCONTENT-03 | Admin can create and manage circuits and order temples within them. | Must | 3 |
| FR-ADMINCONTENT-04 | Rich text fields (description, history) use a sanitised editor; stored HTML is sanitised server-side. | Must | 3 |
| FR-ADMINCONTENT-05 | Slugs auto-generate from name and city, are editable, and are unique. Changing a slug of a published temple creates a redirect record. | Should | 3 |
| FR-ADMINCONTENT-06 | Admin content list supports search, status filter and pagination. | Must | 3 |

## FR-TOUR — Tours and departures

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-TOUR-01 | Visitors can browse published tours with image, title, duration, destinations, "from" price, next departure date and seats left. | Must | 4 |
| FR-TOUR-02 | Visitors can search tours by title/destination and filter by price range, duration, month of departure and temple/circuit; sort by price, duration, newest, soonest departure. | Must | 4 |
| FR-TOUR-03 | A tour detail page shows summary, highlights, day-wise itinerary, inclusions, exclusions, pickup cities, gallery, linked temples, FAQ (optional), list of upcoming departures with date, price, seats left and a Book button. | Must | 4 |
| FR-TOUR-04 | Admin can create and edit tours with all fields and images; publish/unpublish/archive. | Must | 4 |
| FR-TOUR-05 | Admin can create departures for a tour with start date, end date (derived from duration, editable), price override, total seats, pickup city; and can cancel a departure (not delete) if it has bookings. | Must | 4 |
| FR-TOUR-06 | Admin can adjust `totalSeats` of a departure; the system recalculates `seatsAvailable` and refuses a reduction below already-held/confirmed seats. | Must | 4 |
| FR-TOUR-07 | A tour is bookable only if published and has at least one scheduled departure in the future with seats. | Must | 4 |
| FR-TOUR-08 | Tour pages are server-rendered with metadata and `TouristTrip` JSON-LD. | Should | 4 |

## FR-BOOK — Booking and inventory

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-BOOK-01 | A logged-in user can start a booking on a departure by choosing seats (1–10) and entering contact details and one traveller per seat (name, age, gender). | Must | 5 |
| FR-BOOK-02 | The backend validates departure is bookable, seats requested ≤ available, and computes amount from the database price. | Must | 5 |
| FR-BOOK-03 | Creating a booking atomically holds the seats and sets a 15-minute expiry; the UI shows a countdown. | Must | 5 |
| FR-BOOK-04 | Expired pending bookings are marked `expired` and their seats released by a job that runs at least every minute. | Must | 5 |
| FR-BOOK-05 | Concurrent bookings cannot oversell a departure. | Must | 5 |
| FR-BOOK-06 | A user can see their bookings (all statuses) and open a booking detail page with status timeline. | Must | 5 |
| FR-BOOK-07 | A user can cancel a pending booking (releases hold) at any time, and request cancellation of a confirmed booking subject to policy (v1: marks `cancellation_requested`, admin completes). | Should | 5/8 |
| FR-BOOK-08 | A unique human-readable booking reference is generated for every booking. | Must | 5 |
| FR-BOOK-09 | A departure cannot be booked once its start date is less than 24 hours away (configurable). | Should | 5 |

## FR-PAY — Payments

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-PAY-01 | Creating a booking also creates a Razorpay order for the computed amount in paise and returns order id, public key and amount to the client. | Must | 6 |
| FR-PAY-02 | The client verify endpoint validates HMAC signature, order/booking linkage, amount and currency before confirming. | Must | 6 |
| FR-PAY-03 | A Razorpay webhook endpoint verifies the webhook signature and processes `payment.captured`, `payment.failed`, `order.paid` idempotently. | Must | 6 |
| FR-PAY-04 | Confirmation is idempotent: the same payment id confirms a booking at most once regardless of arrival order or repetition. | Must | 6 |
| FR-PAY-05 | A verified payment for an `expired` booking re-acquires seats if available and confirms; otherwise the booking is marked `payment_received_no_seats` and flagged for admin refund. | Must | 6 |
| FR-PAY-06 | The UI shows clear states for: creating order, awaiting payment, verifying, confirmed, failed, cancelled by user, expired, pending (webhook not yet received). Never an indefinite spinner (timeout 60 s → "pending, we'll email you"). | Must | 6 |
| FR-PAY-07 | Every payment attempt is recorded in a Payment collection with provider references for reconciliation. | Must | 6 |
| FR-PAY-08 | Admin can view payments per booking with status and provider ids. | Must | 8 |

## FR-DOC — Tickets, invoices, email

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-DOC-01 | After confirmation the system generates a ticket PDF with booking reference, travellers, tour, departure dates, pickup, seats, amount paid, payment reference, issue date, support contact and a QR code. | Must | 7 |
| FR-DOC-02 | The QR encodes a signed token; `GET /tickets/verify/:token` returns validity, reference, tour, date, seats and traveller count, nothing more. | Must | 7 |
| FR-DOC-03 | After confirmation the system generates an invoice PDF with a unique sequential number, date, line items, total paid and payment reference. No tax lines unless tax config is enabled. | Must | 7 |
| FR-DOC-04 | Ticket and invoice downloads require authentication and ownership (or admin). | Must | 7 |
| FR-DOC-05 | Emails: registration welcome, booking confirmed (with ticket and invoice attached), booking cancelled, payment failed, password reset. HTML with plain-text fallback. | Must | 7 |
| FR-DOC-06 | Email sending is asynchronous with retry (3 attempts, backoff) and logged; failures never fail the payment flow. Duplicate sends for the same event are prevented. | Must | 7 |

## FR-ADMIN — Admin operations

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-ADMIN-01 | Dashboard shows: total temples (published/draft), tours, upcoming departures, users, bookings by status, confirmed seats this month, gross value of confirmed bookings (from Payment records), pending holds, recent bookings, recent audit events. | Must | 8 |
| FR-ADMIN-02 | Bookings list with search by reference/email/name, filters by booking status, payment status, tour, departure, date range; pagination and CSV export. | Must | 8 |
| FR-ADMIN-03 | Booking detail shows user, travellers, departure, payments, documents, timeline, audit entries; admin can add internal notes. | Must | 8 |
| FR-ADMIN-04 | Admin can perform only allowed status transitions (see `05-features/04-booking-inventory.md`); a manual "mark paid" requires a reason and is audited. | Must | 8 |
| FR-ADMIN-05 | Admin can process a cancellation request: cancel booking, release seats, record refund details manually (v1: refund executed in Razorpay dashboard, recorded here). | Should | 8 |
| FR-ADMIN-06 | Admin can list users, search, deactivate/reactivate, and promote/demote admin (cannot demote self). | Must | 8 |
| FR-ADMIN-07 | Admin can view contact messages and mark them read/replied. | Must | 8 |
| FR-ADMIN-08 | Audit log viewer with filters by actor, entity and date. | Should | 8 |
| FR-ADMIN-09 | Admin UI works on tablet widths; tables scroll horizontally without breaking the page. | Must | 8 |

## FR-SITE — Static and supporting pages

| ID | Requirement | Priority | Phase |
|---|---|---|---|
| FR-SITE-01 | About, Contact (form posts to API with rate limit and honeypot), Privacy Policy, Terms, Cancellation & Refund Policy, 404 and error pages. | Must | 3 |
| FR-SITE-02 | Global navigation with auth-aware profile menu; footer with links and contact. | Must | 3 |
| FR-SITE-03 | Health endpoint `GET /api/v1/health` reporting app version and DB connectivity. | Must | 1 |
