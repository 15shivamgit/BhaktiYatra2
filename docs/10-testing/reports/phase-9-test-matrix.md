# Phase 9: critical test case traceability

Generated on 2026-10-21 by searching the test files for each ID in `02-critical-test-cases.md`. Every case below is linked to at least one automated test; all of these ran green in the Phase 9 runs (backend Vitest, frontend Vitest, Playwright) and run in CI on every push.

| ID | Priority | Level | Case | Covered by |
|---|---|---|---|---|
| TC-AUTH-01 | Must | Int | Register valid user | `backend/tests/integration/auth.test.js` |
| TC-AUTH-02 | Must | Int | Register duplicate email different case | `backend/tests/integration/auth.test.js` |
| TC-AUTH-03 | Must | Int | Login wrong password / unknown email | `backend/tests/integration/auth.test.js` |
| TC-AUTH-04 | Must | Int | `/auth/me` without cookie | `backend/tests/integration/auth.test.js` |
| TC-AUTH-05 | Must | Int | Deactivated user with valid cookie | `backend/tests/integration/auth.test.js` |
| TC-AUTH-06 | Should | Int | Change password invalidates other sessions | `backend/tests/integration/auth.test.js` |
| TC-AUTH-07 | Must | Int | Reset token single use and expiry | `backend/tests/integration/auth.test.js` |
| TC-AUTH-08 | Must | Int | 11 login attempts in window | `backend/tests/integration/security.test.js` |
| TC-AUTH-09 | Must | Int | User calls every `/admin/*` route | `backend/tests/integration/admin-users.test.js` |
| TC-AUTH-10 | Must | Int | Admin cannot demote self | `backend/tests/integration/admin-users.test.js` |
| TC-AUTH-11 | Must | Unit | Cookie flags in production config | `backend/tests/unit/session.test.js` |
| TC-TEMPLE-01 | Must | Int | List returns only published | `backend/tests/integration/temples-public.test.js` |
| TC-TEMPLE-02 | Must | Int | Filters state + deity combine | `backend/tests/integration/temples-public.test.js` |
| TC-TEMPLE-03 | Should | Int | Text search ranks name match above description match | `backend/tests/integration/temples-public.test.js` |
| TC-TEMPLE-04 | Should | Int | Nearby ordering and radius | `backend/tests/integration/temples-public.test.js` |
| TC-TEMPLE-05 | Must | Int | Publish without location/image/description/timing | `backend/tests/integration/temples-admin.test.js` |
| TC-TEMPLE-06 | Must | Int | Slug rename on published creates 301 | `backend/tests/integration/temples-admin.test.js` |
| TC-TEMPLE-07 | Must | Unit | Rich text `<script>` and `onerror` stripped | `backend/tests/integration/temples-admin.test.js` |
| TC-TEMPLE-08 | Must | Int | Upload `.exe` renamed `.jpg` | `backend/tests/integration/temples-admin.test.js` |
| TC-TEMPLE-09 | Must | Int | Upload 13th image | `backend/tests/integration/temples-admin.test.js` |
| TC-TEMPLE-10 | Must | E2E | Temple page server HTML contains title, meta, JSON-LD | `frontend/e2e/explore.spec.js` |
| TC-CONTACT-01 | Must | Int | Honeypot filled | `backend/tests/integration/circuits-contacts.test.js` |
| TC-TOUR-01 | Must | Int | `fromPrice` = min bookable departure price | `backend/tests/integration/tours-public.test.js` |
| TC-TOUR-02 | Must | Int | Month filter | `backend/tests/integration/tours-public.test.js` |
| TC-TOUR-03 | Must | Int | Publish requires itinerary length = duration | `backend/tests/integration/tours-admin.test.js` |
| TC-DEP-01 | Must | Int | Reduce totalSeats below committed | `backend/tests/integration/tours-admin.test.js` |
| TC-DEP-02 | Must | Int | Increase totalSeats | `backend/tests/integration/tours-admin.test.js` |
| TC-DEP-03 | Must | Int | Concurrent inventory adjustments | `backend/tests/integration/tours-admin.test.js` |
| TC-DEP-04 | Must | Int | Cancel departure with 1 pending + 1 confirmed | `backend/tests/integration/tours-admin.test.js` |
| TC-DEP-05 | Must | Int | Departure inside cutoff | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-01 | Must | Int | Create valid booking | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-02 | Must | Int | Client sends `amount: 1` | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-03 | Must | Int | 20 parallel creates on 5 seats (1 seat each) | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-04 | Must | Int | travellers.length ≠ seats | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-05 | Must | Int | 4th pending booking by same user | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-06 | Must | Int | Provider order creation throws | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-07 | Must | Int | Idempotency-Key replay | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-08 | Must | Int | Expiry job | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-09 | Must | Int | Expiry job run twice concurrently | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-10 | Must | Int | User cancels pending | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-11 | Must | Int | Other user GET booking by reference | `backend/tests/integration/bookings.test.js` |
| TC-BOOK-12 | Must | Unit | Every disallowed transition | `backend/tests/unit/bookings-logic.test.js` |
| TC-BOOK-13 | Must | Int | Reconciliation detects injected drift | `backend/tests/integration/bookings.test.js` |
| TC-PAY-01 | Must | Int | Verify with valid signature | `backend/tests/integration/payments.test.js` |
| TC-PAY-02 | Must | Int | Verify with tampered signature | `backend/tests/integration/payments.test.js` |
| TC-PAY-03 | Must | Int | Verify by non-owner | `backend/tests/integration/payments.test.js` |
| TC-PAY-04 | Must | Int | Webhook bad signature | `backend/tests/integration/payments.test.js` |
| TC-PAY-05 | Must | Int | Webhook then verify | `backend/tests/integration/payments.test.js` |
| TC-PAY-06 | Must | Int | Verify then webhook | `backend/tests/integration/payments.test.js` |
| TC-PAY-07 | Must | Int | Same webhook event twice | `backend/tests/integration/payments.test.js` |
| TC-PAY-08 | Must | Int | Capture after expiry, seats available | `backend/tests/integration/payments.test.js` |
| TC-PAY-09 | Must | Int | Capture after expiry, no seats | `backend/tests/integration/payments.test.js` |
| TC-PAY-10 | Must | Int | Amount mismatch from provider fetch | `backend/tests/integration/payments.test.js` |
| TC-PAY-11 | Must | Int | payment.failed webhook | `backend/tests/integration/payments.test.js` |
| TC-PAY-12 | Must | E2E | Payment UI with verify endpoint blocked | `frontend/e2e/bookings.spec.js` |
| TC-DOC-01 | Must | Int | Confirmation generates ticket + invoice | `backend/tests/integration/documents-email.test.js` |
| TC-DOC-02 | Must | Int | QR token verify valid/tampered/cancelled | `backend/tests/integration/documents-email.test.js` |
| TC-DOC-03 | Must | Int | 50 parallel invoice numbers | `backend/tests/integration/documents-email.test.js` |
| TC-DOC-04 | Must | Int | Download matrix owner/other/admin/guest | `backend/tests/integration/documents-email.test.js` |
| TC-DOC-05 | Must | Int | Email job dedupe concurrent runs | `backend/tests/integration/documents-email.test.js` |
| TC-DOC-06 | Must | Int | SMTP failure backoff | `backend/tests/integration/documents-email.test.js` |
| TC-DOC-07 | Must | Int | Verify endpoint exposes no traveller names | `backend/tests/integration/documents-email.test.js` |
| TC-ADMIN-01 | Must | Int | Dashboard revenue = Σ captured payments − refunds | `backend/tests/integration/admin-ops.test.js` |
| TC-ADMIN-02 | Must | Int | Manual mark-paid without reason | `backend/tests/integration/admin-ops.test.js` |
| TC-ADMIN-03 | Must | Int | Admin cancel confirmed with refund | `backend/tests/integration/admin-ops.test.js` |
| TC-ADMIN-04 | Should | Int | CSV export columns and BOM | `backend/tests/integration/admin-ops.test.js` |
| TC-ADMIN-05 | Must | Int | Every admin mutation writes audit | `backend/tests/integration/admin-ops.test.js` |
| TC-SEC-01 | Must | Int | CORS from unlisted origin | `backend/tests/integration/security.test.js` |
| TC-SEC-02 | Must | Int | POST with foreign Origin and valid cookie | `backend/tests/integration/security.test.js` |
| TC-SEC-03 | Must | Int | NoSQL injection `{"email":{"$gt":""}}` | `backend/tests/integration/auth.test.js` |
| TC-SEC-04 | Must | Int | Error responses contain no stack/Mongo text | `backend/tests/integration/errors.test.js` |
| TC-SEC-05 | Must | Unit | Logs redact cookie/password | `backend/tests/unit/logger.test.js` |
| TC-SEC-06 | Must | CI | gitleaks on repo | `.github/workflows/ci.yml (secrets-scan job, gitleaks)` |

Totals: 73 cases, 69 Must, 69 Must covered.
