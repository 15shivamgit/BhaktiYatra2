# Security Specification

Security requirements are release blockers. IDs reference `01-requirements/02-non-functional-requirements.md`.

## 1. Credentials and secrets

- `.env` files are never committed. `.env.example` lists keys with empty values.
- **Immediate action before Phase 1:** rotate the MongoDB Atlas user password, Razorpay test keys and the Gmail credentials that were committed in the prototype; delete `backend/.env` from Git history (`git filter-repo` or BFG) and force-push after confirming with the owner. Until rotated, treat those credentials as public.
- CI runs `gitleaks` on every push.
- Production secrets live in Render and Vercel environment settings. No secrets in `NEXT_PUBLIC_*`.
- JWT secret: ≥ 32 random bytes, rotated by issuing a new secret and accepting both for 7 days (`JWT_SECRET`, `JWT_SECRET_PREVIOUS`).

## 2. Authentication

- Passwords: bcrypt cost 12. Minimum 8 characters; check against a short deny-list of common passwords.
- Login response never reveals whether email exists ("Invalid email or password").
- JWT payload: `{ sub: userId, role, iat, exp }`. Expiry 7 days. No PII beyond role.
- Cookie: `by_session`, `httpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`, `Domain=.<root-domain>` in prod.
- Logout clears the cookie and (Should) records `tokenInvalidBefore` on the user so older tokens are rejected.
- Password reset: random 32-byte token, stored hashed with 30-minute expiry, single use.
- `requireAuth` loads the user from DB (cached per request) and rejects if `isActive` is false or token issued before `tokenInvalidBefore`.

## 3. Authorisation

- `requireRole('admin')` on every `/admin/*` route and on write routes for temples, circuits, tours, departures.
- Ownership checks in services: bookings, tickets, invoices (`booking.user.equals(req.user.id) || isAdmin`).
- Frontend guards are UX only; the API is the enforcement point.

## 4. Input handling

- Zod schemas for every route; `.strict()` on bodies so unknown fields fail; coerce query params.
- `express-mongo-sanitize` to strip `$` and `.` from keys; `hpp` against parameter pollution.
- Rich text: `sanitize-html` with an allow-list (p, h2-h4, ul, ol, li, strong, em, a[href, rel=noopener], img[src from Cloudinary only], blockquote, br).
- Slugs: generated server-side, `[a-z0-9-]` only.
- File uploads: `multer` memory storage, 5 MB limit, max 12 files, MIME sniffed with `file-type`; only `image/jpeg`, `image/png`, `image/webp`. Filenames are never used; Cloudinary public ids are generated.

## 5. Transport and headers

- HTTPS everywhere (Vercel and Render provide TLS). HSTS via Helmet in production.
- Helmet defaults plus a CSP on the frontend that allows: self, Cloudinary images, OpenStreetMap tiles, Razorpay checkout script and frames, Sentry.
- CORS: `origin` = configured list (`FRONTEND_URLS`), `credentials: true`, methods limited, `maxAge` set.

## 6. CSRF

With `SameSite=Lax` cookies, cross-site POSTs from other origins do not carry the cookie in modern browsers. As defence in depth, state-changing routes also require the `Origin` header to match an allowed origin (middleware `requireTrustedOrigin`). The Razorpay webhook route is exempt (no cookie; signature-verified).

## 7. Rate limiting and abuse

| Scope | Limit |
|---|---|
| Global per IP | 300 / 15 min |
| `/auth/login`, `/auth/register`, `/auth/forgot-password` per IP | 10 / 15 min |
| `/contact` per IP | 5 / hour, plus honeypot field |
| `/bookings` create per user | 20 / hour |
| `/payments/verify` per user | 30 / hour |

Limits are configurable via env and disabled in tests. Behind Render's proxy, `trust proxy` is set to 1.

## 8. Payments

- Razorpay key secret and webhook secret only on the server.
- Order amount computed server-side from `departure.price × seats`; client-sent amounts are ignored.
- Client verify: `HMAC_SHA256(order_id + "|" + payment_id, keySecret) === signature` using constant-time compare; then confirm order id matches booking, fetch payment from Razorpay API (Should) to check `amount` and `status === 'captured'`.
- Webhook: raw body, `X-Razorpay-Signature` HMAC with webhook secret, constant-time compare; event id stored to drop duplicates.
- Confirmation is a single service method guarded by a unique index on `Payment.providerPaymentId` and a conditional update on `Booking.paymentStatus`.

## 9. Documents

- Ticket QR contains `ticketToken` = JWT (`{ ref, dep, exp }`) signed with a separate `TICKET_SIGNING_SECRET`. Verification endpoint returns minimal data; it never returns traveller names or contact details.
- PDFs stored in Cloudinary as `raw` with `type: 'authenticated'` or `private`; the API streams them after ownership check. Direct Cloudinary URLs are never exposed to the browser.

## 10. Logging and errors

- pino with redaction paths: `req.headers.cookie`, `req.headers.authorization`, `*.password`, `*.token`, `*.secret`.
- Errors: `AppError(code, status, message, details?)`. Unknown errors → 500 `INTERNAL_ERROR` with request id; details logged, not returned.
- Sentry scrubs the same fields.

## 11. Audit log

Write an `AuditLog` entry (actor, action, entity, before/after summary, ip, requestId) for: admin login, role change, user deactivation, temple/tour/departure create/update/publish/archive, inventory change, booking status change, manual payment actions, refund record. Audit writes happen in the same transaction as the change where possible.

## 12. Dependencies and CI

- `npm audit --omit=dev` must have no high/critical at release.
- Dependabot or Renovate weekly.
- CI: lint, test, build, gitleaks. Branch protection on `main` requiring CI.

## 13. Privacy

- Collect only what is needed (NFR-DATA-02). Privacy policy page explains data use.
- Users can request account deletion via contact; v1 handles manually (anonymise user, keep bookings for accounting).
- No third-party trackers in v1 beyond Sentry and optional Vercel analytics.

## 14. Fallback if cookies cannot be first-party

If frontend and API cannot share a parent domain, implement a Next.js route handler proxy at `/api/proxy/*` that forwards to the API and sets the cookie on the frontend domain. Document in the decision log before switching.
