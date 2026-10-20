# Feature: Temple Explore

Requirements: FR-TEMPLE-01…11, FR-ADMINCONTENT-01…06. Phase 3.

## Purpose

The content heart of the platform. A visitor arriving from Google with a query like "Kedarnath temple timings" must get the answer above the fold, then be drawn into related content and, eventually, tours.

## User flows

### Flow A — Search-engine landing on a temple page
1. Visitor lands on `/temples/kedarnath-rudraprayag`.
2. Above the fold: name, deity, city/state, hero image, quick facts strip (darshan timings today, best time to visit, nearest railhead, entry fee).
3. Sticky in-page nav: Overview · Timings · Festivals · How to reach · Rules · Map · Nearby · Tours.
4. Sections render in that order. Map is lazy-loaded.
5. "Tours covering this temple" shows up to 3 TourCards with a link to filtered tours.
6. "Nearby temples" shows up to 6 cards with distance.
7. "Part of" shows circuit chips.

### Flow B — Browse and filter
1. Visitor opens `/temples`.
2. Left (desktop) or sheet (mobile) filter panel: search box, state, deity, circuit, featured toggle; "Map view" toggle.
3. Results grid of TempleCards with pagination; URL reflects filters (`?state=Uttarakhand&deity=Shiva&page=2`) so links are shareable and indexable.
4. Empty state suggests clearing filters and shows featured temples.

### Flow C — Circuit storytelling
1. `/circuits` lists circuits as large cards with region and temple count.
2. `/circuits/char-dham` shows description, then temples in order as a vertical route with numbering, each with a card and "Read more". A map plots the ordered points with a polyline.
3. "Tours covering this circuit" lists tours whose `temples` include ≥ 50 % of the circuit's temples (Should) or are tagged with the circuit (Must: admin selects circuit on tour).

### Flow D — Admin creates and publishes a temple
1. Admin → Temples → New. Form in tabs: Basics, Content, Timings & Festivals, Reach & Rules, Media, SEO.
2. Save as draft at any point (only Basics required).
3. Upload images (drag-drop, progress, alt text, set primary, reorder).
4. Click Publish → server validates prerequisites; on failure the UI lists missing items and jumps to the first tab with an issue.
5. On success, toast "Published. View page" with link; public page revalidated.

## Business rules

- Only `published` temples appear in public lists, search, nearby, sitemap and circuit pages.
- Archiving a temple hides it everywhere but keeps references (tours, circuits) intact for history; the admin UI shows an "archived" badge where referenced.
- Slug changes on published temples create a redirect; old URLs 301.
- Search relevance: text score, then featured, then viewCount.
- Nearby: within 100 km, excluding self, published only, max 6, sorted by distance.
- `viewCount` increments are fire-and-forget and exclude admin sessions and known bots (user-agent heuristic).
- Timings display "today" using IST; if the temple has seasonal timings, the admin encodes them as multiple labelled entries ("Summer (Apr–Oct)", "Winter (Nov–Mar)") and the UI shows all.

## Edge cases

| Case | Behaviour |
|---|---|
| Temple without coordinates | Cannot publish; admin sees inline error with a "pick on map" helper |
| Temple with only one image | Gallery shows single hero; no carousel controls |
| Circuit with an archived temple | Temple omitted publicly; admin circuit page shows warning |
| Search with no results | Empty state + suggestions (featured, popular states) |
| Very long description | Collapsed with "Read more" on mobile after ~600 px |
| Image upload partially fails | Successful ones saved; failed listed with reason; no duplicates on retry |
| Slug collision on create | 409; UI suggests `<slug>-2` |

## Acceptance criteria

- [ ] Temple detail page renders server-side; view-source shows title, meta description, OG tags, JSON-LD `HinduTemple`/`PlaceOfWorship` with `geo`, `openingHoursSpecification`, `image`.
- [ ] Lighthouse SEO ≥ 95 on detail and list pages.
- [ ] Filters combine and are reflected in the URL; back button restores previous filter state.
- [ ] Map view shows markers for current results; clicking a marker opens a mini card.
- [ ] Nearby returns correct ordering for a known fixture (3 temples at known distances).
- [ ] Admin cannot publish without prerequisites; error lists each missing item.
- [ ] Publishing revalidates the public page within 5 s (manual check) or 5 min (fallback).
- [ ] Old slug redirects with 301 after rename.
- [ ] All images have alt text; the admin form refuses empty alt on publish.

## Analytics (Should)

Track page views per temple (viewCount) and search terms with zero results (log line `search.empty` with query) to guide content work.
