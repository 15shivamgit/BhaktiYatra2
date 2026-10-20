# Indexes, Constraints and Integrity Rules

## Indexes

| Collection | Index | Type | Purpose |
|---|---|---|---|
| users | `{ email: 1 }` | unique | login, uniqueness |
| users | `{ googleId: 1 }` | unique, sparse | Google sign-in |
| users | `{ 'passwordReset.tokenHash': 1 }` | sparse | reset-token lookup |
| users | `{ role: 1, isActive: 1 }` | | admin user list |
| temples | `{ slug: 1 }` | unique | detail lookup |
| temples | `{ status: 1, featured: -1, publishedAt: -1 }` | | public listing |
| temples | `{ status: 1, state: 1 }` | | state filter |
| temples | `{ status: 1, deity: 1 }` | | deity filter |
| temples | `{ location: '2dsphere' }` | geo | nearby, map bounds |
| temples | `{ name: 'text', city: 'text', deity: 'text', tags: 'text', shortDescription: 'text' }` with weights name 10, city 5, deity 5, tags 3, shortDescription 1 | text | search |
| circuits | `{ slug: 1 }` | unique | |
| circuits | `{ status: 1, featured: -1 }` | | |
| circuits | `{ temples: 1 }` | | "circuits containing temple" |
| slugredirects | `{ entityType: 1, fromSlug: 1 }` | unique | |
| tours | `{ slug: 1 }` | unique | |
| tours | `{ status: 1, featured: -1, publishedAt: -1 }` | | |
| tours | `{ temples: 1 }` | | tours covering temple |
| tours | `{ title: 'text', destinations: 'text', summary: 'text' }` | text | search |
| tourdepartures | `{ tour: 1, startDate: 1 }` | | tour page departures |
| tourdepartures | `{ status: 1, startDate: 1 }` | | upcoming lists, completion job |
| bookings | `{ bookingReference: 1 }` | unique | |
| bookings | `{ user: 1, createdAt: -1 }` | | my bookings |
| bookings | `{ departure: 1, bookingStatus: 1 }` | | reconciliation, departure detail |
| bookings | `{ razorpayOrderId: 1 }` | | webhook lookup |
| bookings | `{ bookingStatus: 1, holdExpiresAt: 1 }` | | hold expiry job |
| bookings | `{ 'contact.email': 1 }`, `{ 'contact.phone': 1 }` | | admin search |
| bookings | `{ createdAt: -1 }` | | admin list |
| payments | `{ providerPaymentId: 1 }` | unique, sparse | idempotency |
| payments | `{ booking: 1, createdAt: -1 }` | | |
| payments | `{ providerOrderId: 1 }` | | |
| contacts | `{ status: 1, createdAt: -1 }` | | |
| auditlogs | `{ entityType: 1, entityId: 1, createdAt: -1 }` | | entity history |
| auditlogs | `{ actor: 1, createdAt: -1 }` | | |
| auditlogs | `{ createdAt: -1 }` | | recent activity |
| notificationlogs | `{ dedupeKey: 1 }` | unique | no duplicate emails |
| notificationlogs | `{ status: 1, nextAttemptAt: 1 }` | | retry job |

Index creation: Mongoose `autoIndex` true in development and test; in production, `npm run db:sync-indexes` runs `Model.syncIndexes()` for each model as a release step.

## Constraints enforced by code (not by MongoDB)

| Rule | Where enforced |
|---|---|
| Email unique case-insensitive | lowercase on save + unique index |
| Exactly one primary image | temple/tour service on image mutation |
| `travellers.length === seats` | Zod schema + service |
| `amount === unitPrice × seats` | service computes; client values ignored |
| `seatsAvailable ≥ 0` | atomic update guard `{ seatsAvailable: { $gte: seats } }` |
| `totalSeats` reduction ≥ held + confirmed | departure service |
| Only allowed status transitions | booking service state machine |
| One confirmation per payment id | unique sparse index + conditional update `{ paymentStatus: 'pending' }` |
| Slug uniqueness across renames | unique index + SlugRedirect creation |
| Publish prerequisites | publish service checks (`03-database/02-models.md`) |
| Invoice number sequential | `Counter` with `findOneAndUpdate({ $inc })`, `upsert: true` |

## Transactions

Used (Atlas replica set) for:
- Booking confirmation: update Payment, update Booking, write AuditLog, write NotificationLog.
- Hold expiry: update Booking to `expired` and increment departure seats (per booking, in a loop; each iteration its own transaction).
- Admin cancellation: update Booking, increment seats, AuditLog.

Not used for: booking creation seat hold (single atomic `findOneAndUpdate` on departure, then create Booking; on Booking create failure, compensate by incrementing seats back).

## Data integrity jobs

| Job | Schedule | Action |
|---|---|---|
| expire-holds | every minute | `bookings` where `bookingStatus: 'pending'`, `holdExpiresAt < now` → `expired`, release seats, timeline entry |
| retry-emails | every minute | `notificationlogs` `pending`/`failed` with `attempts < 3` and `nextAttemptAt <= now` |
| complete-departures | hourly | `tourdepartures` `scheduled`/`full` with `endDate < now` → `completed` |
| reconcile-inventory | hourly | recompute invariant per active departure; log discrepancies to Sentry with departure id; never auto-fix in v1 |

## Retention

- `auditlogs`: keep indefinitely.
- `notificationlogs`: TTL index on `sentAt` 90 days (Should).
- `bookings` `expired`: keep 90 days then archive/delete by script (documented in ops).
