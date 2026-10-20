# Feature: Admin Panel

Requirements: FR-ADMINCONTENT-*, FR-TOUR-04…06, FR-ADMIN-01…09. Phases 3, 4, 8.

## Layout

- Route group `/admin` with its own layout: left sidebar (collapsible, icons + labels), top bar (search by booking reference / email / phone, environment badge, admin avatar), content area with page header (title, primary action) and breadcrumb.
- Tablet (768–1023): sidebar collapses to icons; tables scroll horizontally inside a container.
- Mobile (< 768): sidebar becomes a sheet; admin is usable but not optimised.
- Guard: layout calls `/auth/me`; non-admin redirected. Re-validates on window focus.

## Navigation

Dashboard · Temples · Circuits · Tours · Bookings · Payments · Users · Contacts · Audit log · Settings (Should)

## Shared components

- `DataTable`: server-side pagination, sorting, column visibility, row actions, empty/loading/error states, CSV export button where supported.
- `StatusBadge`: colour-coded for content status, booking status, payment status, departure status (see design system).
- `ImageUploader`: drag-drop, previews, progress, alt text, primary star, reorder by drag, delete with confirm.
- `RichTextEditor`: Tiptap with limited toolbar (H2, H3, bold, italic, lists, link, blockquote, image from uploaded set).
- `ConfirmDialog` with required reason textarea for sensitive actions.
- `EntityTimeline` for booking timeline and audit entries.
- `FormTabs` with per-tab error counts.

## Pages

### Dashboard
Stat cards (content, departures, users, bookings by status, revenue captured, holds), alerts strip (payment_received_no_seats, inventory mismatch, email failures), recent bookings table, recent audit list, range selector.

### Temples / Circuits / Tours
List (search, status filter, featured toggle), New, Edit (tabbed form), publish/unpublish/archive actions in header with confirmation, "View public page" link, image management tab, SEO tab with live preview snippet.

### Departures (inside Tour → Departures tab)
Table with inventory numbers and revenue; add/edit dialog; adjust seats dialog (shows committed seats, reason required); cancel dialog with impact counts; bulk add (Should).

### Bookings
List with filters and CSV export; detail page with: header (reference, statuses, actions), customer card, departure card, travellers table, payments table, documents (download, regenerate, resend email), timeline, internal notes, audit entries. Actions limited to allowed transitions; the UI hides what the state machine forbids and the API enforces.

### Payments
List across bookings with filters; link to booking; provider ids copyable.

### Users
List, search, detail drawer with bookings, toggle active, change role (confirm; cannot self-modify).

### Contacts
Inbox-style list; mark read/replied/spam; mailto link.

### Audit log
Filterable table; row expands to before/after JSON diff.

### Settings (Should)
Business details for invoices, booking parameters, tax toggle. All changes audited.

## Business rules

- Every destructive or financial action: confirm dialog + reason where the API requires it.
- Admin never sees password hashes or raw payment payloads beyond the whitelist.
- Admin sessions time out like users (7 days); admin login is audited.
- The admin app calls the same `/api/v1` with cookie auth; no separate admin token.

## Acceptance criteria

- [ ] Non-admin visiting any `/admin` route is redirected; direct API calls return 403.
- [ ] All lists paginate server-side and keep filters in URL.
- [ ] Booking detail hides disallowed actions and shows an explanation tooltip.
- [ ] Inventory adjust dialog blocks reductions below committed seats client-side and server-side.
- [ ] CSV export of 1,000 bookings completes and opens in Excel with correct columns and UTF-8 (BOM).
- [ ] Tablet width: no page-level horizontal scroll; tables scroll within container.
- [ ] Keyboard: all dialogs trap focus and close on Escape; tables' row actions reachable by Tab.
