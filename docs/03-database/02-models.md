# Data Models

Field tables use: **type**, **required** (R) / optional (O), default, notes. All models have `createdAt` and `updatedAt` via `{ timestamps: true }` unless stated. Enum values are the canonical strings used in code, API and UI.

---

## User (`users`)

| Field | Type | R/O | Default | Notes |
|---|---|---|---|---|
| name | String (2–80) | R | | trimmed |
| email | String | R | | lowercase, trimmed, unique, valid email |
| passwordHash | String | R | | bcrypt; `select: false` |
| phone | String | O | | E.164 or 10-digit Indian; normalised to `+91XXXXXXXXXX` |
| role | Enum `user` \| `admin` | R | `user` | |
| isActive | Boolean | R | `true` | |
| emailVerifiedAt | Date | O | | reserved; not enforced in v1 |
| lastLoginAt | Date | O | | |
| tokenInvalidBefore | Date | O | | tokens issued before this are rejected |
| passwordReset | `{ tokenHash, expiresAt }` | O | | cleared after use |

Serialisation: `toJSON` removes `passwordHash`, `passwordReset`, `tokenInvalidBefore`, `__v`.

---

## Temple (`temples`)

| Field | Type | R/O | Default | Notes |
|---|---|---|---|---|
| name | String (2–120) | R | | |
| slug | String | R | auto | `slugify(name + '-' + city)`, unique, editable |
| deity | String | R | | free text but suggested list in UI (Shiva, Vishnu, Devi, Krishna, Rama, Hanuman, Ganesha, Murugan, Surya, Jain Tirthankara, Other) |
| religion | Enum `hindu` \| `jain` \| `sikh` \| `buddhist` \| `other` | R | `hindu` | |
| state | String | R | | from fixed list of Indian states/UTs |
| city | String | R | | |
| district | String | O | | |
| address | String | O | | |
| pincode | String | O | | 6 digits |
| location | GeoJSON Point `{ type:'Point', coordinates:[lng, lat] }` | O | | `2dsphere` index; required to publish |
| shortDescription | String (≤ 300) | R | | plain text, used in cards and meta |
| description | String (HTML) | R | | sanitised; the main overview |
| history | String (HTML) | O | | |
| significance | String (HTML) | O | | |
| timings | `[{ label: String, open: 'HH:mm', close: 'HH:mm', note: String }]` | O | `[]` | e.g. Morning 04:00–11:00 |
| aartiSchedule | `[{ name: String, time: 'HH:mm', note: String }]` | O | `[]` | |
| festivals | `[{ name: String, month: 1–12 \| null, description: String }]` | O | `[]` | |
| bestTimeToVisit | String | O | | |
| howToReach | `{ nearestAirport, nearestRailway, nearestBusStand, byRoad: String }` | O | | each ≤ 300 chars |
| rules | [String] | O | `[]` | dress code, photography, etc. |
| entryFee | String | O | `'Free'` | free text ("Free", "₹50 special darshan") |
| officialWebsite | URL | O | | |
| darshanBookingUrl | URL | O | | |
| contactPhone | String | O | | |
| images | `[{ url, publicId, alt, width, height, isPrimary, order }]` | O | `[]` | ≤ 12; exactly one `isPrimary` when non-empty; required ≥ 1 to publish |
| tags | [String] | O | `[]` | lowercase keywords for search |
| featured | Boolean | R | `false` | |
| status | Enum `draft` \| `published` \| `archived` | R | `draft` | |
| publishedAt | Date | O | | set on first publish |
| seo | `{ title (≤ 60), description (≤ 160) }` | O | | fallback to name/shortDescription |
| viewCount | Number | R | `0` | incremented async, not transactional |
| createdBy / updatedBy | ObjectId → User | O | | |

Publish validation (service-level): `location`, ≥ 1 image, `description` ≥ 200 chars, at least one timing entry.

---

## Circuit (`circuits`)

| Field | Type | R/O | Default | Notes |
|---|---|---|---|---|
| name | String | R | | e.g. "Char Dham" |
| slug | String | R | auto | unique |
| shortDescription | String (≤ 300) | R | | |
| description | String (HTML) | O | | |
| temples | [ObjectId → Temple] | R | `[]` | ordered; ≥ 2 to publish |
| image | `{ url, publicId, alt }` | O | | |
| region | String | O | | e.g. "Uttarakhand", "Pan-India" |
| featured | Boolean | R | `false` | |
| status | Enum `draft` \| `published` \| `archived` | R | `draft` | |
| seo | `{ title, description }` | O | | |

---

## SlugRedirect (`slugredirects`)

| Field | Type | Notes |
|---|---|---|
| entityType | Enum `temple` \| `circuit` \| `tour` | |
| fromSlug | String | unique with entityType |
| toSlug | String | |
| createdAt | Date | |

---

## Tour (`tours`)

| Field | Type | R/O | Default | Notes |
|---|---|---|---|---|
| title | String (4–120) | R | | |
| slug | String | R | auto | unique |
| summary | String (≤ 300) | R | | cards and meta |
| description | String (HTML) | R | | |
| highlights | [String] | O | `[]` | ≤ 8 bullets |
| temples | [ObjectId → Temple] | O | `[]` | temples covered |
| destinations | [String] | R | | display list, e.g. ["Haridwar", "Kedarnath", "Badrinath"] |
| durationDays | Int ≥ 1 | R | | |
| durationNights | Int ≥ 0 | R | `durationDays - 1` | |
| itinerary | `[{ day: Int, title: String, description: String (HTML), meals: [String], stay: String }]` | R | | length must equal `durationDays` to publish |
| inclusions | [String] | R | `[]` | |
| exclusions | [String] | R | `[]` | |
| pickupCities | [String] | R | | ≥ 1 |
| basePrice | Int ≥ 1 (INR) | R | | default departure price |
| currency | String | R | `'INR'` | |
| images | same shape as Temple.images | O | `[]` | ≥ 1 to publish |
| faqs | `[{ question, answer }]` | O | `[]` | |
| featured | Boolean | R | `false` | |
| status | Enum `draft` \| `published` \| `archived` | R | `draft` | |
| publishedAt | Date | O | | |
| seo | `{ title, description }` | O | | |
| createdBy / updatedBy | ObjectId → User | O | | |

---

## TourDeparture (`tourdepartures`)

| Field | Type | R/O | Default | Notes |
|---|---|---|---|---|
| tour | ObjectId → Tour | R | | |
| startDate | Date | R | | midnight IST; must be ≥ today to create |
| endDate | Date | R | `startDate + durationDays - 1` | editable |
| pickupCity | String | O | | one of tour.pickupCities; null = all |
| price | Int ≥ 1 | R | `tour.basePrice` | per seat |
| totalSeats | Int 1–200 | R | | |
| seatsAvailable | Int ≥ 0 | R | `totalSeats` | **only mutated atomically by the inventory service** |
| status | Enum `scheduled` \| `full` \| `completed` \| `cancelled` | R | `scheduled` | `full` is derived and set when `seatsAvailable` hits 0; `completed` set by job after endDate |
| bookingCutoffHours | Int | R | `24` | from constants |
| pickupInstructions | String (≤ 500) | O | | public; printed on ticket (place, reporting time) |
| notes | String | O | | internal |
| createdBy / updatedBy | ObjectId → User | O | | |

Invariant (checked by reconciliation job): `totalSeats = seatsAvailable + Σ seats(bookings where bookingStatus ∈ {pending, confirmed, cancellation_requested})`.

---

## Booking (`bookings`)

| Field | Type | R/O | Default | Notes |
|---|---|---|---|---|
| bookingReference | String | R | generated | `BY-YYYYMMDD-XXXXX`, unique |
| user | ObjectId → User | R | | |
| tour | ObjectId → Tour | R | | |
| departure | ObjectId → TourDeparture | R | | |
| snapshot | `{ tourTitle, tourSlug, startDate, endDate, pickupCity, durationDays }` | R | | copied at creation |
| contact | `{ name, email, phone }` | R | | primary contact; defaults from user |
| travellers | `[{ name (2–80), age (1–120), gender: 'male'\|'female'\|'other' }]` | R | | length === seats |
| seats | Int 1–10 | R | | |
| unitPrice | Int | R | | departure.price at creation |
| amount | Int | R | | `unitPrice × seats` |
| currency | String | R | `'INR'` | |
| bookingStatus | Enum `pending` \| `confirmed` \| `cancelled` \| `expired` \| `cancellation_requested` \| `payment_received_no_seats` | R | `pending` | |
| paymentStatus | Enum `pending` \| `paid` \| `failed` \| `refunded` \| `partially_refunded` | R | `pending` | |
| razorpayOrderId | String | O | | set at creation; indexed |
| holdExpiresAt | Date | R | now + 15 min | only meaningful while `pending` |
| confirmedAt | Date | O | | |
| cancelledAt | Date | O | | |
| cancellation | `{ requestedAt, reason, departureCancelled: Boolean, processedBy, refundAmount, refundReference, refundedAt }` | O | | `departureCancelled` true when caused by admin cancelling the departure |
| ticket | `{ publicId, generatedAt, token }` | O | | Cloudinary raw + QR token |
| invoice | `{ number, publicId, generatedAt }` | O | | `INV-YYYY-NNNNNN` |
| notes | `[{ by: ObjectId, at: Date, text: String }]` | O | `[]` | admin internal |
| timeline | `[{ at: Date, event: String, by: ObjectId \| 'system', meta: Object }]` | R | `[]` | human-readable status history |

Status transitions: see `05-features/04-booking-inventory.md`.

---

## Payment (`payments`)

| Field | Type | R/O | Default | Notes |
|---|---|---|---|---|
| booking | ObjectId → Booking | R | | |
| provider | Enum `razorpay` | R | `razorpay` | |
| providerOrderId | String | R | | |
| providerPaymentId | String | O | | **unique, sparse** — idempotency key |
| amount | Int | R | | INR; must equal booking.amount |
| amountPaise | Int | R | | as sent to provider |
| currency | String | R | `'INR'` | |
| status | Enum `created` \| `authorized` \| `captured` \| `failed` \| `refunded` | R | `created` | |
| method | String | O | | upi/card/netbanking from provider |
| signatureVerified | Boolean | R | `false` | |
| verifiedVia | Enum `client` \| `webhook` \| `manual` | O | | |
| webhookEventIds | [String] | O | `[]` | processed event ids |
| failureReason | String | O | | |
| refund | `{ providerRefundId, amount, status, at }` | O | | |
| rawSnapshot | Object | O | | minimal provider payload (no card data) |

---

## Contact (`contacts`)

| Field | Type | R/O | Notes |
|---|---|---|---|
| name | String | R | |
| email | String | R | |
| phone | String | O | |
| subject | String | O | |
| message | String (10–2000) | R | |
| status | Enum `new` \| `read` \| `replied` \| `spam` | R `new` | |
| ip | String | O | hashed |

---

## AuditLog (`auditlogs`)

| Field | Type | Notes |
|---|---|---|
| actor | ObjectId → User \| null | null = system |
| actorRole | String | |
| action | String | dotted, e.g. `booking.status.change`, `departure.inventory.update` |
| entityType | String | `Temple`, `Tour`, `TourDeparture`, `Booking`, `Payment`, `User` |
| entityId | ObjectId | |
| before | Object | minimal diff |
| after | Object | minimal diff |
| reason | String | required for manual payment actions |
| ip, requestId | String | |
| createdAt | Date | no updatedAt; collection is append-only |

---

## NotificationLog (`notificationlogs`)

| Field | Type | Notes |
|---|---|---|
| type | Enum `welcome` \| `booking_confirmed` \| `booking_cancelled` \| `payment_failed` \| `password_reset` \| `cancellation_requested_admin` \| `payment_received_no_seats` \| `contact_received_admin` \| `departure_cancelled` | |
| dedupeKey | String | unique, e.g. `booking_confirmed:<bookingId>` |
| to | String | email |
| booking | ObjectId → Booking | optional |
| payload | Object | template data |
| status | Enum `pending` \| `sent` \| `failed` | |
| attempts | Int | default 0 |
| nextAttemptAt | Date | backoff: 1 min, 5 min, 30 min |
| lastError | String | |
| sentAt | Date | |

---

## Counter (`counters`)

| Field | Type | Notes |
|---|---|---|
| _id | String | e.g. `invoice-2026` |
| seq | Int | atomic `$inc` |

Invoice number: `INV-${year}-${String(seq).padStart(6,'0')}`.
