# Phase 7 — Tickets, Invoices and Email

**Goal:** every confirmed booking produces a verifiable ticket and an invoice, delivered by email with retry, and downloadable only by the right people. Specs: `05-features/06-tickets-invoices-email.md`.

## Pre-requisites (owner)

- [x] Business legal name, address, support email and phone (OQ-2): see `PROJECT_CONTEXT.md`.
- [ ] Brevo account with verified sender domain (or sandbox for now).
- [ ] Logo files (SVG/PNG) for PDFs and emails.

## Tasks

### Backend
1. `Counter` model and `nextInvoiceNumber(year)`.
2. Ticket token sign/verify with `TICKET_SIGNING_SECRET`.
3. PDF renderers (pdfkit) for ticket and invoice with bundled Noto Sans; layout per spec; QR via `qrcode` to buffer.
4. Documents service: generate both, upload to Cloudinary as private raw, update booking, idempotent regenerate (same invoice number).
5. Listener on `booking.confirmed` → generate documents → mark NotificationLog ready.
6. Mail provider (Nodemailer SMTP) + handlebars templates for all types; shared layout; text alternative.
7. `retry-emails` job: claim with conditional update, send, backoff, max 3 attempts, alert count.
8. Download endpoints (ticket, invoice) with ownership checks and streaming.
9. `GET /tickets/verify/:token` with rate limit.
10. Wire `welcome`, `password_reset`, `booking_cancelled`, `cancellation_requested_admin`, `payment_received_no_seats` to the queue.
11. Tests: PDF generation produces non-empty buffers with expected text (pdf-parse in tests), QR payload round-trip, invoice numbering under concurrency, email job dedupe and backoff (mocked transport), download authz matrix, verify endpoint minimal data.

### Frontend
12. `/verify/[token]` page.
13. Document download buttons in account and admin (fetch with credentials → blob → save), "being prepared" polling.
14. Booking success view shows "Ticket sent to <email>".

## Exit criteria

- [ ] Test-mode booking → email with two PDFs arrives in Mailpit/Brevo within 1 minute.
- [ ] QR scanned with a phone opens the verify page showing "Valid".
- [ ] Owner/other/admin/guest download matrix verified by tests and manually.
- [ ] SMTP disabled → 3 attempts logged, booking confirmed, dashboard alert counter (Phase 8) data present.
- [ ] All Phase 7 tests green.
