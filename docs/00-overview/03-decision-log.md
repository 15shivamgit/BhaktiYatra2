# Decision Log

Format: ID, date, status, context, decision, consequences. Add new entries at the bottom. Never delete; mark `superseded by ADR-xx` instead.

---

## ADR-001 — Rebuild rather than patch the prototype
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** The prototype has two booking flows that disagree, a Booking schema with duplicated fields, no signature verification in one path, no reservation logic, committed secrets, and a broken frontend dependency.  
**Decision:** Rewrite the backend from a clean structure. Reuse frontend UI sections and image assets selectively. Keep the old code under `legacy/` until Phase 3, then delete.  
**Consequences:** Short-term slower start; long-term one coherent codebase. Old data in Atlas is not migrated (there is no real production data).

## ADR-002 — Next.js App Router for the frontend
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** Explore pages must rank on Google and preview well when shared. The Vite SPA renders nothing server-side.  
**Decision:** Next.js (latest stable at Phase 1, pinned), App Router, JavaScript with JSDoc, Tailwind CSS, shadcn/ui components. Public pages are Server Components that fetch from the Express API. Admin pages are Client Components.  
**Consequences:** Learning curve for App Router; two deployables (Vercel + Render); must configure cookie auth across origins (see ADR-007).

## ADR-003 — Separate Express API instead of Next.js route handlers
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** We need cron-style jobs (hold expiry, email retry), Razorpay webhooks with raw bodies, PDF generation and Cloudinary uploads. Vercel serverless functions have execution limits and no persistent process.  
**Decision:** Express on Node LTS, ES modules, deployed to Render as a long-running web service. `node-cron` inside the API process for v1 jobs.  
**Consequences:** Two codebases to run locally (`npm run dev` at root starts both via `concurrently`). Jobs run in a single instance; if the API ever scales horizontally, move jobs to a worker.

## ADR-004 — Temple is the content unit; Circuit groups temples
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** The spec's "Destination" was too thin for an explore-first product.  
**Decision:** A rich `Temple` model (timings, aarti, festivals, how to reach, rules, geo, images, SEO) and a `Circuit` model for curated groups. Cities are a field, not an entity.  
**Consequences:** More admin fields to fill; content guidelines required (`07-content/`). City pages can be derived later by aggregation.

## ADR-005 — Tours have Departures; Departures carry inventory
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** A tour without dates cannot be booked meaningfully, and seat inventory per date is what operators actually manage.  
**Decision:** `Tour` is a template (itinerary, base price). `TourDeparture` has start/end dates, optional price override, `totalSeats`, `seatsAvailable`. Bookings reference a departure.  
**Consequences:** Admin must create at least one departure before a tour is bookable. Listing shows "next departure" and "from ₹".

## ADR-006 — Seat hold on order creation with 15-minute expiry
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** Options were (a) decrement only on payment success, risking oversell during checkout, or (b) hold at order creation and release on expiry.  
**Decision:** (b). Creating a booking atomically decrements `seatsAvailable` and sets `expiresAt = now + 15 min`. A job every minute marks expired pending bookings `expired` and increments seats back. Verified payment on an expired booking is handled as a late payment (see `05-features/04-booking-inventory.md`).  
**Consequences:** Needs the cron job and careful idempotency. Users see a countdown on the payment page.

## ADR-007 — JWT in httpOnly cookie
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** The prototype stored the token in localStorage, exposed to XSS.  
**Decision:** Backend issues a signed JWT (7-day expiry) in an `httpOnly; Secure; SameSite=Lax` cookie. In production, frontend and API share a parent domain (`bhaktiyatra.in` and `api.bhaktiyatra.in`) so the cookie is first-party. In local dev both are `localhost`. CORS is restricted to the frontend origin with `credentials: true`.  
**Consequences:** Requires custom domains before production. CSRF risk is mitigated by `SameSite=Lax` plus origin checks on state-changing routes. If custom domains are unavailable, fall back to a Next.js route-handler proxy (documented in `02-architecture/04-security.md`).

## ADR-008 — Cloudinary for all uploaded and generated files
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** Render and Vercel filesystems are ephemeral.  
**Decision:** Images are uploaded through the API (multer memory storage → Cloudinary). Generated PDFs are uploaded to Cloudinary as `raw` resources with restricted delivery and streamed to the user through an authenticated API route.  
**Consequences:** Cloudinary free tier limits apply; cleanup job for orphaned assets later.

## ADR-009 — Zod for validation, shared error shape
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** Every route has a Zod schema for `params`, `query` and `body`. Validation errors return `422` with field-level details. Schemas for forms are mirrored on the frontend where useful.

## ADR-010 — No GST breakdown until confirmed
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** Invoices show line items and total paid. A `taxConfig` setting exists but is off. No GSTIN is printed until the business provides one.

## ADR-011 — Money stored as integer rupees
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** `price`, `unitPrice`, `amount` are integers in INR. Conversion to paise (`× 100`) happens only in the Razorpay service. Prices with paise are not supported in v1.

## ADR-012 — Hindi deferred, but not blocked
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** UI strings live in a single `messages/en.json` from Phase 1 so `next-intl` can be added later. Content fields are single-language in v1; a `translations` sub-document can be added without migration.

## ADR-013 — Phase order: explore before commerce
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** Phases: Foundation → Auth → Temple Explore → Tours & Departures → Booking & Inventory → Payments → Documents & Email → Admin Ops → QA → Deployment. Auth precedes Explore because admin content tools need it.

## ADR-014 — Business details and tax status
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** Tickets, invoices, emails and the contact page use: BhaktiYatra, Ramdiri-3, Begusarai, Bihar, India 851129, +91 74888 81563, 15shivambgs@gmail.com. The business is not GST-registered, so invoices carry no GSTIN and no tax lines (confirms ADR-010). These values live in env/constants until the Settings page exists.  
**Consequences:** If GST registration happens later, enable `tax` settings and reissue templates; no schema change.

## ADR-015 — Temple content authored by Claude, reviewed by owner
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** The owner asked Claude to research and write temple content.  
**Decision:** During Phase 3, Claude drafts temple and circuit content into `backend/scripts/data/temples.json` and `circuits.json`, following `07-content/01-content-guidelines.md`. Every draft records its sources and check date in internal notes. Timings and fees are marked "verify locally" when sources disagree. The owner reviews before content is published.  
**Consequences:** Content quality depends on source availability; timings must be rechecked before each pilgrimage season.

## ADR-016 — Local-only development until a domain is purchased
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** All phases up to Phase 9 run on `localhost` (frontend 3000, API 5000) with host-only cookies. Staging and production deployment (Phase 10) wait for a domain. If deployment is needed earlier, use the Next.js proxy fallback from `02-architecture/04-security.md` §14 on platform subdomains.  
**Consequences:** Webhook testing uses a tunnel (ngrok/cloudflared). OQ-1 stays deferred.

## ADR-017 — Legacy images may be reused
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** The owner confirmed rights to the images in the old `Frontend/src/assets` folder. They may be uploaded to Cloudinary and used for temple pages, with descriptive alt text. Third-party images added later still need licence records.
