# Folder Structure

Target structure after Phase 1. Adjust names only with a decision-log entry.

```
BhaktiYatra2/
├── frontend/                         # Next.js app
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.jsx              # Home
│   │   │   ├── temples/
│   │   │   │   ├── page.jsx          # List + filters
│   │   │   │   └── [slug]/page.jsx   # Detail
│   │   │   ├── circuits/
│   │   │   │   ├── page.jsx
│   │   │   │   └── [slug]/page.jsx
│   │   │   ├── tours/
│   │   │   │   ├── page.jsx
│   │   │   │   └── [slug]/
│   │   │   │       ├── page.jsx
│   │   │   │       └── book/page.jsx # Booking form (auth required)
│   │   │   ├── about/page.jsx
│   │   │   ├── contact/page.jsx
│   │   │   ├── privacy/page.jsx
│   │   │   ├── terms/page.jsx
│   │   │   └── refund-policy/page.jsx
│   │   ├── (auth)/
│   │   │   ├── login/page.jsx
│   │   │   ├── register/page.jsx
│   │   │   ├── forgot-password/page.jsx
│   │   │   └── reset-password/page.jsx
│   │   ├── (account)/
│   │   │   └── account/
│   │   │       ├── page.jsx                     # Profile
│   │   │       ├── bookings/page.jsx
│   │   │       └── bookings/[reference]/page.jsx
│   │   ├── admin/
│   │   │   ├── layout.jsx           # Guard + sidebar
│   │   │   ├── page.jsx             # Dashboard
│   │   │   ├── temples/…            # list, new, [id]
│   │   │   ├── circuits/…
│   │   │   ├── tours/…              # list, new, [id], [id]/departures
│   │   │   ├── bookings/…           # list, [id]
│   │   │   ├── users/page.jsx
│   │   │   ├── contacts/page.jsx
│   │   │   └── audit/page.jsx
│   │   ├── api/revalidate/route.js  # On-demand ISR, secret-protected
│   │   ├── sitemap.js
│   │   ├── robots.js
│   │   ├── layout.jsx
│   │   ├── not-found.jsx
│   │   └── error.jsx
│   ├── components/
│   │   ├── ui/                      # shadcn primitives
│   │   ├── layout/                  # Navbar, Footer, Container, AdminSidebar
│   │   ├── temples/                 # TempleCard, TempleFilters, TimingsTable, TempleMap
│   │   ├── tours/                   # TourCard, ItineraryAccordion, DepartureList
│   │   ├── bookings/                # BookingForm, TravellerFields, HoldCountdown, PaymentStatus
│   │   ├── admin/                   # DataTable, ImageUploader, RichTextEditor, StatusBadge
│   │   └── seo/                     # JsonLd
│   ├── lib/
│   │   ├── api/
│   │   │   ├── server.js            # fetch wrapper for Server Components
│   │   │   ├── client.js            # fetch wrapper with credentials for Client Components
│   │   │   └── endpoints.js         # typed-ish functions per resource
│   │   ├── auth/                    # useUser hook, guards
│   │   ├── schemas/                 # zod form schemas
│   │   ├── format.js                # money, dates
│   │   ├── constants.js
│   │   └── razorpay.js              # loadCheckout()
│   ├── hooks/
│   ├── messages/en.json
│   ├── public/                      # favicon, og-default.jpg, static images
│   ├── styles/globals.css
│   ├── tests/                       # Vitest + RTL
│   ├── e2e/                         # Playwright
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env.example
│
├── backend/                          # Express API
│   ├── src/
│   │   ├── app.js                   # express app factory (no listen)
│   │   ├── server.js                # loads env, connects DB, starts jobs, listens
│   │   ├── config/
│   │   │   ├── env.js               # zod-validated env
│   │   │   ├── db.js
│   │   │   ├── logger.js
│   │   │   └── constants.js         # HOLD_MINUTES, MAX_SEATS, etc.
│   │   ├── middleware/
│   │   │   ├── auth.js              # requireAuth, optionalAuth, requireRole
│   │   │   ├── validate.js
│   │   │   ├── rate-limit.js
│   │   │   ├── error-handler.js
│   │   │   ├── request-id.js
│   │   │   └── upload.js            # multer memory + mime check
│   │   ├── modules/                 # feature-first grouping
│   │   │   ├── auth/      {auth.routes.js, auth.controller.js, auth.service.js, auth.schemas.js}
│   │   │   ├── users/
│   │   │   ├── temples/
│   │   │   ├── circuits/
│   │   │   ├── tours/
│   │   │   ├── departures/
│   │   │   ├── bookings/
│   │   │   ├── payments/  {payments.routes.js, webhooks.routes.js, …}
│   │   │   ├── documents/ {ticket.service.js, invoice.service.js, pdf/…}
│   │   │   ├── notifications/ {email.service.js, templates/…}
│   │   │   ├── contacts/
│   │   │   ├── admin/     {dashboard, audit}
│   │   │   └── health/
│   │   ├── models/                  # Mongoose schemas (one file per model)
│   │   ├── providers/               # razorpay, cloudinary, mail
│   │   ├── jobs/                    # expire-holds.job.js, retry-emails.job.js, reconcile.job.js
│   │   ├── utils/                   # AppError, asyncHandler, slug, reference, money
│   │   └── routes.js                # mounts all module routers under /api/v1
│   ├── scripts/
│   │   ├── seed-admin.js
│   │   ├── seed-content.js          # temples + circuits from docs/07-content
│   │   └── reconcile-inventory.js
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── helpers/                 # test app, db setup, factories, provider mocks
│   ├── package.json
│   └── .env.example
│
├── docs/                             # this documentation
├── legacy/                           # old prototype (Phase 1 → deleted end of Phase 3)
├── .github/workflows/ci.yml
├── .gitignore
├── .editorconfig
├── eslint.config.js
├── .prettierrc
├── package.json                      # workspaces + root scripts
└── README.md
```

## Naming rules

- Files and folders: `kebab-case`. React components: `PascalCase.jsx`.
- Backend module files: `<module>.<layer>.js` (`bookings.service.js`).
- Models: singular `PascalCase` (`Booking.js`), collection names plural lowercase (Mongoose default).
- Tests mirror source paths: `tests/unit/modules/bookings/bookings.service.test.js`.

## What never goes in the repo

`.env*` (except `.env.example`), `node_modules`, `.next`, `coverage`, `uploads/`, `tickets/`, OS files, editor settings other than `.vscode/extensions.json`.
