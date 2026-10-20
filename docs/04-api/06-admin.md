# Admin Dashboard, Audit and Contacts API

Requirements: FR-ADMIN-01…09, FR-SITE-01.

## GET /admin/dashboard
Auth: admin  
Query: `range` (`7d` default, `30d`, `90d`, `mtd`)  
200:
```json
{
  "success": true,
  "data": {
    "content": { "templesPublished": 64, "templesDraft": 9, "circuitsPublished": 6, "toursPublished": 11, "toursDraft": 2 },
    "departures": { "upcoming": 18, "full": 3, "nextSevenDays": 2 },
    "users": { "total": 1240, "newInRange": 85 },
    "bookings": {
      "byStatus": { "pending": 4, "confirmed": 212, "cancelled": 9, "expired": 61, "cancellation_requested": 2, "payment_received_no_seats": 0 },
      "confirmedInRange": 37,
      "seatsConfirmedInRange": 92
    },
    "revenue": { "capturedInRange": 2167400, "capturedAllTime": 10345000, "refundedInRange": 49998, "currency": "INR" },
    "holds": { "activePending": 4, "seatsHeld": 9 },
    "recentBookings": [ BookingSummary × 10 ],
    "recentAudit": [ { "id", "action", "actorName", "entityType", "entityId", "createdAt" } × 10 ],
    "alerts": [ { "type": "payment_received_no_seats", "count": 0 }, { "type": "inventory_mismatch", "count": 0 }, { "type": "email_failures_24h", "count": 1 } ]
  }
}
```
Rules: `revenue.*` sums **Payment** documents with `status: captured` (minus refunds), never booking amounts. Numbers are computed with aggregation pipelines; cache 60 s.

As built (Phase 8, ADR-034): `range` counts the last N calendar days in India including today, or the month to date in IST. `revenue` has `capturedInRange`, `refundedInRange`, `netInRange`, `capturedAllTime`, `refundedAllTime`, `netAllTime`: captured counts Payments now `captured` or `refunded` (a refunded payment was captured first) by `capturedAt` (older records: `createdAt`); refunds are dated by `refund.at`. `confirmedInRange` counts bookings with `confirmedAt` in the range, whatever their status now. `departures` count `scheduled`/`full` departures starting today or later. Alerts add `cancellation_requested`; `inventory_mismatch` runs the hourly reconciliation check (read-only). The response adds `range`, `from` and `generatedAt`; `meta.cachedAt` says when the figures were computed. `npm run db:check-dashboard -w backend` compares every figure with plain MongoDB queries.

## GET /admin/audit-logs
Query: `actor`, `action` (prefix match, e.g. `booking.`), `entityType`, `entityId`, `from`, `to`, `page`, `limit`  
200: entries with `actor: { id, name, email } | null`.

As built: list entries already include `before`, `after`, `reason` and `actorRole` (the UI expands rows without another request); `action` accepts lowercase letters, dots and underscores only; `limit` up to 100 (default 25).

## GET /admin/audit-logs/:id
200: full entry including `before`/`after`.

## Contacts

### POST /contact  (public)
Rate limit: contact group. Body: `{ "name", "email", "phone"?, "subject"?, "message", "website": "" }` — `website` is a honeypot; non-empty → 200 but stored as `spam`.  
201 `{ "data": { "id" } }`. Enqueues `contact_received_admin` notification to `ADMIN_NOTIFY_EMAIL` (Should).

### GET /admin/contacts
Query: `status`, `q`, `page`, `limit` → 200 list.

### PATCH /admin/contacts/:id
Body: `{ "status": "read"|"replied"|"spam" }` → 200.

## Settings (Should, Phase 8)

### GET /admin/settings · PATCH /admin/settings
Single document `settings` with: `business: { legalName, address, supportEmail, supportPhone, gstin|null }`, `booking: { holdMinutes: 15, maxSeatsPerBooking: 10, defaultCutoffHours: 24 }`, `tax: { enabled: false, rate: null, label: null }`. Values override constants at runtime; audited. If not implemented in v1, these live in env/constants and the endpoint is omitted.

As built: **not implemented in v1** (ADR-034). Business details for invoices are in `backend/src/config/documents.js` (`SELLER`, `TAX_ENABLED`), booking parameters in env (`HOLD_MINUTES`, `MAX_SEATS_PER_BOOKING`) and `backend/src/config/tours.js` (`DEFAULT_BOOKING_CUTOFF_HOURS`), and the cancellation slabs in `backend/src/config/bookings.js`. Changes go through code review and deployment.

## Health

### GET /health  (public)
200 `{ "success": true, "data": { "status": "ok", "version": "1.0.0", "uptimeSec": 1234, "db": "up", "time": "…" } }`  
503 when Mongo ping fails, using the error envelope with the report in `details`:
`{ "success": false, "code": "SERVICE_UNAVAILABLE", "message": "Database is unreachable", "details": { "status": "degraded", "db": "down", … }, "requestId": "…" }`. No auth, excluded from request logs, `Cache-Control: no-store`.
