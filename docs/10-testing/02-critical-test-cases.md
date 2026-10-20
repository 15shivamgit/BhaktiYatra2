# Critical Test Cases

Priority **Must** cases block a phase exit and the release. IDs are stable; reference them in test names (`it('TC-BOOK-03 …')`).

## Auth

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-AUTH-01 | Register valid user | 201, cookie set, no passwordHash in body | Must | Int |
| TC-AUTH-02 | Register duplicate email different case | 409 EMAIL_TAKEN | Must | Int |
| TC-AUTH-03 | Login wrong password / unknown email | 401 same message both | Must | Int |
| TC-AUTH-04 | `/auth/me` without cookie | 401 | Must | Int |
| TC-AUTH-05 | Deactivated user with valid cookie | 401 | Must | Int |
| TC-AUTH-06 | Change password invalidates other sessions | old token 401, current continues | Should | Int |
| TC-AUTH-07 | Reset token single use and expiry | second use 400; expired 400 | Must | Int |
| TC-AUTH-08 | 11 login attempts in window | 429 on 11th | Must | Int |
| TC-AUTH-09 | User calls every `/admin/*` route | 403 each (table-driven) | Must | Int |
| TC-AUTH-10 | Admin cannot demote self | 403 CANNOT_MODIFY_SELF | Must | Int |
| TC-AUTH-11 | Cookie flags in production config | HttpOnly, Secure, SameSite=Lax | Must | Unit |

## Temples and content

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-TEMPLE-01 | List returns only published | drafts/archived excluded | Must | Int |
| TC-TEMPLE-02 | Filters state + deity combine | intersection only | Must | Int |
| TC-TEMPLE-03 | Text search ranks name match above description match | order asserted | Should | Int |
| TC-TEMPLE-04 | Nearby ordering and radius | fixture distances | Should | Int |
| TC-TEMPLE-05 | Publish without location/image/description/timing | 422 with each missing item | Must | Int |
| TC-TEMPLE-06 | Slug rename on published creates 301 | GET old slug → 301 to new | Must | Int |
| TC-TEMPLE-07 | Rich text `<script>` and `onerror` stripped | sanitised output | Must | Unit |
| TC-TEMPLE-08 | Upload `.exe` renamed `.jpg` | 415 | Must | Int |
| TC-TEMPLE-09 | Upload 13th image | 422 IMAGE_LIMIT | Must | Int |
| TC-TEMPLE-10 | Temple page server HTML contains title, meta, JSON-LD | present in response HTML | Must | E2E |
| TC-CONTACT-01 | Honeypot filled | 201, stored as spam, no admin email | Must | Int |

## Tours and departures

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-TOUR-01 | `fromPrice` = min bookable departure price | value asserted | Must | Int |
| TC-TOUR-02 | Month filter | only tours with departure in month | Must | Int |
| TC-TOUR-03 | Publish requires itinerary length = duration | 422 | Must | Int |
| TC-DEP-01 | Reduce totalSeats below committed | 409 BELOW_COMMITTED_SEATS | Must | Int |
| TC-DEP-02 | Increase totalSeats | seatsAvailable += delta, audit written | Must | Int |
| TC-DEP-03 | Concurrent inventory adjustments | final state consistent, no negative | Must | Int |
| TC-DEP-04 | Cancel departure with 1 pending + 1 confirmed | pending→expired seats released; confirmed→cancellation_requested | Must | Int |
| TC-DEP-05 | Departure inside cutoff | isBookable false; booking 410 | Must | Int |

## Booking and inventory

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-BOOK-01 | Create valid booking | 201, seats held, holdExpiresAt ≈ now+15m, amount from DB | Must | Int |
| TC-BOOK-02 | Client sends `amount: 1` | ignored; server amount used | Must | Int |
| TC-BOOK-03 | 20 parallel creates on 5 seats (1 seat each) | 5 × 201, 15 × 409, seatsAvailable 0 | Must | Int |
| TC-BOOK-04 | travellers.length ≠ seats | 422 | Must | Int |
| TC-BOOK-05 | 4th pending booking by same user | 409 TOO_MANY_PENDING | Must | Int |
| TC-BOOK-06 | Provider order creation throws | 502, seats restored | Must | Int |
| TC-BOOK-07 | Idempotency-Key replay | same body, one booking | Must | Int |
| TC-BOOK-08 | Expiry job | pending→expired, seats restored, full→scheduled | Must | Int |
| TC-BOOK-09 | Expiry job run twice concurrently | seats restored once | Must | Int |
| TC-BOOK-10 | User cancels pending | cancelled, seats restored | Must | Int |
| TC-BOOK-11 | Other user GET booking by reference | 404 | Must | Int |
| TC-BOOK-12 | Every disallowed transition | 409 INVALID_TRANSITION (table-driven) | Must | Unit |
| TC-BOOK-13 | Reconciliation detects injected drift | mismatch reported | Must | Int |

## Payments

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-PAY-01 | Verify with valid signature | confirmed, Payment captured, audit + notification once | Must | Int |
| TC-PAY-02 | Verify with tampered signature | 400, booking pending | Must | Int |
| TC-PAY-03 | Verify by non-owner | 404 | Must | Int |
| TC-PAY-04 | Webhook bad signature | 400, no change | Must | Int |
| TC-PAY-05 | Webhook then verify | one confirmation; verify returns already_confirmed | Must | Int |
| TC-PAY-06 | Verify then webhook | one confirmation; webhook no-op | Must | Int |
| TC-PAY-07 | Same webhook event twice | second 200 no-op | Must | Int |
| TC-PAY-08 | Capture after expiry, seats available | confirmed_late, seats re-held | Must | Int |
| TC-PAY-09 | Capture after expiry, no seats | payment_received_no_seats, admin alert | Must | Int |
| TC-PAY-10 | Amount mismatch from provider fetch | 409 AMOUNT_MISMATCH, not confirmed | Must | Int |
| TC-PAY-11 | payment.failed webhook | Payment failed, booking pending | Must | Int |
| TC-PAY-12 | Payment UI with verify endpoint blocked | reaches pending message ≤ 60 s | Must | E2E |

## Documents and email

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-DOC-01 | Confirmation generates ticket + invoice | both ids set; PDFs contain reference | Must | Int |
| TC-DOC-02 | QR token verify valid/tampered/cancelled | valid true / false with reason | Must | Int |
| TC-DOC-03 | 50 parallel invoice numbers | unique, contiguous | Must | Int |
| TC-DOC-04 | Download matrix owner/other/admin/guest | 200/404/200/401 | Must | Int |
| TC-DOC-05 | Email job dedupe concurrent runs | one send | Must | Int |
| TC-DOC-06 | SMTP failure backoff | attempts 3, status failed, booking confirmed | Must | Int |
| TC-DOC-07 | Verify endpoint exposes no traveller names | asserted absent | Must | Int |

## Admin

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-ADMIN-01 | Dashboard revenue = Σ captured payments − refunds | value asserted | Must | Int |
| TC-ADMIN-02 | Manual mark-paid without reason | 422 REASON_REQUIRED | Must | Int |
| TC-ADMIN-03 | Admin cancel confirmed with refund | cancelled, seats released, paymentStatus updated, audit | Must | Int |
| TC-ADMIN-04 | CSV export columns and BOM | asserted | Should | Int |
| TC-ADMIN-05 | Every admin mutation writes audit | audit count per action | Must | Int |

## Security

| ID | Case | Expected | Pri | Level |
|---|---|---|---|---|
| TC-SEC-01 | CORS from unlisted origin | no ACAO header; browser blocked | Must | Int |
| TC-SEC-02 | POST with foreign Origin and valid cookie | 403 | Must | Int |
| TC-SEC-03 | NoSQL injection `{"email":{"$gt":""}}` | 422 | Must | Int |
| TC-SEC-04 | Error responses contain no stack/Mongo text | asserted | Must | Int |
| TC-SEC-05 | Logs redact cookie/password | log capture asserted | Must | Unit |
| TC-SEC-06 | gitleaks on repo | clean | Must | CI |
