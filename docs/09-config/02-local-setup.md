# Local Development Setup

Written for the owner's machine (Windows 11, VS Code) and works the same on macOS/Linux.

## Prerequisites

| Tool | Version | Check |
|---|---|---|
| Node.js | LTS (see `.nvmrc`) | `node -v` |
| npm | bundled | `npm -v` |
| Git | latest | `git --version` |
| GitHub CLI (optional) | latest | `gh --version` |
| Docker Desktop (optional) | latest | for Mailpit and local MongoDB |
| ngrok or cloudflared (Phase 6) | latest | webhook tunnel |

VS Code extensions (recommended, listed in `.vscode/extensions.json`): ESLint, Prettier, Tailwind CSS IntelliSense, MongoDB for VS Code, Playwright Test, Mermaid preview.

## First-time setup

```bash
git clone https://github.com/15shivamgit/BhaktiYatra2.git
cd BhaktiYatra2
npm ci                       # installs both workspaces
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
# fill values (see 01-environment-variables.md)
npm run seed:admin -w backend -- --email you@example.com --name "Your Name"
npm run dev                  # API :5000, web :3000
```

On Windows PowerShell use `Copy-Item` instead of `cp` if not using Git Bash.

## Database options

1. **Atlas dev database** (recommended): create `bhaktiyatra_dev` and a dedicated user; add your IP to the access list.
2. **Local MongoDB in Docker** (transactions need a replica set):
   ```bash
   docker run -d --name by-mongo -p 27017:27017 mongo:7 --replSet rs0
   docker exec by-mongo mongosh --eval "rs.initiate()"
   # MONGO_URL=mongodb://localhost:27017/bhaktiyatra_dev?replicaSet=rs0
   ```
Tests use `mongodb-memory-server` (replica set mode) and need no database.

## Email in development

Email goes through Resend (ADR-018, ADR-033). With `RESEND_API_KEY` set, the API sends real emails every minute from the queue. Until a domain is verified in Resend, the test sender (`onboarding@resend.dev`) can only deliver to the email address of the Resend account; other addresses fail and are retried three times. Set `MAIL_PROVIDER=console` to log emails instead of sending them. Password reset emails are sent immediately; with the console provider the reset link is logged in development.

## Razorpay test payments locally (Phase 6)

1. In the Razorpay Dashboard switch to **Test mode** → Account & Settings → API keys → generate a key. Put `RAZORPAY_KEY_ID` (starts with `rzp_test_`) and `RAZORPAY_KEY_SECRET` in `backend/.env` and set `PAYMENTS_PROVIDER=razorpay`.
2. Restart `npm run dev`. "Pay" on a booking now opens Razorpay Checkout; use the test cards or UPI id from Razorpay's test-mode documentation (for UPI, `success@razorpay` succeeds and `failure@razorpay` fails).
3. Without webhooks the client verify call still confirms bookings. Add the webhook (below) to test `payment.failed`, refunds and lost-verify recovery.
4. Without keys, keep `PAYMENTS_PROVIDER=stub`: bookings work and the payment step shows "Simulate payment" buttons.

## Razorpay webhooks locally (Phase 6)

```bash
ngrok http 5000
# Razorpay Dashboard (test mode) → Settings → Webhooks → add
#   URL: https://<ngrok-id>.ngrok-free.app/api/v1/webhooks/razorpay
#   Secret: same as RAZORPAY_WEBHOOK_SECRET
#   Events: payment.captured, payment.failed, order.paid, refund.processed
```
Copy the webhook secret into `RAZORPAY_WEBHOOK_SECRET` and restart the API. The Dashboard's webhook page shows each delivery and its HTTP status; "Resend" replays an event (the API answers `duplicate` and changes nothing). Cloudflare Tunnel works the same way: `cloudflared tunnel --url http://localhost:5000`.

Test cards and UPI ids: Razorpay test-mode documentation.

## Root scripts

| Script | Does |
|---|---|
| `npm run dev` | API + web concurrently with prefixed logs |
| `npm run lint` | ESLint both workspaces |
| `npm run format` | Prettier write |
| `npm test` | Backend + frontend unit/integration |
| `npm run test:e2e` | Playwright (starts both apps) |
| `npm run build` | Frontend production build; backend lint |

Backend workspace scripts: `seed:admin`, `seed:images`, `seed:content`, `seed:sample-tours`, `db:sync-indexes`, `db:reconcile`, `db:check-dashboard` (read-only: compares the admin dashboard figures with plain MongoDB queries; add `-- 30d` for another range), `test:load` (load test on an in-memory database with release-sized data; never touches a real database), `db:sync-indexes`, `db:backup` and `db:restore` (see the operations runbook). Deployment: `09-config/05-deployment-guide.md`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| API exits with "Invalid environment" list | Fill the listed keys in `backend/.env` |
| `MongoServerSelectionError` | IP not in Atlas access list, wrong password, or VPN |
| Transactions error "Transaction numbers are only allowed on a replica set" | Use Atlas or the replica-set Docker command |
| Login works but `/auth/me` returns 401 in browser | Frontend must call API with `credentials: 'include'`; `FRONTEND_URLS` must contain the exact origin |
| Images 400 from Next | `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` missing or `next.config.js` remotePatterns not set |
| Port in use on Windows | `netstat -ano | findstr :5000` then end the PID |
