# API Conventions

Base URL: `{API_BASE_URL}/api/v1`. All examples omit the prefix.

## Envelope

Success:
```json
{ "success": true, "data": { }, "message": "optional human text", "meta": { "page": 1, "limit": 12, "total": 143, "totalPages": 12 } }
```

Error:
```json
{ "success": false, "code": "VALIDATION_ERROR", "message": "Human-readable summary", "details": [ { "path": "travellers.1.age", "message": "Must be at least 1" } ], "requestId": "a1b2c3" }
```

`details` only for validation errors. `requestId` always present on errors.

## HTTP status codes

| Status | When | Code examples |
|---|---|---|
| 200 | Read or update succeeded | |
| 201 | Resource created | |
| 204 | Deleted / no body | |
| 400 | Malformed request (bad JSON, bad ObjectId) | `BAD_REQUEST` |
| 401 | Not authenticated or session invalid | `UNAUTHENTICATED`, `SESSION_EXPIRED` |
| 403 | Authenticated but not allowed | `FORBIDDEN`, `ADMIN_ONLY` |
| 404 | Not found or not visible to caller | `NOT_FOUND` |
| 409 | State conflict | `SEATS_UNAVAILABLE`, `BOOKING_NOT_PENDING`, `SLUG_TAKEN`, `EMAIL_TAKEN`, `INVALID_TRANSITION` |
| 410 | Gone | `HOLD_EXPIRED`, `DEPARTURE_CLOSED` |
| 413 | Upload too large | `PAYLOAD_TOO_LARGE` |
| 415 | Unsupported file type | `UNSUPPORTED_MEDIA_TYPE` |
| 422 | Validation failed | `VALIDATION_ERROR` |
| 429 | Rate limited | `RATE_LIMITED` |
| 500 | Unexpected | `INTERNAL_ERROR` |
| 502 | Provider failure (Razorpay, Cloudinary, SMTP) | `PROVIDER_ERROR` |
| 503 | DB down (health) | `SERVICE_UNAVAILABLE` |

Never return 200 with `success: false`.

## Authentication

- Cookie `by_session` set by `/auth/login` and `/auth/register`. Clients send `credentials: 'include'`.
- Server-side fetches from Next.js for public data send no cookie. For user data they forward the incoming `Cookie` header.
- Admin routes additionally require `role: admin`.

## Pagination, sorting, filtering

- Query: `page` (default 1), `limit` (default 12, max 50), `sort` (allowed values per endpoint, prefix `-` for descending, e.g. `sort=-publishedAt`).
- Filters are explicit query params listed per endpoint; unknown params are stripped.
- Response `meta` carries pagination.

## Field selection and population

- Public list endpoints return a **card shape** (subset). Detail endpoints return the full public shape.
- Admin endpoints return full documents including status and audit fields.
- Populated references are returned as nested objects with a documented subset; never deep-populate more than one level.

## IDs and slugs

- Public read endpoints use **slugs** for temples, circuits and tours, and **booking reference** for bookings.
- Admin write endpoints use **ObjectIds**.

## Dates and money

- Dates: ISO 8601 UTC strings in JSON. Date-only concepts (departure start) are still full ISO strings at 00:00 IST.
- Money: integer INR. Field names end in `Price` or `Amount`. Paise never appear in the API except `amountPaise` in the order-creation response for Razorpay Checkout.

## Idempotency

- `POST /bookings` accepts an optional `Idempotency-Key` header (UUID). Same key within 10 minutes returns the original response.
- `POST /payments/verify` and webhooks are naturally idempotent by payment id.

## Versioning

- `/api/v1` is stable for v1. Breaking changes go to `/api/v2`. Additive changes (new optional fields) are allowed in v1.

## Headers

- `X-Request-Id` on every response (generated or echoed).
- `Cache-Control: public, max-age=60, stale-while-revalidate=300` on public GET list/detail; `no-store` on everything authenticated.

## Validation

Each route declares `schemas = { params, query, body }` with Zod. The `validate` middleware parses, strips unknowns, coerces query types and attaches `req.valid`. Error → 422 with `details`.

## Documentation format for endpoint files

Each endpoint lists: method and path, auth, purpose, request (params/query/body with types), success response shape and status, error codes, notes. Keep examples minimal and realistic.
