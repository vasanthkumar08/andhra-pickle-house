# Architecture Overview

## Existing stack (preserved)

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 App Router, Framer Motion, Tailwind 4, Zustand |
| Backend | Express 5, Prisma 6, Zod validation |
| Database | PostgreSQL (compatible with **Supabase Postgres**) |
| Cache | Redis (optional in dev) |
| Auth | Phone OTP → JWT + HttpOnly refresh cookies |

## Separation of concerns

- **Frontend**: UI, animations, form input, calls `/api/v1/*` only.
- **Backend**: All pricing, stock, orders, OTP, admin RBAC, analytics.
- **Database**: Prisma ORM → PostgreSQL (point `DATABASE_URL` at Supabase).

## Local development workflow

Run services in separate terminals for production-like feedback:

| Command | Purpose |
|---------|---------|
| `npm run dev:split` | Opens dedicated API and WEB PowerShell terminals on Windows |
| `npm run dev:backend` | Express API on `API_PORT` (default `4000`) |
| `npm run dev:frontend` | Next.js app on `WEB_PORT` (default `3000`) |
| `npm run dev:combined` | API and WEB in one terminal via `concurrently` |
| `npm run dev:worker` | Queue worker connected to Redis/BullMQ |
| `npm run typecheck` | TypeScript validation for shared, API, and web |
| `npm run lint` | ESLint validation for the web app |

The API startup sequence validates env with Zod, checks port availability, connects
PostgreSQL/Supabase, Redis, and Cloudinary, then prints timestamped colored startup
logs with environment mode and startup duration. Missing local infrastructure fails
fast with actionable messages.

Expected startup shape:

```text
[API] Environment Loaded (development)
[API] Environment Validated
[API] PostgreSQL Connected
[API] Redis Connected
[API] Cloudinary Connected
[API] Server running on port 4000
[API] API Ready

[WEB] Environment Loaded (development)
[WEB] API target http://localhost:4000
[WEB] Frontend Running on port 3000
```

## Health checks

| Route | Purpose |
|-------|---------|
| `/health` | API liveness and environment |
| `/health/db` | PostgreSQL/Supabase query check |
| `/health/redis` | Redis ping check |
| `/health/ready` | Combined readiness for API dependencies |

## Infrastructure modules

| Area | Location |
|------|----------|
| Env schema | `apps/api/src/validators/env.schema.ts` |
| Startup logs | `apps/api/src/logs/startup-logger.ts` |
| Port checks | `apps/api/src/utils/port.ts` |
| Cloudinary | `apps/api/src/lib/cloudinary.ts`, `apps/api/src/services/media.service.ts` |
| Redis cache/session/rate helpers | `apps/api/src/lib/redis.ts` |
| Queues | `apps/api/src/queues`, `apps/api/src/worker.ts` |

## API surface (v1)

| Route | Purpose |
|-------|---------|
| `/v1/auth/*` | OTP login, sessions |
| `/v1/products` | Catalog + filters (`?q&sort&page`) |
| `/v1/cart` | Persistent cart |
| `/v1/orders` | Checkout + WhatsApp lock |
| `/v1/wishlist` | Wishlist CRUD |
| `/v1/reviews` | Product reviews |
| `/v1/analytics/track` | Event tracking |
| `/v1/categories` | Categories list |
| `/v1/content/media` | Dynamic hero/story videos |
| `/v1/admin/*` | Dashboard, products, inventory |

## Frontend routes

| Path | Theme | Notes |
|------|-------|-------|
| `/` | Dark cinematic | Original landing preserved |
| `/shop` | Light premium | Search, sort, pagination |
| `/products/[slug]` | Light | Detail + related |
| `/wishlist`, `/account` | Light | Auth required |
| `/admin` | Light | Admin OTP user |

## Supabase migration

1. Create Supabase project.
2. Set `DATABASE_URL` to Supabase connection pooler URI.
3. Run `npx prisma db push` and `npm run db:seed` from `apps/api`.
4. Optionally use Supabase Storage for `MediaAsset.url` and product images.

No rewrite required — Prisma works against Supabase PostgreSQL.
