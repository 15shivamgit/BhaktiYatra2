# Environment Variables

Validated at startup by `backend/src/config/env.js` (zod). Missing or invalid required variables stop the process with a readable list. Never commit real values; `.env.example` files list keys only.

## Backend (`backend/.env`)

| Variable | Required | Example / default | Notes |
|---|---|---|---|
| `NODE_ENV` | yes | `development` | `development` \| `test` \| `staging` \| `production` |
| `PORT` | no | `5000` | Render sets this |
| `APP_VERSION` | no | `1.0.0` | shown in health |
| `MONGO_URL` | yes | `mongodb+srv://user:pass@cluster/bhaktiyatra_dev` | per-env database and user |
| `JWT_SECRET` | yes | 64 hex chars | `openssl rand -hex 32` |
| `JWT_SECRET_PREVIOUS` | no | | accepted during rotation |
| `JWT_EXPIRES_IN` | no | `7d` | |
| `COOKIE_DOMAIN` | prod | `.bhaktiyatra.in` | empty in dev |
| `FRONTEND_URLS` | yes | `http://localhost:3000` | comma-separated allowed origins |
| `SITE_URL` | yes | `http://localhost:3000` | used in emails and QR links |
| `REVALIDATE_SECRET` | yes | random | shared with frontend |
| `TICKET_SIGNING_SECRET` | yes (Phase 7) | random | separate from JWT |
| `PAYMENTS_PROVIDER` | no | `razorpay` | `stub` in tests and Phase 5 |
| `RAZORPAY_KEY_ID` | yes (Phase 6) | `rzp_test_…` | public id |
| `RAZORPAY_KEY_SECRET` | yes (Phase 6) | | server only |
| `RAZORPAY_WEBHOOK_SECRET` | yes (Phase 6) | | set in Razorpay dashboard |
| `CLOUDINARY_CLOUD_NAME` | yes (Phase 3) | | |
| `CLOUDINARY_API_KEY` | yes (Phase 3) | | |
| `CLOUDINARY_API_SECRET` | yes (Phase 3) | | |
| `CLOUDINARY_FOLDER` | no | `bhaktiyatra/dev` | per env |
| `SMTP_HOST` | yes (Phase 7) | `smtp-relay.brevo.com` | Mailpit: `localhost` |
| `SMTP_PORT` | no | `587` | STARTTLS; Mailpit `1025` |
| `SMTP_SECURE` | no | `false` | `true` only for port 465 |
| `SMTP_USER` | yes (Phase 7) | | |
| `SMTP_PASS` | yes (Phase 7) | | |
| `MAIL_FROM` | yes (Phase 7) | `BhaktiYatra <bookings@bhaktiyatra.in>` | |
| `MAIL_REPLY_TO` | no | `support@bhaktiyatra.in` | |
| `ADMIN_NOTIFY_EMAIL` | yes (Phase 7) | | receives admin alerts |
| `HOLD_MINUTES` | no | `15` | |
| `MAX_SEATS_PER_BOOKING` | no | `10` | |
| `BOOKING_CUTOFF_HOURS` | no | `24` | default for new departures |
| `RATE_LIMIT_ENABLED` | no | `true` | `false` in tests |
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
| `API_BASE_URL_INTERNAL` | no | same as above | server-side fetch; can be a private URL |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | no | `rzp_test_…` | the API also returns it; used for preloading only |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | yes (Phase 3) | | image loader |
| `REVALIDATE_SECRET` | yes (Phase 3) | | must match backend |
| `NEXT_PUBLIC_ENV` | no | `development` | shows env badge in admin; staging noindex |
| `NEXT_PUBLIC_SENTRY_DSN` | no | | |
| `NEXT_PUBLIC_FEATURE_TOURS` | no | `false` | Phase 3 flag; removed in Phase 4 |
| `NEXT_PUBLIC_FEATURE_BOOKING` | no | `false` | Phase 4 flag; removed in Phase 5 |

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
| `COOKIE_DOMAIN` | (empty) | `.staging-domain` or proxy | `.bhaktiyatra.in` |
| `RAZORPAY_*` | test | test | live |
| `CLOUDINARY_FOLDER` | `bhaktiyatra/dev` | `bhaktiyatra/staging` | `bhaktiyatra/prod` |
| `SMTP_*` | Mailpit | Brevo | Brevo |
| `LOG_LEVEL` | debug | info | info |
