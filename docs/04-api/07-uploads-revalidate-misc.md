# Uploads, Revalidation and Miscellaneous Contracts

## Image upload pipeline

Admin image endpoints (`/admin/temples/:id/images`, `/admin/tours/:id/images`, `/admin/circuits/:id/image`) share one middleware chain:

1. `multer` memory storage, `limits: { fileSize: 5 MB, files: 12 }`.
2. `file-type` sniff → allow `image/jpeg`, `image/png`, `image/webp` only (415 otherwise).
3. `sharp` (Should) to strip EXIF and cap longest edge at 2400 px before upload; otherwise rely on Cloudinary `limit` transformation on delivery.
4. `cloudinary.uploader.upload_stream` with `folder: bhaktiyatra/<env>/<entity>/<slug>`, `public_id: <nanoid>`, `resource_type: image`, `overwrite: false`.
5. Persist `{ url: secure_url, publicId, width, height, alt, order, isPrimary }`.

Delivery URLs in API responses are the stored `url`; the frontend's Cloudinary loader inserts `f_auto,q_auto,w_<size>,c_limit`.

## Generated documents

`documents.service` renders PDFs with pdfkit to a buffer, uploads with `resource_type: raw`, `type: private`, `folder: bhaktiyatra/<env>/documents/<year>/`, `public_id: ticket-<reference>` / `invoice-<number>`. Download endpoints fetch via signed URL server-side and stream to the client; the browser never sees Cloudinary document URLs.

## Frontend revalidation endpoint

`POST {FRONTEND_URL}/api/revalidate`  
Headers: `x-revalidate-secret: <REVALIDATE_SECRET>`  
Body: `{ "paths": ["/temples/kedarnath-rudraprayag", "/temples", "/sitemap.xml"] }`  
200 `{ "revalidated": true, "paths": [...] }`; 401 on bad secret. Implemented as a Next.js route handler calling `revalidatePath` for each path.

## Sitemap and robots

- `GET /sitemap.xml` (frontend) builds from `GET /temples?limit=50&page=n`, `/circuits`, `/tours` (published only) plus static pages. `lastmod` = `updatedAt`. Split into index + child sitemaps when > 5,000 URLs.
- `robots.txt`: allow all; disallow `/admin`, `/account`, `/api`; sitemap link. Staging sets `X-Robots-Tag: noindex` globally via env flag.

## Error contract for the frontend

The frontend API client normalises every non-2xx into `{ status, code, message, details, requestId }` and throws `ApiError`. UI maps common codes to messages from `messages/en.json` (`errors.SEATS_UNAVAILABLE`, …) with a generic fallback that includes the request id for support.

## Rate-limit headers

`RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset` (draft standard headers) on limited routes; 429 body uses the standard envelope with `code: RATE_LIMITED` and `details.retryAfterSec`.

## CORS

Allowed origins from `FRONTEND_URLS` (comma-separated). Methods `GET,POST,PATCH,DELETE,OPTIONS`. Headers `Content-Type, Idempotency-Key, X-Request-Id`. `credentials: true`. Preflight cached 10 min.
