# Phase 3 report: Temple Explore

**Date:** 2026-10-20 · **Branch:** `shivam-kumar-dev` · **Status:** built and tested; two exit criteria not met (Lighthouse mobile Performance, Rich Results Test), see below

## What was built

| Area | Result |
|---|---|
| Models | `Temple` (GeoJSON point with 2dsphere index, weighted text index, images, timings, aarti, festivals, how to reach, SEO, internal notes), `Circuit` (ordered temples, cover image), `SlugRedirect`, `Contact` |
| Public API | Temple list with search, state/deity/circuit/religion filters, `near` + radius, `bbox`, sorting; filter facets; detail with circuits and nearby temples; nearby endpoint; view beacon; circuits list and detail; contact form (honeypot, rate limit, admin notification); `GET /sitemap` |
| Admin API | Temples and circuits CRUD, publish prerequisites (`publishProblems`), publish / unpublish / archive, delete rules, slug rename with chain-free redirects, image upload (MIME sniffing, 5 MB, 12 max), alt / order / primary edits, image delete, circuit cover; contacts inbox with status changes; every change audited |
| Safety | Rich text sanitised to an allow-list (images only from Cloudinary, links get `rel="noopener noreferrer"`); only assets under `CLOUDINARY_FOLDER` are ever deleted from Cloudinary; revalidation secret compared in constant time |
| Content | 22 temples and 3 circuits (Char Dham, 12 Jyotirlingas in Dvadasha Stotra order, Bada Char Dham) drafted from research, with sources in internal notes; photos from the owner's Cloudinary library, each viewed before use. Seeded and published on the dev database |
| Public pages | Home (hero search, featured circuits and temples, browse by state, enquiry band), `/temples` (URL-synced filters, pagination, grid or map view, collapsible filters on phones), temple detail (gallery lightbox, quick facts, timings table, festivals, how to reach, rules, map, nearby, circuits, JSON-LD, Open Graph), `/circuits` and circuit detail (route order, map polyline), About, Contact, Privacy, Terms, Cancellation & refund, `sitemap.xml`, `robots.txt`, `/api/revalidate` |
| Admin pages | Temples list; create draft; tabbed editor (basics, content with Tiptap rich text, timings and festivals, reach and rules, location with map picker, photos, SEO and notes) with per-tab error counts, unsaved-changes guard, publish checklist; circuits list and editor with ordered temple picker and cover upload; contacts inbox |

## Tests run (results read from actual output)

| Command | Result |
|---|---|
| Backend `vitest run` | 15 files, 179 tests passed |
| Frontend `vitest run` | 6 files, 54 tests passed |
| `playwright test` (production build, desktop + mobile) | 78 passed, 4 skipped (admin journeys run on desktop only) |
| `npm run lint` / `format:check` | clean |
| `next build` | compiled |
| `npm audit --omit=dev` | 0 vulnerabilities |

New E2E journeys: J1 (filters combine, live in the URL, survive reload; map view; empty state), temple detail (practical sections, JSON-LD, canonical, `og:image`, lightbox, 404), J2 (circuit route order and polyline), contact form, static pages, sitemap, and J8 (admin creates a temple, sees what is missing, completes it, uploads a photo, publishes; the page appears publicly and in the sitemap; slug rename keeps the old address working; circuit builder; contacts inbox).

## Lighthouse (mobile, local production build, `lighthouse@12.8.2`)

Temple page `/temples/kedarnath-temple-rudraprayag`:

| Category | Target | Result |
|---|---|---|
| Performance | ≥ 85 | 63 to 67 over two runs (LCP 4.6 to 5.3 s, TBT about 650 ms, CLS 0.04) |
| Accessibility | ≥ 90 | 100 |
| Best practices | — | 100 |
| SEO | ≥ 95 | 92 with Lighthouse's default user agent; 100 with a crawler user agent |

- **Performance improved from 57 to 67** this phase by loading the map only when it nears the viewport and preconnecting to Cloudinary.
- **Remaining cost:** the hero photo arrives with the streamed page content, and React hydration is one 450 ms task under 4× CPU throttling. Next candidates: smaller hero photos (`q_auto:eco`, tighter `sizes`), fewer client components on the detail page, and measuring on the real host with a CDN. Local numbers include a slow simulated network to a local server, so they are only indicative.
- **SEO 92 is a measurement effect.** Next.js streams metadata into `<body>` for normal browsers and puts it in `<head>` for crawlers (ADR-026). Lighthouse 12 no longer identifies itself as a bot, so it misses the meta description.

## Bugs found and fixed during the phase

1. **Drafts could not be created without a description.** The model required it, so the admin "Create draft" failed with a raw Mongoose message. Drafts may now start empty; publishing still needs 200 characters. Found by the J8 E2E test; a backend test guards it.
2. **Slugs dropped letters with diacritics** ("ṅ"). Slugs are now Unicode-normalised first.
3. **Builds failed on dynamic routes** because client components read the pathname outside `<Suspense>` (navbar, then the admin layout).
4. **Guests caused 401 errors in the console** on every page. Added `GET /auth/session` (ADR-027).
5. **"View all" links failed colour contrast** on tinted sections (primary is 4.45:1 there). They now use the accent colour.
6. **Layout:** the temple hero hid the quick facts on phones, and the mobile filter panel filled the first screen. Fixed heights and a collapsible filter panel.
7. **Content:** several library photos were mislabeled (for example a Prem Mandir photo named as Ram Mandir) or watermarked. They were excluded.

## Exit criteria

| Criterion | Status |
|---|---|
| ≥ 10 temples and 3 circuits seeded and visible | Met: 22 temples, 3 circuits (dev database and E2E build) |
| Temple page Lighthouse mobile Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95 | **Partly met:** Accessibility 100; SEO 100 for crawlers, 92 under default Lighthouse; **Performance 63 to 67, not met** |
| Rich Results Test validates temple and breadcrumb JSON-LD | **Not done:** Google's tool needs a public URL. JSON-LD structure is checked in E2E (HinduTemple with geo and opening hours, BreadcrumbList) |
| Admin can create, upload images, publish; page appears in list, search, sitemap; revalidation observed | Met (J8 E2E; sitemap updates within seconds through the revalidation call) |
| Slug rename produces 301 | Met for the API (HTTP 301). The page redirects instantly but as a meta refresh, not an HTTP 301 status (ADR-026) |
| No horizontal scroll at test widths | Met (home, temple list, temple detail on desktop and Pixel 7) |
| axe clean on home, list, detail, circuit pages | Met (plus the admin temple editor) |
| All Phase 3 backend tests green | Met |

## Not done in this phase

- **Task 21, deleting `legacy/`:** waits for the owner's confirmation.
- **`upload-images.js`:** replaced by existing Cloudinary assets plus the admin uploader (ADR-028).
- **Drag and drop in the circuit editor:** move up and down buttons instead (ADR-028).

## Owner actions

1. **Review the drafted content** in `backend/scripts/data/temples.data.js` (or in the admin editor) before anything goes to production. Timings, fees and rules change; each temple's notes list the sources used.
2. **Upload larger photos.** Most library photos are about 300 px wide; heroes need 1600 px or more. Upload them in the admin editor's Photos tab.
3. **Run the Rich Results Test** once the site has a public URL.
4. **Confirm deleting `legacy/`.**
5. Still open from earlier phases: rotate the leaked credentials, and delete the personal files from Cloudinary.

## Decisions recorded

ADR-026 (render on first visit, in-page redirects, streamed metadata), ADR-027 (view beacon, `/auth/session`), ADR-028 (admin tools), ADR-023 addendum (primary colour on tinted backgrounds).
