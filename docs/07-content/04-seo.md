# SEO Specification

Explore traffic is organic. Every public page must be crawlable, fast and unambiguous.

## URL structure

| Page | Pattern | Example |
|---|---|---|
| Temple | `/temples/<slug>` | `/temples/kedarnath-rudraprayag` |
| Temples by state | `/temples?state=<State>` | canonical to itself; also (Should) pretty alias `/temples/state/uttarakhand` |
| Temples by deity | `/temples?deity=<Deity>` | |
| Circuit | `/circuits/<slug>` | `/circuits/char-dham` |
| Tour | `/tours/<slug>` | `/tours/char-dham-yatra-10-days-from-delhi` |
| Static | `/about`, `/contact`, `/privacy`, `/terms`, `/refund-policy` | |

Slugs: lowercase, hyphenated, ASCII; include a place qualifier for temples (`<name>-<city>`). Renames create 301 redirects (SlugRedirect) handled by the API and surfaced by Next.js `redirect()` with status 301 in the page loader.

## Metadata per page type

| Page | `<title>` (≤ 60) | Description (≤ 160) | OG image |
|---|---|---|---|
| Home | "BhaktiYatra — Explore India's Temples & Book Pilgrimage Tours" | Brand line | `/og-default.jpg` |
| Temples list | "Temples in India — Timings, History, How to Reach \| BhaktiYatra" (+ " in <State>" when filtered) | dynamic | default |
| Temple | "<Name>, <City> — Timings, History & How to Reach" | first 155 chars of shortDescription | primary image (1200×630 crop via Cloudinary) |
| Circuit | "<Name> — Temples, Route & Guide" | shortDescription | image |
| Tours list | "Pilgrimage Tours & Yatra Packages \| BhaktiYatra" | | default |
| Tour | "<Title> — ₹<fromPrice> \| BhaktiYatra" | summary | primary |
| Account/Admin/Auth | generic, `noindex` | | |

Admin SEO tab overrides title/description per entity; otherwise generated.

## Structured data (JSON-LD)

- Site-wide: `Organization` (name, url, logo, contactPoint, sameAs), `WebSite` with `potentialAction: SearchAction` (`/temples?q={search_term_string}`).
- Temple: `HinduTemple` (or `PlaceOfWorship` for non-Hindu) with `name`, `description`, `image[]`, `address` (`PostalAddress`), `geo` (`GeoCoordinates`), `openingHoursSpecification[]` from timings, `url`, `telephone` if any, `isAccessibleForFree`.
- Circuit: `ItemList` of temple `ListItem`s with positions + `CollectionPage`.
- Tour: `TouristTrip` with `name`, `description`, `itinerary` (`ItemList` of `TouristAttraction`/places), `offers` (`Offer` per upcoming departure: `price`, `priceCurrency`, `availability`, `validFrom`, `url`), `provider: Organization`.
- Breadcrumbs: `BreadcrumbList` on all detail pages.
- FAQ: `FAQPage` on tour pages with FAQs.

Validate with Google's Rich Results Test during Phase 3/4 QA.

## Sitemaps and robots

- `/sitemap.xml` index → `/sitemaps/static.xml`, `/sitemaps/temples.xml`, `/sitemaps/circuits.xml`, `/sitemaps/tours.xml`; `lastmod` from `updatedAt`; regenerated per request with 1 h cache; on-demand revalidate on publish.
- `robots.txt`: `Allow: /`, `Disallow: /admin, /account, /api, /verify`, `Sitemap:` absolute URL. Staging: `Disallow: /` and `X-Robots-Tag: noindex`.

## Rendering and performance

- Public pages: Server Components whose data comes from `'use cache'` functions with `cacheLife` (~5 min) and cache tags (ADR-022). No client-side-only content for primary text.
- Images: `next/image` with Cloudinary loader; explicit `width/height`; LCP image `priority`.
- Core Web Vitals targets: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 (reserve image space, no layout shift from late fonts: `size-adjust` fallback).

## Internal linking

- Temple → circuits, nearby temples, tours covering it, state listing, deity listing.
- Circuit → each temple, tours covering circuit.
- Tour → each temple covered, circuit.
- Footer → top states, top circuits, top tours (static list refreshed quarterly).
- Breadcrumbs on all detail pages.

## Content for search intent

Temple pages answer, in order: timings, how to reach, best time, what to expect, history. Section headings use natural query phrasing: "Kedarnath temple timings", "How to reach Kedarnath".

## Indexing hygiene

- Canonical on every page; filtered list pages canonical to their own filtered URL only for `state`/`deity`/`circuit` single filters; combinations and `sort` canonicalise to the single-filter or base URL.
- `page=1` canonicalises to the base URL.
- 404 for unpublished/archived content; 410 is not used.
- No duplicate content between circuit and temple pages (circuit text is about the journey, not a copy of temple descriptions).

## Measurement

- Google Search Console verified at launch; sitemap submitted.
- Optional privacy-friendly analytics (Vercel Analytics or Plausible) — decision pending (OQ in decision log when chosen).
