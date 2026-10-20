# Technology Stack

Versions below are targets. In Phase 1, install the latest stable release that satisfies the row, then **pin** it in `package.json` (exact version) and commit the lockfile. Node LTS at Phase 1 start (expected Node 22).

## Frontend (`frontend/`)

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 16 (App Router, Turbopack, Cache Components) | Server Components for public pages; `'use cache'` for public data (ADR-022) |
| Language | JavaScript + JSDoc | No TypeScript (ADR-002) |
| Styling | Tailwind CSS 4 | Tokens in `app/globals.css` `@theme`; no `tailwind.config.js` (ADR-022) |
| Components | shadcn/ui (Radix primitives) | Copy-in components; consistent, accessible |
| Icons | lucide-react | Single icon set; drop react-icons |
| Forms | react-hook-form + zod | Shared schemas with API where practical |
| Data fetching | native `fetch` (server), TanStack Query (client admin/account) | Cache keys per entity |
| Maps | react-leaflet + OpenStreetMap tiles | No API key; cluster plugin for list map |
| Carousel | embla-carousel-react | Replaces react-slick |
| Rich text (admin) | Tiptap | Output sanitised server-side |
| Toasts | sonner | Replaces `alert()` |
| Tables (admin) | TanStack Table | Sorting, pagination |
| Dates | date-fns + date-fns-tz | Display in Asia/Kolkata |
| SEO | Next metadata API, `next-sitemap` or route handler | JSON-LD via helper |
| i18n (later) | next-intl | Strings in `messages/en.json` from day one |
| Errors | @sentry/nextjs | DSN via env |
| Testing | Vitest + React Testing Library; Playwright | See `10-testing/` |

## Backend (`backend/`)

| Concern | Choice | Notes |
|---|---|---|
| Runtime | Node.js 24 LTS, ES modules | `"type": "module"`; `.nvmrc` = 24 |
| Framework | Express 5 | Async errors handled natively (ADR-019) |
| Database | MongoDB Atlas + Mongoose 9 | Transactions on replica set |
| Validation | zod | Middleware `validate({ body, query, params })` |
| Auth | jsonwebtoken, bcryptjs (cost 12), cookie-parser | httpOnly cookie |
| Security | helmet, cors, express-rate-limit; custom `sanitizeBody` + `simple` query parser | mongo-sanitize/hpp incompatible with Express 5 (ADR-019) |
| Uploads | multer (memory) → cloudinary SDK | MIME sniff with `file-type` |
| Payments | razorpay SDK + node `crypto` for HMAC | Raw body for webhook route |
| PDF | pdfkit | Fonts bundled (Noto Sans for ₹ and Devanagari later) |
| QR | qrcode | Signed token payload |
| Email | Resend SDK (ADR-018); handlebars templates | Plain-text fallback |
| Jobs | node-cron | Hold expiry (1 min), email retry (1 min), reconciliation (hourly) |
| Logging | pino + pino-http | Request id, no PII |
| Errors | @sentry/node | |
| HTML sanitising | sanitize-html | For rich text fields |
| Slugs | slugify | |
| IDs | nanoid (custom alphabet) | Booking references |
| Env | Node `--env-file-if-exists` + zod env schema | Fail fast; no dotenv (ADR-019) |
| Testing | Vitest + Supertest + mongodb-memory-server | Provider mocks |
| Lint/format | ESLint (flat config) + Prettier | Shared root config |

## Tooling and infrastructure

| Concern | Choice |
|---|---|
| Monorepo | npm workspaces (`frontend`, `backend`), root scripts with `concurrently` |
| Git hosting | GitHub |
| CI | GitHub Actions: lint, test, build on PR; secret scan with gitleaks |
| Frontend hosting | Vercel |
| API hosting | Render (web service) |
| Database | MongoDB Atlas (M0 for dev/staging, M10+ for production when traffic justifies) |
| Files | Cloudinary |
| Email | Brevo (SMTP relay) |
| Monitoring | Sentry; Render logs; Vercel analytics (optional) |
| Local email testing | Mailpit (Docker) or Brevo test inbox |
| Webhook testing | ngrok or Cloudflare Tunnel |

## Removed from the old stack

`react-slick`, `slick-carousel`, `lightgallery`, `react-icons`, `react-scroll-to-top`, `razorpay` (frontend package), `@dataconnect/generated` (both apps), `express-validator`, `mongodb` driver direct dependency, `nodemon` (use `node --watch`).

## Rules

1. Add a dependency only if it appears here or is approved and added here first.
2. Pin exact versions; upgrade deliberately with a changelog read.
3. No `npm install -g` requirements beyond Node and npm.
4. Both apps must run with a single `npm run dev` from the repo root.
