# Phase 7 report: Tickets, invoices and email

**Date:** 2026-10-21 · **Branch:** `shivam-kumar-dev` · **Status:** built and tested with a fake mail provider; a real inbox delivery and a phone QR scan are manual checks still to do

Also in this session: a **page load progress bar** at the top of every page (see the end of this report).

## What was built

| Area | Result |
|---|---|
| Documents | Once a booking is confirmed it gets an invoice number (`INV-YYYY-NNNNNN`, one counter per year, unique) and a signed ticket token. Both PDFs are rendered from the booking whenever needed: on download and as email attachments |
| E-ticket | A5, one page. It has the reference, CONFIRMED status, tour and dates, pickup and pickup instructions, a travellers table, payment details, and a QR code for `/verify/<token>`. Footer: ID reminder, policy link and help line. Noto Sans is bundled so the ₹ sign prints |
| Invoice | A4 "Invoice / Payment Receipt" (BhaktiYatra is not GST-registered; tax lines appear once `TAX_ENABLED`). Seller details, bill-to, line item, totals and payment reference |
| Downloads | `GET /bookings/:reference/ticket` and `/invoice`. The owner and admins get the file; other users get 404; guests get 401; "being prepared" (404) until ready |
| Ticket check | `GET /tickets/verify/:token`, public and rate limited. Valid, cancelled, expired or not found; never names or contact details. Page `/verify/[token]` shows a big green "Valid" or red "Not valid" for pickup staff |
| Email | Resend over REST, or a console provider that only logs. Templates for welcome, password reset, booking confirmed (with both PDFs), payment failed, booking cancelled, departure cancelled, payment received without seats, and admin alerts. Shared layout, text part, `[STAGING]` prefix |
| Queue | Job every minute. Atomic claim (never sent twice), backoff of 1, 5 and 30 minutes, at most 3 attempts, failures counted for the Phase 8 dashboard. Messages older than a day are ignored. Password reset is sent during the request; the reset link is never stored |
| New triggers | User cancels an unpaid booking; admin cancels a departure (every affected traveller is emailed); `payment.failed` webhook |
| Frontend | Booking page: e-ticket and invoice download buttons, "being prepared" with automatic refresh, and "Your e-ticket and invoice are on their way to …" after payment. Ticket check page. `/verify` hidden from search engines |

Sample PDFs made with dummy data are in `phase-7/sample-ticket.pdf` and `phase-7/sample-invoice.pdf`.

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| Backend `vitest run` | 23 files, 347 tests passed |
| Frontend `vitest run` | 9 files, 67 tests passed |
| `playwright test` (production build, desktop + mobile) | 125 passed, 7 skipped |
| `npm run lint` / `format:check` | clean (one existing React Compiler warning) |

Critical cases covered:

- **TC-DOC-01:** ticket and invoice are issued; the PDF text includes the reference, travellers, pickup instructions and the ₹ amount.
- **TC-DOC-02:** a valid token verifies; tampered, expired and cancelled tokens do not.
- **TC-DOC-03:** 50 parallel invoice numbers are unique and contiguous.
- **TC-DOC-04:** the download matrix.
- **TC-DOC-05:** two concurrent queue runs send one email.
- **TC-DOC-06:** 3 attempts with 1/5/30-minute backoff, then the message stops as `failed`; the booking stays confirmed.
- **TC-DOC-07:** the verify response has no names, email or phone.

E2E covers paying, then downloading both files (checking the file names), and the ticket check page rejecting a damaged ticket.

## CI

GitHub Actions run 39480671036 (commit d74b8e8) passed all three jobs: secrets-scan, build-and-test, e2e.

## Manual checks

| Check | Result |
|---|---|
| Resend API key | Works (read-only check). No domain is verified, so the test sender can only deliver to the Resend account's own email |
| Rendered ticket and invoice | Viewed: one page each, ₹ prints, the table wraps long tour names |
| Real email with two PDFs in an inbox | **Not done:** needs a booking made with the Resend account's email (owner action 1) |
| Phone scans the ticket QR and sees "Valid" | **Not done:** needs a phone (owner action 2) |

## Bugs found and fixed during the phase

1. **Booking model had no ticket or invoice fields.** They were missing since Phase 4. Added, with a unique index on the invoice number.
2. **The ticket's last footer line spilled onto a blank second page.** It now stays on one page.
3. **A long tour name in the invoice table overlapped the row border.** Rows now grow to fit wrapped text.
4. **Letter-spaced headings broke text search and copy in the PDF** ("C O N F I R M E D"). The spacing is removed.
5. **The browser could not read the download's file name**, because `Content-Disposition` was not exposed through CORS. It now is.
6. **CI (from Phase 6): the tour admin test failed at midnight in India.** It worked out a date again after midnight had passed. Dates are now computed once.
7. **CI: a lint error in the new progress bar test** failed the progress bar push. Fixed.

## Exit criteria

| Criterion | Status |
|---|---|
| Test-mode booking → email with two PDFs within 1 minute | **Partly met:** with a fake provider the confirmation email has both PDFs on the first queue run, and the job runs every minute. Real Resend delivery not yet seen |
| Phone QR scan → "Valid" | **Partly met:** token round-trip tested; phone scan pending |
| Download matrix | Met (integration tests and E2E) |
| Mail down → 3 attempts, booking confirmed, alert data | Met |
| All Phase 7 tests green | Met |

## Page load progress bar (request in this session)

A 3 px bar runs across the top of every page in the site colours (saffron to maroon).

- **When it appears:** on the first visit until the page has loaded; on internal link clicks; on filter and search forms; and on back or forward.
- **When it stops:** once the new page is on screen.
- **What it ignores:** links within the same page (`#…`), other sites, new tabs, and forms that send data without leaving the page (contact, booking).
- **Safety:** it never stays longer than 15 seconds.
- **How it is built:** no library (the Next.js App Router has no navigation events). It updates the DOM directly, so its animation does not re-render pages. It is hidden from screen readers, which already get Next.js's page announcements, and respects reduced-motion settings.
- **Tests:** unit tests and an E2E check.

## Owner actions

1. **See a real confirmation email.** Register or book with the email address of your Resend account, pay (simulated), and check that inbox within a minute. To email any address, verify a domain in Resend (Phase 10).
2. **Scan the QR code** on the downloaded e-ticket with a phone (same Wi-Fi as the dev machine, or after deployment) and confirm "Valid".
3. **Optional:** send a logo file if you want it on tickets, invoices and emails instead of the text wordmark.
4. Still open: new Razorpay test keys, review of temple content, credential rotation, Cloudinary clean-up.

## Decisions recorded

ADR-033 (documents rendered on demand instead of stored, Resend over REST, template functions, queue rules, new email triggers, required settings in deployed environments).
