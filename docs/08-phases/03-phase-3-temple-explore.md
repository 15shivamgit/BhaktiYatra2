# Phase 3 — Temple Explore

**Goal:** the public explore experience and the admin tools to fill it. This is the first phase the public would see. Specs: `05-features/01-temple-explore.md`, `04-api/03-temples-circuits.md`, `06-design/*`, `07-content/*`.

## Tasks

### Backend
1. Models: `Temple`, `Circuit`, `SlugRedirect`, `Contact` with indexes.
2. Cloudinary provider + upload middleware (memory, size, MIME sniff).
3. Temples service: list with filters/search/geo/bbox, filters facets, detail with circuits/nearby (tours empty until Phase 4), slug redirects, view count.
4. Admin temples: CRUD, publish prerequisites, unpublish, archive, delete rules, images upload/update/delete, rich text sanitisation, slug rename redirect.
5. Circuits service + admin CRUD + ordering + publish rule.
6. Revalidation client (API → frontend) with secret.
7. Contact endpoint with honeypot and rate limit; admin contacts list/patch (minimal).
8. Scripts: `upload-images.js`, `seed-content.js` with sample of 10 ★ temples and 3 circuits for development.
9. Tests: list filters, text search ordering, nearby distances (fixture), publish prerequisites, slug redirect, image limits and MIME rejection (mocked Cloudinary), sanitisation strips scripts, contact honeypot.

### Frontend: public
10. Final Navbar, Footer, Container, SectionHeading.
11. Home page per `06-design/02-page-specs.md` (tour section shows placeholder "Tours coming soon" hidden behind a feature flag until Phase 4).
12. `/temples` list with filters (URL-synced), pagination, grid/map toggle.
13. `/temples/[slug]` detail with all sections, gallery lightbox, timings table, map, nearby, circuits, JSON-LD, metadata, 301 handling.
14. `/circuits` and `/circuits/[slug]` with route layout and map polyline.
15. Static pages: About, Contact (form, with business details from `PROJECT_CONTEXT.md`), Privacy, Terms (drafts marked for owner review), Cancellation & Refund (text from `07-content/05-cancellation-refund-policy.md`).
15a. Content: Claude researches and drafts the ★ temples and launch circuits into `backend/scripts/data/` per ADR-015; owner reviews before seeding.
16. `sitemap.js` (temples, circuits, static), `robots.js` final, `/api/revalidate` route handler.
17. Reuse from `legacy/`: hero/feature imagery and section ideas, only images with confirmed rights.

### Frontend: admin
18. Admin temples list, create/edit tabbed form, image uploader, rich text editor, map picker, publish flow with prerequisite errors, SEO tab with preview.
19. Admin circuits list and form with drag-order temple picker.
20. Admin contacts inbox (basic).

### Cleanup
21. Delete `legacy/` once nothing more is needed from it (owner confirms), record in decision log. **Done 2026-10-20 (ADR-029).**

## Exit criteria

Status on 2026-10-20 (details in `10-testing/reports/phase-3.md`):

- [x] ≥ 10 temples and 3 circuits seeded and visible on staging-like local build.
- [ ] Temple page: Lighthouse mobile Performance ≥ 85, Accessibility ≥ 90, SEO ≥ 95. (Accessibility 100, SEO 100 for crawlers; Performance 63–67 locally.)
- [ ] Rich Results Test validates temple and breadcrumb JSON-LD (manual, record screenshot).
- [x] Admin can create → upload images → publish a temple; page appears in list, search, sitemap; revalidation observed.
- [x] Slug rename produces 301. (API status 301; page redirect is a meta refresh, ADR-026.)
- [x] No horizontal scroll at the test matrix widths (Playwright check).
- [x] axe clean on home, list, detail, circuit pages.
- [x] All Phase 3 backend tests green.
