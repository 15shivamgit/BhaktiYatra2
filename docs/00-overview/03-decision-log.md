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
**Decision:** During Phase 3, Claude drafts temple and circuit content into `backend/scripts/data/temples.data.js` (temples and circuits in one module), following `07-content/01-content-guidelines.md`. Every draft records its sources and check date in internal notes. Timings and fees are marked "verify locally" when sources disagree. The owner reviews before content is published.  
**Consequences:** Content quality depends on source availability; timings must be rechecked before each pilgrimage season.

## ADR-016 — Local-only development until a domain is purchased
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** All phases up to Phase 9 run on `localhost` (frontend 3000, API 5000) with host-only cookies. Staging and production deployment (Phase 10) wait for a domain. If deployment is needed earlier, use the Next.js proxy fallback from `02-architecture/04-security.md` §14 on platform subdomains.  
**Consequences:** Webhook testing uses a tunnel (ngrok/cloudflared). OQ-1 stays deferred.

## ADR-017 — Legacy images may be reused
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** The owner confirmed rights to the images in the old `Frontend/src/assets` folder. They may be uploaded to Cloudinary and used for temple pages, with descriptive alt text. Third-party images added later still need licence records.

## ADR-018 — Resend replaces Brevo for email
**Date:** 2026-10-20 · **Status:** accepted (supersedes the provider choice in ADR-003/PROJECT_CONTEXT #11)  
**Context:** The owner created a Resend account and API key.  
**Decision:** Transactional email goes through Resend using its Node SDK (`resend`). Env: `RESEND_API_KEY`, `MAIL_FROM`, `MAIL_REPLY_TO`. Until a domain is verified in Resend, sending is limited to Resend's test sender and the account owner's address; Phase 7 dev testing uses that. The provider sits behind `providers/mail.provider.js` so it can be swapped.  
**Consequences:** No SMTP variables. Domain verification (SPF/DKIM) moves to Resend in Phase 10.

## ADR-019 — Express 5, built-in env loading, custom body sanitiser
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** Express 5 (stable; async errors reach the error handler without wrappers, so no `asyncHandler`). Env files load with Node's `--env-file-if-exists=.env` flag instead of `dotenv`. `express-mongo-sanitize` and `hpp` are dropped because they write to `req.query`, which is read-only in Express 5; instead the app uses the `simple` query parser (no nested objects) plus a small `sanitizeBody` middleware, and Zod `.strict()` schemas remain the main guard. Validated values live on `req.valid`.  
**Consequences:** Fewer dependencies; behaviour covered by `tests/integration/errors.test.js`.

## ADR-020 — Google sign-in in Phase 2
**Date:** 2026-10-20 · **Status:** accepted (owner confirmed)  
**Context:** Google OAuth client credentials are in the owner's `.env`; the owner asked for Google sign-in alongside email/password.  
**Decision:** The Express API runs the OAuth 2.0 authorisation-code flow with PKCE, `state` and `nonce` (no NextAuth, so there is one session system). `GET /auth/google` redirects to Google; Google returns to the frontend URL already registered in Google Cloud Console (`/api/auth/callback/google`), whose Next.js route handler forwards the query string to `GET /auth/google/callback` on the API. The API exchanges the code, verifies the ID token (issuer, audience, nonce, `email_verified`), then signs in, links or creates the user and sets the normal session cookie. A verified Google email that matches an existing password account is linked to it.  
**Consequences:** User gets `googleId` and `avatarUrl`; `passwordHash` becomes optional. Google-only users can set a password later through "forgot password" or the profile page.

## ADR-024 — Remove backend/.env from Git history
**Date:** 2026-10-20 · **Status:** done (owner approved)  
**Decision:** `git filter-branch --index-filter 'git rm --cached --ignore-unmatch backend/.env'` on `main` and `shivam-kumar-dev`, then `--force-with-lease` pushes. A full backup bundle was taken first. All commit IDs on both branches changed.  
**Consequences:** Other clones must re-clone or `git fetch && git reset --hard origin/<branch>`. GitHub keeps `refs/pull/1/head` (read-only) pointing at the old history, and old commits may stay viewable by ID until GitHub garbage-collects them; only GitHub Support can purge them. Rotating the leaked credentials remains mandatory.

## ADR-025 — Sessions: `jose` JWTs and a session version
**Date:** 2026-10-20 · **Status:** accepted (refines ADR-007)  
**Decision:** Use `jose` for both our session JWTs (HS256) and Google ID-token verification (remote JWKS), instead of `jsonwebtoken` plus a second library. Replace `tokenInvalidBefore` with an integer `sessionVersion` on User, copied into the JWT as `sv`; a token is valid only while `sv` matches. Password change and password reset increment it (signing out other devices); the current device gets a fresh cookie. Logout clears the cookie only. bcrypt cost is `BCRYPT_ROUNDS` (default 12; tests use 4).  
**Consequences:** No clock-skew edge cases when invalidating sessions. A "sign out everywhere" button can be added later by incrementing `sessionVersion`.

## ADR-021 — Cloudinary image inventory and quality gap
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** The owner's Cloudinary folder `BhaktiYatra` holds 186 assets. 158 are temple photos, but 137 of them are about 300×180 px. That is too small for hero or gallery use (guideline: ≥ 1600 px). The folder also contains personal documents that are not part of the project.  
**Decision:** `backend/scripts/data/cloudinary-images.json` lists temple, brand and needs-review images and names (without URLs) the excluded personal files. Small images may be used only as thumbnails. Phase 3 needs larger photos for at least the ★ temples. New uploads go to `bhaktiyatra/<env>/…` folders as the spec says.

## ADR-022 — Next.js 16 Cache Components and Tailwind CSS 4
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** Phase 1 installed Next.js 16.4 and Tailwind CSS 4.3, both newer than the spec assumed. Next 16 enables `cacheComponents` and `partialPrefetching`; fetches are uncached by default and uncached data must render inside `<Suspense>`. Tailwind 4 has no `tailwind.config.js`; tokens live in CSS under `@theme`.  
**Decision:** Keep `cacheComponents: true` and `partialPrefetching: true`. Public content fetchers are `'use cache'` functions with `cacheLife('minutes')` (≈5 min) and `cacheTag('temple:<slug>')`, `cacheTag('temples')` etc. On-demand revalidation calls `revalidateTag` for those tags (and `revalidatePath` where a path is simpler). Request-time data (API status, user data) renders inside `<Suspense>`. Design tokens live in `frontend/app/globals.css` `@theme`. Error boundaries use the Next 16 `retry` prop. Read `node_modules/next/dist/docs/` before using a Next API (as `frontend/AGENTS.md` instructs).  
**Consequences:** References to `export const revalidate = 300` in these docs mean "cache for about five minutes with `cacheLife`". Vitest cannot render async Server Components, so those are covered by Playwright.

## ADR-023 — Accessible primary colour
**Date:** 2026-10-20 · **Status:** accepted (corrects `06-design/01-design-system.md`)  
**Context:** Measured contrast showed white text on saffron `#D9731F` is only 3.27:1, failing WCAG AA (4.5:1). Success `#2F7D4F` on its soft tint (4.35:1) and warning `#B7791F` on its tint (3.24:1) also failed.  
**Decision:** `--color-primary` is `#B4580F` (white text 4.83:1; as text on the page background 4.72:1), hover `#A84F0C`. Saffron `#D9731F` stays as `--color-saffron` for decoration only (icons, rules, focus ring). Success becomes `#256B42` (5.56:1 on its tint) and warning `#8A5A12` (5.27:1).

**Addendum (Phase 3):** primary `#B4580F` as text is only 4.45:1 on the tinted `surface-muted` section background, below AA. On tinted backgrounds, links use accent `#7A1F2B` (9.4:1). axe caught this on the home page "View all" links.

## ADR-026 — Temple and circuit pages: render on first visit, redirect in the page
**Date:** 2026-10-20 · **Status:** accepted  
**Context:** With Cache Components, `generateStaticParams` must return at least one entry, which would make every build depend on a reachable API with published content. Slug renames must keep old addresses working (spec: 301).  
**Decision:** Detail pages have no `generateStaticParams`. Each page renders on its first visit inside `<Suspense>`, then stays cached (`'use cache'`, `cacheLife('content')` = 5 min, tag `content`) until the API's revalidation call expires it. Content fetchers return empty results during `next build` so builds never call the API. For a renamed slug the API answers 301 with JSON `{ redirect: { slug } }`, and the page calls `permanentRedirect()`. Because the page has already started streaming, Next.js delivers that redirect as an instant client redirect with a `<meta http-equiv="refresh">`, not an HTTP 301 status. Google treats an instant meta refresh as a permanent redirect.  
**Consequences:** Builds and CI need no API. The first visitor to a page after a deploy waits for one API call. A true HTTP 301 would need a per-request lookup in `proxy.js` (an API call on every detail request); revisit if Search Console shows problems. Metadata on these pages is streamed into `<body>` for normal browsers and placed in `<head>` for HTML-only crawlers (Next.js `htmlLimitedBots`), so Lighthouse with its default user agent reports a missing meta description (SEO 92) while crawlers get 100.

## ADR-027 — View counts by beacon; session check that never 401s
**Date:** 2026-10-20 · **Status:** accepted (changes `04-api/03-temples-circuits.md` and `02-auth.md`)  
**Decision:** `GET /temples/:slug` no longer increments `viewCount`: cached pages call the API rarely, so counts would be meaningless. The detail page sends `POST /temples/:slug/views` once per browser session, skipping admins and bots; the endpoint is rate limited. The frontend loads the user with `GET /auth/session`, which returns `{ user: null }` for guests instead of 401, so public pages produce no console errors. `GET /auth/me` keeps its 401 contract.

## ADR-028 — Admin content tools
**Date:** 2026-10-20 · **Status:** accepted  
**Decision:** Rich text uses Tiptap 3 (StarterKit limited to what the API sanitiser keeps: H3/H4, bold, italic, lists, quotes, links). The temple editor is a tabbed react-hook-form form; photos save immediately through their own endpoints, other fields with "Save changes"; publishing is disabled while there are unsaved edits and shows the API's `publishProblems`. Circuit temple order uses move up/down buttons instead of drag and drop: keyboard and screen-reader friendly with no extra library. The map picker loads Leaflet only when its tab is open. `upload-images.js` is not built: seed photos are the owner's existing Cloudinary assets and new ones go through the admin uploader. Admin pages render inside `<Suspense>` because the auth guard reads the pathname.

## ADR-029 — Delete `legacy/`
**Date:** 2026-10-20 · **Status:** done (owner approved; Phase 3 task 21, completes ADR-001's plan)  
**Context:** `legacy/` held the old Vite frontend and Express backend (254 tracked files, 170 of them images or PDFs). No workspace, import, script or CI job used it.  
**Decision:** Removed from the working tree. The untracked `legacy/backend/.env` was deleted too; its only settings missing from the new `backend/.env` were Gmail SMTP values (replaced by Resend, ADR-018, and due for rotation) and two old Google and Cloudinary key names.  
**Consequences:** The old code and images stay in Git history; commit `22465dc` is the last one that contains them (`git show 22465dc:legacy/<path>`). Tours, bookings and payments in Phases 4 to 6 follow `docs/`, not the old code.

## ADR-030 — Phase 4: dates, inventory, jobs and the booking switch
**Date:** 2026-10-20 · **Status:** accepted
**Decision:**
- **Dates.** Departure dates are calendar days in India: stored as midnight IST, exchanged as `"YYYY-MM-DD"`. "Today", month filters and the completion job use IST (`backend/src/utils/dates.js`). The frontend formats these strings in UTC so the day never shifts in another time zone.
- **Booking schema first.** The `Booking` model is defined in Phase 4 because inventory rules (committed seats, cancel, delete and archive guards) read it. Creating bookings arrives in Phase 5.
- **Inventory.** Seat changes are one conditional `findOneAndUpdate` (`seatsAvailable ≥ −delta` and `totalSeats` unchanged), retried on concurrent edits, so total seats never drop below committed seats. Departure date edits are refused while seats are booked **or held** (stricter than the spec's "confirmed"), because pending holds also carry the old dates.
- **Cancel.** Runs in a transaction: pending bookings expire with seats released; confirmed ones become `cancellation_requested` with `departureCancelled: true` for refunds in Phase 8. The traveller email comes with Phase 7.
- **Jobs.** A small in-process scheduler (`backend/src/jobs/index.js`, `setInterval`, no overlapping runs) instead of node-cron; jobs only call services. Single API instance assumed, as in the architecture doc. `complete-departures` runs hourly.
- **Booking switch.** The tour page shows "Book now" only when `NEXT_PUBLIC_FEATURE_BOOKING=true` (Phase 5). Until then it offers an enquiry (contact form prefilled with the tour) and a call button. Tours are always in the navigation; the `NEXT_PUBLIC_FEATURE_TOURS` flag is gone.
- **Tour pages** follow ADR-026 (render on first visit, cached under the `content` tag; every tour or departure change revalidates the tour). Seat counts shown there can be up to five minutes old; the booking page will read `GET /departures/:id`, which is never cached.

## ADR-031 — Phase 5: bookings with a stub payment provider
**Date:** 2026-10-20 · **Status:** accepted
**Decision:**
- **Stub first.** `PAYMENTS_PROVIDER` defaults to `stub` until Razorpay is wired in Phase 6, and the API refuses to start with the stub in production. The stub fakes order ids, so seat holds, expiry and cancellation are proven without money.
- **Simulator.** `POST /bookings/:reference/simulate-payment` exists only while the stub allows it (never in production). It calls the real `confirmBooking`, so the idempotent confirmation and the late-payment path (re-hold, or `payment_received_no_seats`) are already built and tested for Phase 6. The booking page shows "Simulate payment" buttons only when the API says `simulate: true`.
- **Idempotency.** Keys are stored per user in MongoDB with a 10-minute TTL (works across restarts); a different body with the same key gets 422; a failed request releases the key.
- **Pending limit** counts unpaid bookings whose hold has not ended, so an expired hold the job has not processed yet does not block a new booking.
- **References** use the booking date in India: `BY-YYYYMMDD-XXXXX` with an alphabet without look-alikes.
- **Notifications** (`booking_confirmed`, `payment_received_no_seats`, `cancellation_requested_admin`) are queued after the transaction commits; their dedupe keys prevent duplicates. Sending arrives in Phase 7.
- **Live booking switch.** The tour page shows "Book now" when `NEXT_PUBLIC_FEATURE_BOOKING=true`. It is on in local development and E2E, and stays off in production until Phase 6.
- **"Try again"** after an expired hold resets the booking page in place, because a link to the same URL does not remount the page in the App Router.

