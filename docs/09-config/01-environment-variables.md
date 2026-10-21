# Environment Variables

Validated at startup by `backend/src/config/env.js` (zod). Missing or invalid required variables stop the process with a readable list. Never commit real values; `.env.example` files list keys only.

## Backend (`backend/.env`)

| Variable | Required | Example / default | Notes |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `development` \| `test` \| `staging` \| `production` |
| `PORT` | no | `5000` | Render sets this |
| `APP_VERSION` | no | `1.0.0` | shown in health |
| `MONGO_URL` | yes | `mongodb+srv://user:pass@cluster/bhaktiyatra_dev` | per-env database and user |
| `JWT_SECRET` | yes | 64 hex chars | `openssl rand -hex 32`; at least 32 characters |
| `JWT_SECRET_PREVIOUS` | no | | accepted during rotation |
| `JWT_EXPIRES_IN_DAYS` | no | `7` | session length |
| `BCRYPT_ROUNDS` | no | `12` | tests use `4` |
| `RATE_LIMIT_AUTH_MAX` | no | `10` | login/register/forgot/Google start per IP per window |
| `RATE_LIMIT_AUTH_WINDOW_MIN` | no | `15` | |
| `GOOGLE_CLIENT_ID` | no | `…apps.googleusercontent.com` | Google sign-in disabled when unset (ADR-020) |
| `GOOGLE_CLIENT_SECRET` | no | | server only |
| `GOOGLE_REDIRECT_URI` | no | `${SITE_URL}/api/auth/callback/google` | must be registered in Google Cloud Console |
| `COOKIE_DOMAIN` | prod | `.bhaktiyatra.in` | empty in dev |
| `FRONTEND_URLS` | yes | `http://localhost:3000` | comma-separated allowed origins |
| `SITE_URL` | yes | `http://localhost:3000` | used in emails and QR links |
| `REVALIDATE_SECRET` | yes | random | shared with frontend |
| `TICKET_SIGNING_SECRET` | yes (Phase 7) | random | separate from JWT |
| `PAYMENTS_PROVIDER` | no | `razorpay` | `stub` fakes orders for tests and offline development; `disabled` closes online booking (booking requests answer 503; content-only launch, ADR-036). The API refuses to start with `stub` when `NODE_ENV=production`, and with `razorpay` in staging or production unless all three `RAZORPAY_*` values are set |
| `TRUST_PROXY_HOPS` | no | `1` | proxies in front of the API: `1` for Render alone, `2` behind the Vercel `/api/v1` rewrite (ADR-036) |
| `RATE_LIMIT_WEBHOOK_MAX` | no | `600` | webhook requests per minute per IP |
| `RAZORPAY_KEY_ID` | yes (Phase 6) | `rzp_test_…` | public id |
| `RAZORPAY_KEY_SECRET` | yes (Phase 6) | | server only |
| `RAZORPAY_WEBHOOK_SECRET` | yes (Phase 6) | | set in Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` | yes (Phase 3) | | |
| `CLOUDINARY_API_KEY` | yes (Phase 3) | | |
| `CLOUDINARY_API_SECRET` | yes (Phase 3) | | |
| `CLOUDINARY_FOLDER` | no | `bhaktiyatra/dev` | per env |
| `RESEND_API_KEY` | yes (Phase 7) | `re_…` | Resend (ADR-018) |
| `MAIL_FROM` | yes (Phase 7) | `BhaktiYatra <onboarding@resend.dev>` until a domain is verified | |
| `MAIL_REPLY_TO` | no | `support@bhaktiyatra.in` | |
| `MAIL_PROVIDER` | no | `resend` when `RESEND_API_KEY` is set, else `console` | `console` logs emails instead of sending (offline development, E2E) |
| `RATE_LIMIT_TICKET_VERIFY_MAX` | no | `60` | ticket checks per minute per IP |
| `ADMIN_NOTIFY_EMAIL` | yes (Phase 7) | | receives admin alerts |
| `HOLD_MINUTES` | no | `15` | seat hold length; fractions are allowed for tests (the E2E server uses 1) |
| `RATE_LIMIT_BOOKING_MAX` / `RATE_LIMIT_BOOKING_WINDOW_MIN` | no | `20` / `60` | booking creations per user per window |
| `RATE_LIMIT_VERIFY_MAX` / `RATE_LIMIT_VERIFY_WINDOW_MIN` | no | `30` / `60` | payment verifications per user per window |
| `MAX_SEATS_PER_BOOKING` | no | `10` | |
| `BOOKING_CUTOFF_HOURS` | no | `24` | default for new departures |
| `RATE_LIMIT_ENABLED` | no | `true` | `false` in tests |
| `RATE_LIMIT_GLOBAL_MAX` | no | `300` | requests per window per IP |
| `RATE_LIMIT_GLOBAL_WINDOW_MIN` | no | `15` | window length in minutes |
| `JOBS_ENABLED` | no | `true` | `false` in tests; run jobs manually |
| `LOG_LEVEL` | no | `info` | `debug` in dev |
| `SENTRY_DSN` | no | | |
| `SEED_ADMIN_PASSWORD` | no | | only for seed script |

"yes (Phase n)" means required from that phase onward. Until then the env schema marks it optional; the schema is tightened in that phase.

## Frontend (`frontend/.env.local`)

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | `http://localhost:3000` | canonical URLs, OG |
| `NEXT_PUBLIC_API_BASE_URL` | yes | `http://localhost:5000/api/v1` | browser calls |
| `API_BASE_URL_INTERNAL` | when the public base is relative | same as above | server-side fetch; must be the absolute API address when `NEXT_PUBLIC_API_BASE_URL` is `/api/v1` |
| `API_PROXY_TARGET` | deployed without a shared domain | `https://bhaktiyatra-api.onrender.com` | the website forwards `/api/v1/*` to this address; set `NEXT_PUBLIC_API_BASE_URL=/api/v1` with it (ADR-036) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | no | `rzp_test_…` | the API also returns it; used for preloading only |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | yes (Phase 3) | | image loader |
| `REVALIDATE_SECRET` | yes (Phase 3) | | must match backend |
| `NEXT_PUBLIC_ENV` | no | `local` on localhost, else `production` | admin top bar shows it as a badge unless `production`; staging noindex |
| `NEXT_PUBLIC_GOOGLE_SIGNIN` | no | (unset = shown) | set to `false` to hide "Continue with Google" when the API has no Google credentials |
| `NEXT_PUBLIC_SENTRY_DSN` | no | | |
| `NEXT_PUBLIC_FEATURE_TOURS` | — | — | Removed in Phase 4: tours are always shown |
| `NEXT_PUBLIC_FEATURE_BOOKING` | no | `false` | `true` shows "Book now" on tour pages (Phase 5); until then an enquiry button. Removed once booking is live |

Rule: anything prefixed `NEXT_PUBLIC_` is visible to every visitor. Never put secrets there.

## Generating secrets

```bash
openssl rand -hex 32
# or, without openssl:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Per-environment differences

| Variable | Local | Staging | Production |
|---|---|---|---|
| `NODE_ENV` | development | staging | production |
| `COOKIE_DOMAIN` | (empty) | (empty: cookie set through the website rewrite) | (empty until a domain; then `.bhaktiyatra.in` if the API moves to `api.bhaktiyatra.in`) |
| `TRUST_PROXY_HOPS` | 1 | 2 | 2 |
| `PAYMENTS_PROVIDER` | stub or razorpay | stub (until new test keys) | disabled (until live keys) |
| `RAZORPAY_*` | test | test | live |
| `CLOUDINARY_FOLDER` | `bhaktiyatra/dev` | `bhaktiyatra/staging` | `bhaktiyatra/prod` |
| `MAIL_FROM` | Resend test sender | verified domain | verified domain |
| `LOG_LEVEL` | debug | info | info |
