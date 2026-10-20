# Temples and Circuits API

Requirements: FR-TEMPLE-01…11, FR-ADMINCONTENT-01…06.

## Shapes

**TempleCard** (lists):
```json
{ "id", "slug", "name", "deity", "city", "state", "shortDescription", "primaryImage": { "url", "alt", "width", "height" }, "featured", "location": { "lat", "lng" } | null }
```

**TemplePublic** (detail): all public fields from the model (no `createdBy`, `updatedBy`, `viewCount` internal), `images[]` ordered, plus:
```json
{ "circuits": [ { "id", "slug", "name" } ], "nearby": [ TempleCard… ], "tours": [ TourCard… ] }
```

**CircuitCard**: `{ id, slug, name, shortDescription, image, region, templeCount, featured }`  
**CircuitPublic**: CircuitCard + `description` + `temples: [TempleCard…]` in order.

---

## Public

### GET /temples
Query: `q`, `state`, `deity`, `circuit` (slug), `featured` (bool), `religion`, `near` (`lat,lng`), `radiusKm` (default 50, max 300, requires `near`), `bbox` (`minLng,minLat,maxLng,maxLat` for map view), `page`, `limit`, `sort` (`relevance` default when `q`, else `-featured,-publishedAt`; also `name`, `-viewCount`)  
200: `data: TempleCard[]`, `meta` pagination. Only `status: published`.

### GET /temples/filters
200: `{ "states": [ { "value": "Uttarakhand", "count": 12 } ], "deities": [...], "circuits": [ { "slug", "name", "count" } ] }` computed from published temples; cached 10 min.

### GET /temples/:slug
200: `TemplePublic`. If slug matches a `SlugRedirect`, respond 301 with `Location: /temples/<toSlug>` (the frontend follows and emits a real 301).  
Side effect: increments `viewCount` asynchronously.  
404 if not published (admin preview uses the admin endpoint).

### GET /temples/:slug/nearby
Query: `limit` (default 6, max 12), `radiusKm` (default 100)  
200: `TempleCard[]` ordered by distance, each with `distanceKm`.

### GET /circuits
Query: `featured`, `page`, `limit`  
200: `CircuitCard[]`.

### GET /circuits/:slug
200: `CircuitPublic`. 301 on redirect, 404 if not published.

---

## Admin

All require `role: admin`. Return full documents (`TempleAdmin` = full model fields).

### GET /admin/temples
Query: `q`, `status`, `state`, `deity`, `page`, `limit`, `sort` (`-updatedAt` default)  
200: list with `meta`.

### POST /admin/temples
Body: any subset of writable model fields; `name`, `deity`, `state`, `city`, `shortDescription`, `description` required. `slug` optional (auto). `status` is ignored on create (always `draft`).  
201: `TempleAdmin`. Audit `temple.create`.  
Errors: 409 `SLUG_TAKEN`, 422.

### GET /admin/temples/:id
200: `TempleAdmin`.

### PATCH /admin/temples/:id
Body: any writable fields. Changing `slug` on a published temple creates a `SlugRedirect`. Rich text sanitised.  
200: `TempleAdmin`. Audit `temple.update` with changed keys.

### POST /admin/temples/:id/publish
Validates publish prerequisites (location, ≥1 image, description ≥ 200 chars, ≥1 timing).  
200: `TempleAdmin` with `status: published`, `publishedAt`. Triggers frontend revalidation. Audit `temple.publish`.  
Errors: 422 `PUBLISH_PREREQUISITES` with `details` listing missing items.

### POST /admin/temples/:id/unpublish
200: `status: draft`. Revalidate. Audit.

### POST /admin/temples/:id/archive
200: `status: archived`. Temple removed from circuits' public output (kept in array). Audit.

### DELETE /admin/temples/:id
Allowed only when `status: draft` and not referenced by any tour or circuit. 204. Otherwise 409 `HAS_REFERENCES`.

### POST /admin/temples/:id/images
Multipart `files[]` (≤ 12 total after upload, each ≤ 5 MB, jpeg/png/webp), optional JSON field `alts[]`.  
201: updated `images[]`. First image ever uploaded becomes primary.  
Errors: 413, 415, 422 `IMAGE_LIMIT`.

### PATCH /admin/temples/:id/images
Body: `{ "images": [ { "publicId", "alt", "order", "isPrimary" } ] }` — full replacement of metadata for existing images (reorder, alt, primary).  
200: `images[]`. Exactly one `isPrimary` enforced.

### DELETE /admin/temples/:id/images/:publicId
204. Deletes from Cloudinary. If primary was deleted, first remaining becomes primary.

### Circuits (same pattern)
- `GET /admin/circuits`, `POST /admin/circuits`, `GET /admin/circuits/:id`, `PATCH /admin/circuits/:id` (body may include ordered `temples: [id]`), `POST /admin/circuits/:id/publish` (≥ 2 published temples), `/unpublish`, `/archive`, `DELETE` (draft only), `POST /admin/circuits/:id/image` (single).

---

## Revalidation hook (API → frontend)

After publish/unpublish/archive/update of published content, the API calls `POST {FRONTEND_URL}/api/revalidate` with header `x-revalidate-secret` and body `{ "paths": ["/temples/<slug>", "/temples", "/circuits/<slug>", "/sitemap.xml"] }`. Failure is logged, not surfaced (time-based revalidation is the fallback).
