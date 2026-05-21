# Andhra Pickle House

Premium cinematic ecommerce + WhatsApp ordering platform for homemade Andhra pickles.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), TypeScript, Tailwind CSS 4, Framer Motion, Lenis |
| Backend | Node.js, Express 5, Prisma, PostgreSQL |
| Cache | Redis |
| Proxy | Nginx (rate limits, gzip, upstream pooling) |
| CDN/WAF | Cloudflare (configure in front of Nginx) |

## Quick Start

### 1. Prerequisites

- Node.js 20+
- Docker (for PostgreSQL + Redis)

### 2. Environment

```bash
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
```

Edit `.env` with secure JWT secrets (min 32 chars).

### 3. Start infrastructure

```bash
docker compose up -d postgres redis
```

### 4. Install & migrate

```bash
npm install
npm run db:generate
cd apps/api && npx prisma db push && npm run db:seed
```

### 5. Run dev servers

```bash
npm run dev:split
```

- **Storefront:** http://localhost:3000
- **API:** http://localhost:4000
- **Admin:** http://localhost:3000/admin (login with `ADMIN_PHONE` from `.env`)

Use `npm run dev:backend` and `npm run dev:frontend` for fully manual separate
terminals, or `npm run dev:combined` for one terminal with prefixed logs.

Startup logs include environment validation, port availability, PostgreSQL,
Redis, Cloudinary status, API readiness, startup duration, and graceful shutdown
messages. Health checks are available at `/health`, `/health/db`,
`/health/redis`, and `/health/ready`.

### OTP in development

With `OTP_PROVIDER=console`, OTP codes are logged to the API console as
`Mock OTP sent`. This provider is development/test only and is blocked in
production.

## Hero Videos

Your Hailuo clips are integrated at:

```
apps/web/public/videos/
  hero-first-frame.mp4   ← FIRST FRAME source
  hero-middle-frame.mp4  ← MIDDLE FRAME source
```

The cinematic hero runs a **6-scene sequence** (mango → spices → mixing → oil → jar → reveal) using both clips with different crop/mask profiles. The preparation section also uses `hero-middle-frame.mp4` with parallax.

To replace footage, overwrite these files (keep names) or update paths in `apps/web/src/components/hero/CinematicHero.tsx`.

**Watermark handling:** We use professional **reframe + vignette + grade** (CSS)—not AI inpainting. For a watermark-free master, export clean versions from your editor.

## Order Flow (Tamper-Proof WhatsApp)

1. User adds to cart (login required via phone OTP)
2. Checkout creates a **locked order** with `orderRef` + `orderToken`
3. Immutable snapshot stored in PostgreSQL
4. WhatsApp opens with pre-filled, structured messages (owner + customer)
5. Verify at `/order/verify?ref=...&token=...`

Customers cannot edit order totals in WhatsApp — the backend snapshot is the source of truth.

## Project Structure

```
apps/
  api/          Express API (feature routes, services, Prisma)
  web/          Next.js storefront + admin
packages/
  shared/       Types, validators, constants
nginx/          Production reverse proxy
docker/         Dockerfiles
```

## Production

```bash
docker compose up --build
```

Configure Cloudflare:
- Orange-cloud your domain
- Enable WAF managed rules
- Cache `/_next/static/*` and `/videos/*`
- Set `trust proxy` (already enabled on API)

## Security Checklist

- [x] Helmet, CORS, rate limiting
- [x] JWT + HttpOnly refresh cookies
- [x] OTP brute-force protection
- [x] Zod validation on all inputs
- [x] Immutable order snapshots + audit logs
- [x] Admin role guard
- [ ] Add Twilio credentials for production OTP
- [ ] Enable CSP in production Helmet config
- [ ] TLS certificates on Nginx

## License

Proprietary — Andhra Pickle House
