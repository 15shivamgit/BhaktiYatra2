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

## GET /admin/audit-logs
Query: `actor`, `action` (prefix match, e.g. `booking.`), `entityType`, `entityId`, `from`, `to`, `page`, `limit`  
200: entries with `actor: { id, name, email } | null`.

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

## Health

### GET /health  (public)
200 `{ "success": true, "data": { "status": "ok", "version": "1.0.0", "uptimeSec": 1234, "db": "up", "time": "…" } }`  
503 when Mongo ping fails, using the error envelope with the report in `details`:
`{ "success": false, "code": "SERVICE_UNAVAILABLE", "message": "Database is unreachable", "details": { "status": "degraded", "db": "down", … }, "requestId": "…" }`. No auth, excluded from request logs, `Cache-Control: no-store`.
