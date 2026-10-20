# BhaktiYatra

Explore India's temples and book organised pilgrimage tours.

BhaktiYatra has two connected halves. **Explore** is an SEO-friendly directory of temples with darshan timings, history, festivals, how to reach and maps. **Travel** offers pilgrimage tours with dated departures, seat inventory, Razorpay payments, PDF tickets with QR codes and an admin back-office.

> **Status:** rebuild in progress. Phase 1 (Foundation) of 10. The previous prototype lives in `legacy/` for reference only.

## Documentation

Everything is specified in [`docs/`](docs/README.md) before it is built. Start with [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md). Development rules are in [`docs/CLAUDE.md`](docs/CLAUDE.md) and the phase plan is in [`docs/08-phases/`](docs/08-phases/00-roadmap.md).

## Tech stack

| Layer                | Technology                                           |
| -------------------- | ---------------------------------------------------- |
| Frontend             | Next.js (App Router), React, Tailwind CSS            |
| Backend              | Node.js 24, Express 5 (ES modules), Zod              |
| Database             | MongoDB Atlas with Mongoose                          |
| Images and documents | Cloudinary                                           |
| Payments             | Razorpay                                             |
| Email                | Resend                                               |
| Testing              | Vitest, Supertest, mongodb-memory-server, Playwright |

## Repository layout

```
backend/    Express API (/api/v1)
frontend/   Next.js app
docs/       Specification (source of truth)
legacy/     Old Vite + Express prototype, reference only; removed after Phase 3
```

## Run locally

Requirements: Node.js 24 (see `.nvmrc`) and npm.

```bash
npm ci
cp backend/.env.example backend/.env          # then fill in MONGO_URL at minimum
cp frontend/.env.example frontend/.env.local
npm run dev                                   # API on :5000, web on :3000
```

Check the API: <http://localhost:5000/api/v1/health>

Full setup and troubleshooting: [`docs/09-config/02-local-setup.md`](docs/09-config/02-local-setup.md).

## Scripts

| Command            | What it does                     |
| ------------------ | -------------------------------- |
| `npm run dev`      | Start API and web together       |
| `npm test`         | Backend and frontend tests       |
| `npm run test:e2e` | Playwright end-to-end tests      |
| `npm run lint`     | ESLint in both apps              |
| `npm run format`   | Prettier                         |
| `npm run build`    | Production build of the frontend |

## Security

Never commit `.env` files. Only `.env.example` files belong in Git.

## Contact

BhaktiYatra · Ramdiri-3, Begusarai, Bihar 851129 · +91 74888 81563 · 15shivambgs@gmail.com
