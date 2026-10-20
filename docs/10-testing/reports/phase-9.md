# Phase 9 report: Quality assurance

**Date:** 2026-10-21 · **Branch:** `shivam-kumar-dev` · **Status:** automated QA done; defects found were fixed. Not yet met: Lighthouse mobile Performance ≥ 85 (local result about 60), 60 published temples (22 today), and the checks only the owner can do (real phones, screen readers, legal review, staging deployment, sign-off).

## Summary

| Area | Result |
|---|---|
| Critical test cases | All 69 **Must** cases are linked to automated tests and pass (matrix: `phase-9-test-matrix.md`) |
| E2E journeys J1–J11 | All covered. New file `frontend/e2e/journeys.spec.js` adds J2, J3 (ticket check "Valid"), J7, J9, J10, J11 and a keyboard-only booking |
| Cross-browser | Chromium (desktop + Android phone), Firefox and WebKit (desktop + iPhone) all pass the suite; see "Browsers" |
| Load | Every list and detail endpoint p95 ≤ 250 ms with 1,000 temples, 500 departures and 10,000 bookings; 300 people booking at once: no errors, no seat mismatches |
| Indexes | All 12 busiest queries use an index (no collection scans) |
| Security | 4 defects found and fixed (no security headers on the website, no rate limit on payment verification, a sideways-scrolling admin page, a slow admin search); production dependencies: 0 known vulnerabilities; no secrets in Git history |
| Accessibility | axe clean on all public, booking and admin pages tested (Chromium, Firefox, WebKit); Lighthouse Accessibility 100; keyboard-only booking test passes |
| Performance | Lighthouse mobile Performance about 60 on this laptop (target 85). Accessibility 100, Best practices 100, SEO 92 (100 for crawlers). See "Performance" |

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| Backend `vitest run` | 25 files, 378 tests passed |
| Frontend `vitest run` | 10 files, 74 tests passed |
| `playwright test` Chromium desktop + Android phone (production build) | 136 passed, 16 skipped (admin journeys run on desktop only), 0 failed |
| `E2E_BROWSERS=all playwright test` Firefox desktop | 71 passed, 1 failed (J11, fixed, then passed in repeated runs) |
| `E2E_BROWSERS=all playwright test` WebKit desktop + iPhone | 131 passed, 4 failed (2 trace-file errors from a parallel run, 2 skip-link checks; all fixed and passed on rerun, 36 of 36) |
| `npm run test:load -w backend` | see "Load test" |
| `npm audit --omit=dev` | 0 vulnerabilities |
| `npm run lint`, `format:check` | clean (one existing React Compiler warning) |

## Release gate (`00-overview/02-vision-goals-success.md`)

| Line | Status | Evidence |
|---|---|---|
| Responsive at 360, 768, 1280 px, no horizontal scroll | Met | J11 in Chromium, Firefox and WebKit (home, temple, tour, booking, my bookings, admin bookings) |
| Lighthouse temple page: Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95 | **Not met** (Performance about 60 locally; SEO 92 with the default Lighthouse agent, 100 for crawlers; Accessibility 100) | "Performance" below |
| Register, log in, log out, reset password; sessions survive refresh | Met | `auth.spec.js`, TC-AUTH-01…11 |
| Ordinary users get 403 on every admin API and are redirected from /admin | Met | TC-AUTH-09, admin-ops access test, `auth.spec.js` |
| Admin creates a temple with images, publishes it, it appears in listing, search and sitemap | Met | J8 (`admin.spec.js`) |
| Admin creates a tour and two departures with inventory | Met | `admin.spec.js` tour journey, J9 |
| 20 parallel bookings for 5 seats → exactly 5 confirmed | Met | TC-BOOK-03; load test (300 at once, zero mismatches) |
| Abandoned checkout releases its hold within 16 minutes | Met | TC-BOOK-08/09, J5 (one-minute E2E hold) |
| Tampered signature rejected; replayed webhook does not double-confirm | Met | TC-PAY-02, TC-PAY-04…07 |
| Ticket PDF opens, QR resolves to verification, invoice number unique | Met (phone scan still manual) | TC-DOC-01…03, J3 "Valid" |
| User A cannot download user B's ticket | Met | TC-DOC-04, J7 |
| Confirmation email; forced failure retried and logged; booking stays confirmed | Met with a fake mail provider (real inbox check pending from Phase 7) | TC-DOC-05/06 |
| Dashboard numbers match hand-run queries | Met | Phase 8 report, `dashboard.check.js` |
| No credentials in Git history; `.env` not tracked | Met | gitleaks in CI; history search below |
| All Must cases green in CI | Met | matrix; CI run listed below |
| Deployment guide reproduces staging on a clean account | **Not done** (Phase 10) | |

## Browsers

`E2E_BROWSERS=all` adds Firefox desktop, WebKit desktop (Safari engine) and WebKit on an iPhone 14 profile; CI keeps Chromium only, to stay fast.

- **Firefox:** the first combined run failed 17 tests while three browsers and a load test shared the laptop (time-outs and a Firefox graphics crash). Run alone: 71 of 72 passed. The last one (J11) waited for a page Firefox reported as still loading after it had loaded; it now reads the page directly and is split per screen size.
- **WebKit:** Safari moves through links with Tab only when "Press Tab to highlight each item" is on, so the skip-link test focuses the link directly on WebKit. Everything else passed, including Razorpay Checkout (stub), downloads and the admin screens.
- **Real phones** (Android Chrome, iPhone Safari) are still to be checked by hand (owner action 1).

## Load test

`npm run test:load -w backend` seeds an in-memory database (nothing real is touched): 1,000 temples (100 drafts), 50 tours, 500 departures, 10,000 bookings in all states with payments, 2,000 users. 20 connections for 10 seconds per scenario; then 300 different users book one seat each at the same moment (50 at a time). Laptop, Windows, Node 24, idle machine.

| Scenario | Requests/s | p50 | p95 | p99 | Errors |
|---|---|---|---|---|---|
| GET /temples (pages 1–40) | 214 | 87 ms | 140 ms | 202 ms | 0 |
| GET /temples state + deity | 269 | 72 ms | 110 ms | 123 ms | 0 |
| GET /temples?q= (text search) | 236 | 78 ms | 125 ms | 156 ms | 0 |
| GET /temples/:slug | 249 | 74 ms | 115 ms | 124 ms | 0 |
| GET /tours | 109 | 179 ms | 247 ms | 289 ms | 0 |
| GET /tours/:slug | 318 | 58 ms | 91 ms | 111 ms | 0 |
| GET /admin/bookings (filters) | 113 | 179 ms | 231 ms | 266 ms | 0 |
| GET /admin/bookings?q= (search) | 235 | 78 ms | 118 ms | 123 ms | 0 |
| GET /admin/payments | 106 | 199 ms | 247 ms | 274 ms | 0 |
| POST /bookings, 300 users at once | 109 | 441 ms | 536 ms | 573 ms | 0 |

- Target NFR-PERF-02 (list p95 ≤ 300 ms): **met** for every endpoint.
- Before the fix in this phase the admin booking search had p95 1,167 ms (see defect 4).
- Seat inventory (reconciliation) before and after the booking burst: **0 mismatches** on 500 departures.

Query plans (`explain('executionStats')` on the seeded data): public temple list, list by state, text search, temple by slug, a tour's departures, my bookings, the expiry job query, admin list newest first, admin list by status, booking by reference, a departure's bookings, a booking's payments. **All use an index**; the admin list by status examined 332 documents for 20 results before a new `{ bookingStatus, createdAt }` index and 20 after.

## Security review (`02-architecture/04-security.md`)

| Check | Result |
|---|---|
| Secrets | `.env` files not tracked (only `.env.example`). Git history searched for MongoDB URLs with passwords, Razorpay, Resend, AWS, Google, Slack keys and private keys: one match, a documentation placeholder (`user:****@cluster`). gitleaks runs in CI with full history |
| Dependencies | `npm audit --omit=dev`: 0. With dev tools: 5 high in ESLint's `braces`/`micromatch` chain (lint tooling only, never shipped; fixed upstream by a breaking ESLint config update, tracked for later) |
| Authentication | bcrypt cost 12 by default; same message for unknown email and wrong password (TC-AUTH-03); 10 logins per 15 minutes (TC-AUTH-08); reset tokens single use and expiring (TC-AUTH-07); sessions end on password change, deactivation and demotion |
| Cookies | HttpOnly, Secure in production, SameSite=Lax (TC-AUTH-11) |
| Authorisation / IDOR | Another user's booking, ticket, invoice and payment verification answer 404 (TC-BOOK-11, TC-DOC-04, TC-PAY-03, J7); every admin route 403 for users |
| CORS and CSRF | No CORS header for unknown origins (TC-SEC-01); state-changing requests from a foreign Origin 403 (TC-SEC-02) |
| Injection | Mongo operators stripped and query parser `simple` (TC-SEC-03); errors never show stacks or database text (TC-SEC-04, extended this phase with database errors) |
| XSS | Rich text sanitised on save with an allow-list, images only from Cloudinary (TC-TEMPLE-07); JSON-LD escapes `<`; contact messages render as text; email templates escape every value |
| Uploads | MIME sniffed; a renamed `.exe` gets 415 (TC-TEMPLE-08); 5 MB and 12-image limits |
| Rate limits | Auth, contact, booking, ticket check and webhook limits in place; **payment verification had none** (defect 2) |
| Security headers | API: Helmet. **Website: none** (defect 1) |
| Logs | Cookies, passwords, tokens and secrets redacted (TC-SEC-05) |
| Not in v1 | Sentry (Phase 10), Dependabot (to enable on GitHub), branch protection on `main` (owner, on GitHub) |

## Accessibility

- axe (serious and critical) is clean on home, temple list and detail, circuits, tours, tour detail, auth pages, account, booking form, booking page and payment, admin dashboard, bookings list, booking page, audit log and editors, in Chromium, Firefox and WebKit.
- Keyboard: a new test books a tour with the keyboard only (Tab to every control, arrow keys for the date, Space for the terms box, Enter to continue). Dialogs trap focus and close on Escape (existing tests).
- Screen readers (NVDA on Windows, VoiceOver on iPhone) are manual checks for the owner (owner action 2).

## Performance

Lighthouse 12.8.2, mobile, local production build, median of three runs:

| Page | Performance | Accessibility | Best practices | SEO | LCP | TBT |
|---|---|---|---|---|---|---|
| Temple (Kedarnath) | 57–60 | 100 | 100 | 92 | 5.3 s | 954 ms |
| Home | 57–63 | 100 | 100 | 100 | 4.5 s | 942 ms |
| Tour (Char Dham) | 58–61 | 100 | 100 | 92 | 4.9 s | 1,027 ms |

What the measurements show:

- **This laptop's speed changes run to run.** Lighthouse's CPU benchmark for the machine was 1,305 in the first run of the day (temple page: 69, TBT 368 ms) and 750–950 later (TBT about 950 ms). Lighthouse slows the CPU a further 4×, so blocking time on this machine is much higher than on a typical phone test server. Numbers here are for comparison, not a verdict; the real measurement is PageSpeed Insights on the deployed site (Phase 10).
- **Without throttling** the page HTML is ready at 0.24 s and the main photo has downloaded by 0.48 s, but the first paint comes at about 1.0–1.2 s: the browser is busy starting React (hydration) before it paints. Under Lighthouse's 4× CPU slowdown this becomes the 3 s "render delay" in LCP.
- **Done this phase** (bytes, independent of machine speed):
  - Fonts 170 KB → 86 KB. The rupee sign (₹) was the only character from the larger character set on the page and pulled in an 84 KB font file; it now comes from a font already on the device where one exists.
  - Main photo 127 KB → 85 KB (Cloudinary "eco" quality for photos 640 px and wider).
  - Visitors who are not signed in no longer download the account dropdown library (about 30 KB compressed).
  - The main photos use `fetchPriority="high"` (Next 16 deprecated `priority`); the home hero is preloaded.
- **Next steps** to reach 85: measure on Vercel with PageSpeed Insights; reduce what React hydrates on content pages (the temple page HTML is 200 KB because the page data is also sent for hydration); consider prerendering the most visited temple pages. Recorded as an open item for Phase 10.

## Defects found and fixed

| # | Severity | Defect | Fix |
|---|---|---|---|
| 1 | High | The website sent no security headers: no Content Security Policy, no protection against being framed (clickjacking), no `nosniff` | CSP (scripts, images, frames and connections limited to the site, the API, Cloudinary, OpenStreetMap tiles and Razorpay), `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS on HTTPS. An E2E test checks the headers and that key pages load with no policy errors in all browsers |
| 2 | Medium | Payment verification had no per-user rate limit (spec: 30 per hour) | Added (`RATE_LIMIT_VERIFY_*`), with a test. The booking limit window also matched the spec only partly (20 per 15 minutes instead of per hour); now per hour |
| 3 | Medium | Admin bookings, payments and audit pages scrolled sideways on phones (date filters did not wrap) | Filters wrap; references no longer break over lines |
| 4 | Medium | Admin booking search slowed to p95 1.2 s with 10,000 bookings | References, emails and phone numbers now use indexed prefix or exact matches; p95 118 ms |
| 5 | Low | Admin list by status read 16 times more documents than shown | New index |
| 6 | Low | Next 16 deprecated `priority` on images, so the main photo was no longer marked high priority | `fetchPriority="high"` / `preload` |
| 7 | Low (tests) | E2E checks that depended on timing or on Chromium behaviour: hydration before "Book now", duplicate DOM while a page streams in (verify page failed one CI run in Phase 7; the map section failed the first Phase 9 CI run, 39505911921), Firefox page-load reporting, Safari Tab order, shared data between browsers | Fixed in the tests |

No critical or high defects are open. Open medium item: Lighthouse Performance (see above), with an owner decision needed on whether to measure on the deployed site first (recommended).

## Owner actions (needed for the release gate)

1. **Real phones:** open the site on an Android phone (Chrome) and an iPhone (Safari) on the same Wi-Fi (or after deployment) and go through: home, a temple, a tour, booking and payment (test mode), My bookings, and the e-ticket QR scan.
2. **Screen readers:** a short pass of the booking flow with NVDA (Windows, free) and VoiceOver (iPhone). I can write a step-by-step script for this.
3. **Content:** the gate asks for at least 60 published temples meeting the guidelines; 22 are drafted and await your review. Decide whether I should draft more (you review each) or lower the launch target.
4. **Legal pages:** review the privacy policy, terms and cancellation policy (a lawyer or consumer-law adviser is recommended before live payments).
5. Earlier items still open: new Razorpay test keys and one real test payment, a real inbox check of the confirmation email, credential rotation, Cloudinary clean-up, opening an exported CSV in Excel.
6. **Sign-off** once the above and Phase 10 (staging deployment) are done.

## Decisions recorded

ADR-035 (Content Security Policy without nonces, cross-browser runs opt-in, verify and booking rate limits, image and font weight rules, load-test script).
