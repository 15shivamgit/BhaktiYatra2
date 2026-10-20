# Project Context (read this first)

**Last updated:** 2026-10-20  
**Owner:** Shivam (GitHub `15shivamgit`)  
**Repository:** `BhaktiYatra2`

## One-paragraph summary

BhaktiYatra is a web platform to **explore India's religious temples** and, built on top of that content, **book organised pilgrimage tours** with online payment, digital tickets and an admin back-office. It is a rebuild of an earlier MERN prototype. The rebuild is specification-driven: this `docs/` folder is written and approved before each development phase.

## Decisions already locked (do not reopen without the owner)

| # | Decision | Chosen | Why (short) |
|---|---|---|---|
| 1 | Approach | Rebuild backend from scratch; reuse old frontend UI pieces and image assets where they fit; aim for a more professional UI | Old backend had two conflicting booking flows, mixed schemas, no payment signature check in one flow |
| 2 | Frontend framework | **Next.js (App Router)**, JavaScript (JSX), not TypeScript | Temple pages need SEO and social previews; Vite SPA cannot server-render |
| 3 | Backend | Separate **Express.js** API (Node LTS, ES modules) | Needs long-running jobs (hold expiry, email retry), webhooks, PDF generation; cleaner than cramming into Next route handlers |
| 4 | Product focus | **Temple exploration first**, tour booking second | Content drives traffic; booking converts it |
| 5 | Tours | Have **departures** (dated batches with their own seat inventory) and **traveller details** from the first booking phase | A tour without a date cannot really be booked; operators need traveller lists |
| 6 | Docs | Full `docs/` tree before coding, 11 folders as in this repo | Owner preference |
| 7 | Hindi / i18n | **Later** phase, but content model and UI must not block it | Audience is Hindi-heavy; do it properly once English is stable |
| 8 | Database | MongoDB Atlas + Mongoose | Team familiarity; document-shaped content |
| 9 | Payments | Razorpay, test mode until QA passes | Indian market |
| 10 | Images | Cloudinary from day one | Render/Vercel disks are ephemeral |
| 11 | Email | **Resend** (owner's account), never personal Gmail (ADR-018) | Deliverability and limits |
| 12 | Auth | JWT in **httpOnly cookie** | Safer than localStorage against XSS |
| 13 | Validation | **Zod** on the backend for every request; shared schemas where useful | One validator, good errors |
| 14 | Seat inventory | **Hold on order creation, 15-minute expiry**, confirm on verified payment | Prevents overselling during checkout |
| 15 | GST | No GST breakdown on invoices until the tax treatment is confirmed by a professional | Do not invent tax rules |

Full reasoning: `00-overview/03-decision-log.md`.

## Business details (owner-confirmed 2026-10-20)

| Item | Value |
|---|---|
| Business name | BhaktiYatra |
| Address | Ramdiri-3, Begusarai, Bihar, India 851129 |
| Support phone | +91 74888 81563 |
| Support email | 15shivambgs@gmail.com |
| GST registration | Not registered. Invoices are "Invoice / Payment Receipt" with no tax lines and no GSTIN (ADR-010). |
| Domain | Not purchased. Development stays on `localhost` until it is (ADR-016). |
| Cancellation policy | `07-content/05-cancellation-refund-policy.md` (draft, needs legal review before live payments) |
| Temple content | Drafted by Claude from research, reviewed by the owner (ADR-015) |
| Legacy images | Owner confirmed rights to the images in `Frontend/src/assets` (ADR-017) |

## Current status (2026-10-20)

Phases 1 (Foundation), 2 (Authentication, including Google sign-in) 3 (Temple Explore: public temple and circuit pages, admin content tools, 22 drafted temples) 4 (Tours & Departures: tour catalogue, departures with safe seat inventory, sample tours) 5 (Booking: seat holds, expiry, my bookings, cancellation) and 6 (Razorpay payments: Checkout, verify, webhooks, reconciliation) are built: `backend/` (Express 5 API) and `frontend/` (Next.js 16) run together with `npm run dev`. The old prototype (`legacy/`) was deleted after Phase 3 with the owner's approval; it remains in Git history (ADR-029). Reports: `10-testing/reports/phase-1.md` to `phase-4.md`. Open: Lighthouse mobile Performance on detail pages (about 57–67, target 85) and the Rich Results Test. Razorpay is wired but the configured test keys are rejected, so local development uses `PAYMENTS_PROVIDER=stub` until new test keys are added; a real test-mode payment is still to be done. "Book now" is on locally and in E2E (`NEXT_PUBLIC_FEATURE_BOOKING=true`) and off in production. Next: Phase 7 (tickets, invoices, email).

## State of the old code (as of 2026-10-20)

- `Frontend/` held a Vite React SPA (moved there from the repo root in commit `03cc7f7`), `backend/` held an Express CommonJS API. Both moved to `legacy/` in Phase 1, which was deleted after Phase 3 (ADR-029).
- **Secrets were committed** in `backend/.env` (MongoDB, Razorpay, Gmail). The file was removed from `main` and `shivam-kumar-dev` history on 2026-10-20 (ADR-024), but GitHub's PR #1 ref still points at the old commits, so the credentials must be treated as public and rotated.
- Frontend `package.json` references a missing `src/dataconnect-generated` folder, so a fresh `npm install` fails.
- Two booking flows exist; one skips Razorpay signature verification, the other never decrements seats and double-applies GST.
- Reusable: Home page sections (Hero, Features, Gallery, Banner, Footer, Navbar), ~160 temple images in `src/assets/`, Tailwind setup.
- Done: the old code moved to `legacy/` in Phase 1 and was deleted after Phase 3 (ADR-029). To look at it, check out commit `22465dc` or earlier.

## What "done" means for the first release

See `00-overview/02-vision-goals-success.md` and `10-testing/04-definition-of-done.md`. In short: temple explore works and is indexable, users can book a departure without overselling, payments are verified server-side and idempotent, tickets are generated only after confirmed payment and are download-protected, admin can manage content, tours, inventory and bookings, and nothing secret is in Git.

## Glossary (short)

- **Temple**: a single religious site with its own page. The content unit of the platform.
- **Circuit**: a curated group of temples (Char Dham, 12 Jyotirlingas). Explore-only, no booking.
- **Tour**: a packaged pilgrimage product (title, itinerary, price). A template, not bookable by itself.
- **Departure**: a dated instance of a tour with seat inventory. **This is what gets booked.**
- **Booking**: a user's reservation on a departure, with travellers, amount and payment state.
- **Hold**: seats temporarily removed from inventory while a booking is pending payment.

Full glossary: `00-overview/04-glossary.md`.
