# Phase 8 — Admin Operations

**Goal:** the operations team can run the business day-to-day from the admin panel with trustworthy numbers and an audit trail. Specs: `05-features/07-admin-panel.md`, `04-api/05-bookings-payments.md` (admin section), `04-api/06-admin.md`.

## Tasks

### Backend
1. Dashboard aggregation service (content, departures, users, bookings by status, captured revenue from Payments, holds, alerts) with 60 s cache.
2. Admin bookings: list with filters/search, CSV streaming export (UTF-8 BOM), detail with audit and notifications, status transitions (incl. manual payment with reason), cancel with refund record, notes, regenerate documents, resend confirmation.
3. Admin payments list.
4. Audit log list/detail.
5. Contacts admin complete.
6. Settings document (Should) or constants documented. (Constants documented; no settings page in v1, ADR-034.)
7. Tests: dashboard numbers vs fixture expectations, CSV columns, every admin transition allowed/denied, manual payment requires reason and is audited, cancellation releases seats and records refund.

### Frontend
8. Admin dashboard with stat cards, alerts, recent bookings, recent audit.
9. Bookings list (DataTable, filters, export) and detail page with all panels and actions.
10. Payments list, Users list with role/active controls, Contacts inbox, Audit log with diff viewer.
11. Global admin search (reference/email/phone) in top bar.
12. Tablet layout verification.

## Exit criteria

Status on 2026-10-21 (details in `10-testing/reports/phase-8.md`):

- [x] Dashboard numbers match hand-run Mongo queries on a seeded dataset (record queries in the phase report). (`dashboard.check.js`: integration test on a mixed dataset for all four ranges, and `npm run db:check-dashboard` on the dev database.)
- [x] Every sensitive action appears in the audit log with actor and reason.
- [ ] CSV opens correctly in Excel with Hindi/₹ characters intact. (BOM, UTF-8 and Hindi text verified by tests; opening the file in Excel is a manual check for the owner.)
- [x] Admin cannot demote/deactivate self; cannot mark paid without reason.
- [x] axe clean on admin dashboard and bookings pages.
- [x] All Phase 8 tests green.
