# Third-Party Services Setup

Checklist per service. Owner creates accounts; credentials go only into env files or hosting dashboards.

## MongoDB Atlas

1. Create project `BhaktiYatra`. Clusters: shared M0 for dev/staging; production tier chosen at Phase 10.
2. Databases: `bhaktiyatra_dev`, `bhaktiyatra_staging`, `bhaktiyatra`.
3. One database user per environment with `readWrite` on its DB only. Strong generated passwords.
4. Network access: dev → your IP; staging/prod → Render outbound IPs.
5. **Rotate or delete the user from the prototype** (`15shivambgs_db_user`), whose password was committed publicly.

## Cloudinary

1. Create account; note cloud name, API key, secret.
2. Folders created automatically by uploads (`bhaktiyatra/<env>/…`).
3. Settings → Security: enable "Strict transformations" (Should) and restrict unsigned uploads (we never use them).
4. Free tier limits: monitor usage monthly.

## Razorpay

1. Test mode: generate fresh API keys (**old committed keys must be regenerated**).
2. Webhooks per environment (see local setup); store webhook secret.
3. Checkout settings: business name, logo, theme colour `#D9731F`.
4. Live mode: complete KYC; generate live keys only when Phase 10 starts; set them only in Render production env.
5. Auto-capture: keep enabled (Settings → Payment capture).

## Brevo (email)

1. Create account; add and verify sending domain; add SPF, DKIM, DMARC DNS records.
2. SMTP & API → SMTP credentials (login + SMTP key).
3. Sender `bookings@<domain>`; reply-to `support@<domain>`.
4. (Should) Webhook for bounces → future endpoint `POST /webhooks/brevo`.
5. Free tier daily limit: check against expected volume.

## Sentry

1. Organization `bhaktiyatra`; projects `web` (Next.js) and `api` (Node).
2. DSNs into env; environments `development`, `staging`, `production`.
3. Scrubbing: add `cookie`, `authorization`, `password`, `token`, `secret`, `razorpay_signature` to data scrubber fields.
4. Alerts: email on new issue in production.

## Vercel

1. Import GitHub repo; root directory `frontend`.
2. Production branch `main`; staging via `staging` branch domain.
3. Env variables per environment.
4. Domains: apex + `www` redirect.

## Render

1. New Web Service from repo; root `backend`; build `npm ci`; start `node src/server.js`; health check `/api/v1/health`.
2. Plan: Starter or higher (no sleeping).
3. Env variables; secret files not needed.
4. Custom domain `api.<domain>`.
5. Two services: staging (branch `staging`) and production (branch `main`).

## Google Search Console

Verify domain via DNS TXT at launch; submit `/sitemap.xml`.

## GitHub

1. Branch protection on `main` and `staging`: PR required, CI must pass.
2. Secret scanning and push protection enabled.
3. Dependabot weekly for both workspaces.
4. Repository secrets only for CI needs (none for v1 tests; all providers mocked).

## Credential inventory (fill privately, not in this repo)

Keep a password manager entry per service with: account owner email, 2FA method, recovery codes location. Enable 2FA on every account above.
