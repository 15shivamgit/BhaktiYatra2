# Feature: Tickets, Invoices and Email

Requirements: FR-DOC-01…06. Phase 7.

## Trigger

`confirmBooking` commits → emits `booking.confirmed` (in-process event) → `documents.service.generateForBooking(bookingId)` → on success updates `booking.ticket` and `booking.invoice` → `notifications.service.enqueue('booking_confirmed', …)` (NotificationLog already created in the transaction with status `pending`, payload updated with document ids) → email job sends with attachments.

If document generation fails, the booking stays confirmed; the NotificationLog remains `pending` with `lastError`; the retry job retries generation + send; admin alert after 3 failures.

## Ticket PDF

A5 portrait (or A4 with a tear-off look), single page per booking.

Content:
- Header: BhaktiYatra wordmark, "E-Ticket", booking reference large, status "CONFIRMED".
- Tour block: title, destinations, dates (start–end, IST), duration, pickup city, pickup instructions from `departure.pickupInstructions` when set (`notes` stay internal).
- Travellers table: #, name, age, gender.
- Payment block: seats × unit price, total paid, payment reference (Razorpay payment id), paid at.
- QR code (right side) encoding `${SITE_URL}/verify/${ticketToken}`; below it "Scan to verify".
- Footer: support email/phone, "Carry a government photo ID", cancellation policy one-liner, issue timestamp, page 1/1.
- Fonts: bundled Noto Sans (supports ₹); Devanagari later.

Ticket token: JWT `{ ref, dep, iat, exp = startDate + 7d }` signed with `TICKET_SIGNING_SECRET`. Stored on booking for regeneration.

## Invoice PDF

A4 portrait.
- "Tax Invoice" only when tax enabled; otherwise "Invoice / Payment Receipt".
- Invoice number `INV-YYYY-NNNNNN` (Counter per year), invoice date = confirmedAt.
- Seller block from settings (legal name, address, email, phone, GSTIN if set).
- Bill to: contact name, email, phone.
- Line: "<Tour title> — departure <date> — <seats> seat(s) @ ₹<unitPrice>" → amount.
- Totals: Subtotal, (Tax lines only if enabled), Total paid, Payment method/reference.
- Note: "This is a computer-generated document."

Regeneration keeps the same invoice number.

## Verification page (frontend)

`/verify/[token]` → calls `GET /tickets/verify/:token` → shows big green "Valid" or red "Invalid/Cancelled" with reference, tour, date, seats, traveller count. No personal names. Works without login. Suitable for a staff member scanning at pickup.

## Email

Provider: Nodemailer SMTP (Brevo). Templates in `backend/src/modules/notifications/templates/<type>.{html.hbs,txt.hbs,subject.txt}` (handlebars). Shared layout with logo, footer, unsubscribe note not required for transactional mail.

| Type | Trigger | To | Attachments |
|---|---|---|---|
| `welcome` | register | user | — |
| `booking_confirmed` | confirmBooking | contact.email (+ user.email if different) | ticket.pdf, invoice.pdf |
| `payment_failed` | webhook payment.failed | contact.email | — (Should) |
| `booking_cancelled` | admin cancel / user cancel pending (Should for pending) | contact.email | — |
| `cancellation_requested_admin` | user requests | ADMIN_NOTIFY_EMAIL | — |
| `payment_received_no_seats` | late payment no seats | contact.email + admin | — |
| `password_reset` | forgot password | user | — |
| `contact_received_admin` | contact form | admin | — (Should) |
| `departure_cancelled` | admin cancels departure | each affected contact | — (Should) |

Rules:
- Enqueue only (never send inline in a request). NotificationLog with `dedupeKey` prevents duplicates (`booking_confirmed:<bookingId>`).
- Job every minute: pick `pending|failed` with `attempts < 3` and `nextAttemptAt <= now`, mark `sending` via conditional update to avoid double pickup, send, set `sent|failed` with backoff 1/5/30 min.
- Attachments fetched from Cloudinary server-side at send time.
- Subject prefix `[STAGING]` when `NODE_ENV=staging`.
- Plain-text part always generated.
- Logging: type, dedupeKey, to (masked `s***a@example.com`), attempt, result.
- Admin "Resend confirmation" creates a new log with a unique key.

## Edge cases

| Case | Behaviour |
|---|---|
| SMTP down | Retries, dashboard alert count; booking unaffected |
| Cloudinary down at generation | Generation retried by same job; email waits |
| Contact email bounces | Brevo webhook (Should) marks log `bounced`; admin sees it on booking |
| Regenerate after travellers edit (admin) | New PDF, same reference and invoice number, timeline entry |
| User downloads before generation finished | 404 with message "Ticket is being prepared, refresh in a moment"; UI polls |

## Acceptance criteria

- [ ] Confirmed booking has ticket and invoice within 30 s in test env (mocked providers).
- [ ] Ticket QR decodes to a URL whose token verifies; tampered token → invalid.
- [ ] Invoice numbers are sequential and unique under 50 parallel confirmations (test with Counter).
- [ ] Email job sends once per dedupeKey even when run twice concurrently.
- [ ] Forced SMTP failure → 3 attempts with backoff, `failed`, alert counted; booking remains confirmed.
- [ ] Downloads: owner 200, other user 404, admin 200, guest 401.
- [ ] HTML email renders in Gmail and Outlook web (manual check) and has text alternative.
