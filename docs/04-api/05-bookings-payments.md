# Bookings and Payments API

Requirements: FR-BOOK-01…09, FR-PAY-01…08, FR-DOC-01…04.

## Shapes

**BookingSummary** (lists):
```json
{ "id", "bookingReference", "tour": { "slug", "title", "primaryImage" }, "departure": { "startDate", "endDate", "pickupCity" }, "seats", "amount", "bookingStatus", "paymentStatus", "holdExpiresAt", "createdAt", "hasTicket", "hasInvoice" }
```

**BookingDetail**: BookingSummary + `contact`, `travellers[]`, `unitPrice`, `snapshot`, `timeline[]`, `payments: [ { id, status, method, providerPaymentId, amount, createdAt } ]`, `cancellation`, `ticket: { generatedAt } | null`, `invoice: { number, generatedAt } | null`.

---

## POST /bookings
Auth: user · Rate limit: booking group · Optional header `Idempotency-Key`  
Body:
```json
{
  "departureId": "…",
  "seats": 2,
  "contact": { "name": "Sunita Sharma", "email": "sunita@example.com", "phone": "9876543210" },
  "travellers": [ { "name": "Sunita Sharma", "age": 58, "gender": "female" }, { "name": "Ramesh Sharma", "age": 62, "gender": "male" } ],
  "acceptedTerms": true
}
```
Server steps (single service method `createBooking`):
1. Load departure + tour; check tour published, departure `scheduled`, `now < startDate − cutoff`.
2. Validate `travellers.length === seats`, `seats ≤ 10`, user has fewer than 3 pending bookings (409 `TOO_MANY_PENDING`).
3. Atomic hold: `findOneAndUpdate({ _id, status:'scheduled', seatsAvailable: { $gte: seats } }, { $inc: { seatsAvailable: -seats } })`. If null → 409 `SEATS_UNAVAILABLE` with `details.seatsAvailable`.
4. Compute `unitPrice = departure.price`, `amount = unitPrice × seats`.
5. Create Razorpay order (`amount × 100` paise, `receipt = bookingReference`, `notes: { bookingReference }`). On provider failure → release hold, 502 `PROVIDER_ERROR`.
6. Create Booking (`pending`, `holdExpiresAt = now + 15 min`, snapshot, timeline `created`) and Payment (`created`). On DB failure → release hold, attempt to note the orphan order in logs.
7. If departure `seatsAvailable` became 0 → set status `full` (best-effort).

201:
```json
{
  "success": true,
  "data": {
    "booking": BookingSummary,
    "payment": { "provider": "razorpay", "orderId": "order_…", "amountPaise": 4999800, "currency": "INR", "keyId": "rzp_test_…" },
    "checkout": { "name": "BhaktiYatra", "description": "Char Dham Yatra · 10 May 2026 · 2 seats", "prefill": { "name", "email", "contact" } }
  }
}
```
Errors: 401, 404 `NOT_FOUND` (departure or unpublished tour), 409 `SEATS_UNAVAILABLE` (`details.seatsAvailable`; also for a `full` departure), 409 `TOO_MANY_PENDING` (counts unpaid bookings whose hold has not ended), 410 `DEPARTURE_CLOSED` (inside the cutoff, or departure `cancelled`/`completed`), 422 (including `IDEMPOTENCY_KEY_REUSED` when a key is replayed with a different body), 429, 502 `PROVIDER_ERROR`, 503 while the configured provider cannot create orders.

As built (Phase 5): `payment.simulate` is `true` only with the stub provider outside production; `meta.serverTime` lets the client run the countdown on the server clock; a replayed `Idempotency-Key` returns the stored body with header `Idempotent-Replayed: true`. Keys are stored per user for 10 minutes (MongoDB TTL); a failed request releases its key. Phone numbers are normalised to E.164 (`+91…`).

## GET /bookings/my
Auth: user  
Query: `status` (bookingStatus), `page`, `limit`  
200: `BookingSummary[]` newest first.

## GET /bookings/:reference
`meta` carries `serverTime` and `payment: { provider, keyId, simulate }`. `BookingDetail` also has `cancellationQuote: { daysBefore, chargePct, suggestedRefund, departureCancelled }` for confirmed bookings and cancellation requests (`CANCELLATION_SLABS`).

Auth: user (owner) or admin  
200: `BookingDetail`. 404 for other users' bookings (not 403, to avoid reference probing).

## POST /bookings/:reference/cancel
Auth: owner or admin  
Body: `{ "reason"?: string }`  
Behaviour by current state:
- `pending` → `cancelled`, release hold, Payment `created` → `failed` ("cancelled_by_user"). 200.
- `confirmed` → `cancellation_requested` (user) ; admin uses `/admin/bookings/:id/cancel` instead. 200. Enqueues `cancellation_requested_admin` notification.
- anything else → 409 `INVALID_TRANSITION`.

## POST /bookings/:reference/simulate-payment
Development and tests only: exists only while the stub provider allows simulation (never in production). Body `{ "outcome": "success" | "failure" }`. Success runs the real `confirmBooking` (including the late-payment path); failure records a failed attempt and keeps the booking `pending`. 200: `{ booking: BookingDetail, state }`.

## GET /bookings/:reference/ticket
Auth: owner or admin  
200: `application/pdf` stream, `Content-Disposition: attachment; filename="BhaktiYatra-Ticket-<ref>.pdf"`. 404 if not generated yet (`bookingStatus !== confirmed`).

## GET /bookings/:reference/invoice
Same as ticket.

---

## POST /payments/verify
Auth: user (owner of the booking tied to the order)  
Body:
```json
{ "razorpay_order_id": "order_…", "razorpay_payment_id": "pay_…", "razorpay_signature": "…" }
```
Server steps (`confirmPaymentFromClient`):
1. Find booking by `razorpayOrderId`; owner check.
2. HMAC verify (constant-time). Fail → Payment `failed` ("signature_mismatch"), 400 `SIGNATURE_INVALID`. Booking stays `pending` (webhook may still confirm if payment actually captured).
3. (Should) Fetch payment from Razorpay; require `status in (captured, authorized)` and `amount === amountPaise`; mismatch → 409 `AMOUNT_MISMATCH`, flag for admin.
4. Call `confirmBooking(bookingId, { paymentId, via: 'client', raw })` — see idempotent confirmation below.

200:
```json
{ "success": true, "data": { "booking": BookingSummary, "state": "confirmed" | "already_confirmed" | "confirmed_late" | "payment_received_no_seats" } }
```

## POST /webhooks/razorpay
Auth: none; signature header `X-Razorpay-Signature`; raw body required (mount `express.raw` for this route before `express.json`).  
Steps:
1. HMAC with `RAZORPAY_WEBHOOK_SECRET`; mismatch → 400 (Razorpay will retry; log at warn).
2. Extract `event`, `payload.payment.entity` (and `order` for `order.paid`). Use `x-razorpay-event-id` for dedupe; if already in `Payment.webhookEventIds` → 200 immediately.
3. `payment.captured` / `order.paid` → `confirmBooking(bookingByOrderId, { paymentId, via: 'webhook', raw })`.
4. `payment.failed` → Payment `failed` with reason; Booking stays `pending` (user may retry until hold expires); timeline entry.
5. `refund.processed` → Payment `refunded`/partial; Booking `paymentStatus` updated; timeline.
6. Always respond 200 after processing (or 500 to trigger retry only on transient DB errors).

### Idempotent confirmation (`confirmBooking`)
Inside a transaction:
1. Upsert Payment by `providerPaymentId` (unique). If a Payment with this id already has `status: captured` → return `already_confirmed`.
2. Conditional update: `Booking.findOneAndUpdate({ _id, paymentStatus: 'pending' }, { paymentStatus: 'paid', ... })`.
   - If booking was `pending` → `confirmed`, `confirmedAt`, timeline `payment_captured`, `confirmed`. Return `confirmed`.
   - If booking was `expired` → try re-hold atomically; success → `confirmed` (`confirmed_late`); failure → `payment_received_no_seats`, `paymentStatus: paid`, admin alert notification. 
   - If booking was `cancelled` (user cancelled then paid in a race) → treat like expired.
   - If `paymentStatus` already `paid` → return `already_confirmed` (no further writes).
3. Set Payment `captured`, `signatureVerified: true`, `verifiedVia`, push event id.
4. Write AuditLog (`actor: null` system) and NotificationLog `booking_confirmed:<bookingId>` (unique → no duplicate email).
5. After commit: trigger document generation job (ticket + invoice) → when done, the notification job attaches and sends.

## GET /tickets/verify/:token
Auth: none (used by QR scanners)  
200:
```json
{ "success": true, "data": { "valid": true, "bookingReference": "BY-20260510-7K3QZ", "tour": "Char Dham Yatra", "startDate": "…", "seats": 2, "travellerCount": 2, "bookingStatus": "confirmed" } }
```
`valid: false` with `reason` (`expired_token`, `not_found`, `cancelled`) and 200 status (scanner-friendly). Rate limited 60/min per IP.

---

## Admin: bookings and payments

### GET /admin/bookings
Query: `q` (reference, contact email/phone/name), `bookingStatus`, `paymentStatus`, `tour`, `departure`, `from`, `to` (createdAt), `page`, `limit`, `sort`, `format=csv`  
200: `BookingSummary[]` + `user: { id, name, email }`; CSV streams with the same columns plus travellers count.

### GET /admin/bookings/:id
200: `BookingDetail` + `user` + `auditLogs[]` + `notifications[]`.

### PATCH /admin/bookings/:id/status
Body: `{ "to": "confirmed"|"cancelled", "reason": "…" }`  
Allowed: `cancellation_requested → cancelled` (releases seats; prompts refund record), `payment_received_no_seats → confirmed` (only if admin first raises inventory; service re-holds atomically), `pending → cancelled`. Manual `pending → confirmed` requires `to: "confirmed"`, `reason`, and `manualPayment: { reference, method, amount }`; creates Payment `captured` with `verifiedVia: manual`. All audited.  
Errors: 409 `INVALID_TRANSITION`, 422 `REASON_REQUIRED`.

### POST /admin/bookings/:id/cancel
Body: `{ "reason", "refund": { "amount", "reference", "method": "razorpay"|"bank"|"none" } }`  
Confirmed or cancellation_requested → `cancelled`; seats released; `paymentStatus` → `refunded`/`partially_refunded`/unchanged per amount; timeline; audit; `booking_cancelled` notification.

### POST /admin/bookings/:id/notes
Body: `{ "text" }` → 201 updated notes.

### POST /admin/bookings/:id/regenerate-documents
Regenerates ticket and invoice (same invoice number). Audit. 202.

### POST /admin/bookings/:id/resend-confirmation
Creates a new NotificationLog with dedupeKey suffix `:resend:<timestamp>`. 202.

### GET /admin/payments
Query: `status`, `from`, `to`, `q` (payment id / order id / reference), `page`, `limit`  
200: payments with booking reference and user email.
