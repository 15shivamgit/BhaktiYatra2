# Deployment Guide (staging and production)

How to put BhaktiYatra online on Vercel (website) and Render (API), with MongoDB Atlas. Written for the owner; follow the steps in order. Decisions behind it: ADR-036.

## How it fits together

```
Browser ──► Vercel website (bhaktiyatra.vercel.app)
               │  /api/v1/*  is forwarded (rewrite) ──► Render API (bhaktiyatra-api.onrender.com) ──► MongoDB Atlas
               │                                                     ├─► Cloudinary (images)
               └─ server-side page data ───────────────────────────►├─► Resend (email)
                                                                      └─◄ Razorpay webhooks (when payments are on)
```

- There is no own domain yet, so the browser only ever talks to the Vercel address. Vercel forwards `/api/v1/…` to Render. This keeps the login cookie a first-party cookie of the website, which browsers accept. With a domain later (`bhaktiyatra.in` and `api.bhaktiyatra.in`) the same setup keeps working.
- Two copies run side by side:

| | Staging (testing) | Production (public) |
|---|---|---|
| Website | Vercel project `bhaktiyatra-staging`, branch `shivam-kumar-dev` | Vercel project `bhaktiyatra`, branch `main` |
| API | Render service `bhaktiyatra-api-staging` (free plan) | Render service `bhaktiyatra-api` (free plan to start) |
| Database | Atlas database `bhaktiyatra_staging` | Atlas database `bhaktiyatra` |
| Payments | test mode with "simulate payment" buttons (`stub`) | closed: online booking off (`disabled`) |
| Search engines | hidden (`noindex`) | visible |

Free Render services sleep after 15 minutes without visitors; the first visit after that waits about a minute, and background jobs (seat-hold expiry, emails) pause while asleep. Fine for staging and for a content-only launch. **Upgrade the production API to Render Starter before turning online booking on.**

## Step 1. MongoDB Atlas (database users)

The old database user `15shivambgs_db_user` had its password published in the old code. Do not use it anywhere.

1. Atlas → your project → **Database Access** → **Add New Database User**:
   - Username `bhaktiyatra_staging`, password: **Autogenerate Secure Password**, copy it somewhere safe.
   - Built-in role: **Specific privileges** → `readWrite` on database `bhaktiyatra_staging`.
2. Same again: username `bhaktiyatra_prod`, `readWrite` on database `bhaktiyatra`.
3. **Delete the old user `15shivambgs_db_user`** (or at least change its password). Your local `backend/.env` uses it; I will switch local development to a new user when you give me one.
4. **Network Access** → **Add IP Address** → **Allow access from anywhere** (`0.0.0.0/0`). Render's free plan has no fixed outgoing addresses; the strong generated passwords protect the database.
5. **Database** → **Connect** → **Drivers** → copy the connection string and build two strings:
   - Staging: `mongodb+srv://bhaktiyatra_staging:<password>@<cluster>.mongodb.net/bhaktiyatra_staging?retryWrites=true&w=majority`
   - Production: `mongodb+srv://bhaktiyatra_prod:<password>@<cluster>.mongodb.net/bhaktiyatra?retryWrites=true&w=majority`

## Step 2. Render (API)

1. Render dashboard → **New** → **Blueprint** → connect GitHub and pick `15shivamgit/BhaktiYatra2`, branch `shivam-kumar-dev`. Render reads `render.yaml` and shows two services.
2. Render asks for the values marked "sync: false". Fill them for **each** service:

| Key | Staging | Production |
|---|---|---|
| `MONGO_URL` | staging string from step 1 | production string from step 1 |
| `FRONTEND_URLS` | `https://bhaktiyatra-staging.vercel.app` | `https://bhaktiyatra.vercel.app` |
| `SITE_URL` | same as above | same as above |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | from Cloudinary → Settings → API Keys | same |
| `RESEND_API_KEY` | from Resend → API Keys | same |
| `ADMIN_NOTIFY_EMAIL` | your email (alerts go here) | your email |
| `MAIL_REPLY_TO` | your support email | your support email |

   The Vercel addresses above assume those project names are free; if Vercel gives a different address in step 3, come back and change `FRONTEND_URLS` and `SITE_URL` (Service → Environment → Save, it redeploys).
3. Click **Apply**. Both services build. Production builds from branch `main`, which gets this code once the pull request is merged (step 5); until then it may fail, which is expected.
4. Note the two service addresses Render shows, for example `https://bhaktiyatra-api-staging.onrender.com`. Open `<address>/api/v1/health`: it should say `"status":"ok"` and `"db":"up"`.
5. For each service open **Environment** and copy the generated `REVALIDATE_SECRET` value (needed in Vercel).

## Step 3. Vercel (website), two projects

For each project: Vercel → **Add New** → **Project** → import `15shivamgit/BhaktiYatra2`.

- **Project name:** `bhaktiyatra-staging` (first) and `bhaktiyatra` (second).
- **Root Directory:** `frontend` (click Edit). Framework preset: Next.js. Leave build and install commands as they are.
- **Environment Variables** (before the first deploy):

| Key | Staging project | Production project |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://bhaktiyatra-staging.vercel.app` | `https://bhaktiyatra.vercel.app` |
| `NEXT_PUBLIC_API_BASE_URL` | `/api/v1` | `/api/v1` |
| `API_PROXY_TARGET` | staging Render address (no path) | production Render address |
| `API_BASE_URL_INTERNAL` | staging Render address + `/api/v1` | production Render address + `/api/v1` |
| `REVALIDATE_SECRET` | from Render staging | from Render production |
| `NEXT_PUBLIC_ENV` | `staging` | `production` |
| `NEXT_PUBLIC_FEATURE_BOOKING` | `true` | `false` |
| `NEXT_PUBLIC_GOOGLE_SIGNIN` | `false` | `false` |

- After the first deploy of `bhaktiyatra-staging`: **Settings → Git → Production Branch** = `shivam-kumar-dev`, then **Deployments → Redeploy**. (The production project keeps `main`.)
- **Settings → Functions → Function Region:** Mumbai (`bom1`), close to the Singapore API.
- If the address Vercel gives differs from the table, update `NEXT_PUBLIC_SITE_URL` here and `FRONTEND_URLS`/`SITE_URL` in Render, then redeploy both.

Google sign-in stays hidden until the Vercel address (or a domain) is added as a redirect URI in Google Cloud Console; see `09-config/03-third-party-services.md`.

## Step 4. Data (I run this with you)

Put two files in `backend/` (they are ignored by Git and never leave your computer):

`backend/.env.staging` and `backend/.env.production`, each with:

```
NODE_ENV=development
MONGO_URL=<the connection string for that environment>
JWT_SECRET=local-seeding-only-not-used-by-the-server-000000
FRONTEND_URLS=http://localhost:3000
SITE_URL=http://localhost:3000
REVALIDATE_SECRET=local-seeding-only
PAYMENTS_PROVIDER=stub
SEED_ADMIN_PASSWORD=<a strong password for your admin login>
```

Then (from `backend/`):

```bash
# Staging: indexes, your admin account, the 22 temples published, sample tours
node --env-file=.env.staging scripts/sync-indexes.js
node --env-file=.env.staging scripts/seed-admin.js --email <your email> --name "<your name>"
node --env-file=.env.staging scripts/seed-content.js
node --env-file=.env.staging scripts/seed-sample-tours.js

# Production: indexes, your admin account, the temples as DRAFTS until you have reviewed them
node --env-file=.env.production scripts/sync-indexes.js
node --env-file=.env.production scripts/seed-admin.js --email <your email> --name "<your name>"
node --env-file=.env.production scripts/seed-content.js --draft
```

Publish each temple in **Admin → Temples** after reading it (ADR-015). Sample tours are never loaded into production.

## Step 5. Production code (`main`)

Production deploys from `main`. I open a pull request from `shivam-kumar-dev` to `main`; when you merge it (or ask me to), Render and Vercel deploy production automatically. Later releases: work lands on `shivam-kumar-dev` (staging) first, is checked there, then goes to `main` the same way.

## Step 6. Check it (smoke test)

```bash
node scripts/smoke-test.mjs --site https://bhaktiyatra-staging.vercel.app --api https://bhaktiyatra-api-staging.onrender.com --staging --write
node scripts/smoke-test.mjs --site https://bhaktiyatra.vercel.app --api https://bhaktiyatra-api.onrender.com
```

It checks the API health (directly and through the website), the home, temple and tour pages, security headers, robots and sitemap, that requests from other sites are refused, and (staging, `--write`) that signing up sets a correct first-party cookie. Then by hand: log in, open Admin, browse on a phone.

## Turning online booking on later

1. Razorpay: new **test** keys first; webhook `https://<API address>/api/v1/webhooks/razorpay` with the events `payment.captured`, `payment.failed`, `order.paid`; copy the webhook secret.
2. Render (staging first): `PAYMENTS_PROVIDER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Test a booking on staging.
3. Production: upgrade the API to **Starter**, live keys after Razorpay KYC, the same four variables, then Vercel `NEXT_PUBLIC_FEATURE_BOOKING=true` and redeploy. Book a ₹1 test departure and refund it (`02-architecture/05-deployment.md`).

## With a domain later

Add the domain in Vercel (website) and `api.<domain>` in Render, then set `NEXT_PUBLIC_SITE_URL`, `FRONTEND_URLS` and `SITE_URL` to the new addresses. The `/api/v1` rewrite can stay; a verified domain in Resend lets emails reach every address.
