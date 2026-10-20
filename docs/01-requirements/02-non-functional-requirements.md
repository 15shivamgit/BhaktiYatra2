# Non-Functional Requirements

| ID | Area | Requirement | Verification |
|---|---|---|---|
| NFR-PERF-01 | Performance | Temple and tour detail pages: Largest Contentful Paint ≤ 2.5 s on simulated 4G, production build | Lighthouse mobile |
| NFR-PERF-02 | Performance | API p95 latency ≤ 300 ms for list endpoints with 1000 temples and 10k bookings | Load test script in `10-testing/` |
| NFR-PERF-03 | Performance | Images served via Cloudinary transformations (`f_auto,q_auto`, width-limited); no original uploads served to visitors | Code review, network tab |
| NFR-PERF-04 | Performance | Lists paginated (default 12, max 50); no unbounded `find()` in public routes | Code review |
| NFR-SEC-01 | Security | All inputs validated by Zod; unknown fields stripped | Tests |
| NFR-SEC-02 | Security | Passwords hashed with bcrypt cost 12; hashes never serialised | Tests |
| NFR-SEC-03 | Security | Auth cookie `httpOnly`, `Secure` in production, `SameSite=Lax`; JWT 7-day expiry; secret ≥ 32 random bytes | Config review |
| NFR-SEC-04 | Security | Rate limits: auth 10/15 min per IP, contact 5/hour per IP, booking create 20/hour per user, global 300/15 min per IP | Tests |
| NFR-SEC-05 | Security | Helmet headers; CORS restricted to configured frontend origins with credentials | Tests |
| NFR-SEC-06 | Security | Uploads: MIME sniffed server-side, size capped, random file names, never executed or served from the API disk | Tests |
| NFR-SEC-07 | Security | No stack traces or Mongo errors in responses; errors mapped to codes | Tests |
| NFR-SEC-08 | Security | Secrets only in env; startup fails fast if a required var is missing | Tests |
| NFR-SEC-09 | Security | Razorpay secret and webhook secret never leave the server | Code review |
| NFR-SEC-10 | Security | Audit log for: admin login, temple/tour/departure publish and inventory change, booking status change, manual payment actions, role change | Tests |
| NFR-SEC-11 | Security | Dependency audit (`npm audit --omit=dev`) has no high/critical at release | CI |
| NFR-REL-01 | Reliability | Payment confirmation idempotent under duplicate and out-of-order events | Integration tests |
| NFR-REL-02 | Reliability | Hold-expiry and email-retry jobs are safe to run concurrently and after restarts | Tests |
| NFR-REL-03 | Reliability | API returns 503 from health when DB is unreachable; process restarts cleanly | Manual |
| NFR-REL-04 | Reliability | Mongo writes for booking confirmation use a transaction where multi-document (Atlas replica set supports it) | Code review |
| NFR-A11Y-01 | Accessibility | WCAG 2.1 AA for colour contrast, focus visibility, labels, keyboard operation of menus, dialogs, carousels | axe + manual |
| NFR-A11Y-02 | Accessibility | All images have alt text; decorative images `alt=""` | Content guidelines, tests |
| NFR-RESP-01 | Responsive | Layouts verified at 360, 390, 768, 1024, 1280, 1536 px; no horizontal overflow | Playwright screenshots |
| NFR-SEO-01 | SEO | Unique `<title>` and meta description per page; canonical URLs; Open Graph and Twitter cards; JSON-LD; sitemap.xml; robots.txt | Tests |
| NFR-SEO-02 | SEO | Public URLs are stable slugs; slug changes create 301 redirects | Tests |
| NFR-OBS-01 | Observability | Structured JSON logs (pino) with request id; Sentry for errors in both apps | Config |
| NFR-OBS-02 | Observability | Payment and inventory events logged at `info` with booking reference (no PII) | Code review |
| NFR-MAINT-01 | Maintainability | ESLint + Prettier pass in CI; no `console.log` in backend production code | CI |
| NFR-MAINT-02 | Maintainability | Test coverage ≥ 80 % on `services/` in backend | CI |
| NFR-MAINT-03 | Maintainability | API documented in `04-api/`; every route has a Zod schema that doubles as documentation | Review |
| NFR-DATA-01 | Data | Backups: Atlas daily snapshots retained 7 days (free tier limits noted) | Config |
| NFR-DATA-02 | Data | Personal data limited to name, email, phone, traveller name/age/gender; no ID numbers in v1 | Review |
| NFR-DATA-03 | Data | Booking records retained indefinitely; pending/expired bookings older than 90 days may be purged by a documented job | Decision log |
| NFR-COMPAT-01 | Compatibility | Last 2 versions of Chrome, Safari, Firefox, Edge; iOS Safari 16+; Android Chrome | Manual |
