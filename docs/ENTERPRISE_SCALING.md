# Enterprise Scaling And Resilience Runbook

## Current Service Roles

- `nginx`: public ingress, request correlation, passive upstream failover.
- `web`: Next.js standalone server, horizontally scalable.
- `api`: Express API, stateless, horizontally scalable.
- `worker`: BullMQ processors, horizontally scalable with Redis locks.
- `postgres`: system of record, single writer in current topology.
- `redis`: cache, rate limiting, queues, worker heartbeat; not API correctness source.
- `migrate`: one-shot Prisma migration gate before API startup.

## Scale Commands

Single VPS:

```bash
docker compose -f docker-compose.yml -f docker-compose.vps.yml up -d --build --scale api=3 --scale worker=2
```

Coolify:

- Scale `api` replicas to `2+`.
- Scale `worker` replicas to `2+`.
- Keep `postgres`, `redis`, `migrate`, and `nginx` at `1`.
- Do not expose `api`, `web`, `worker`, `postgres`, or `redis` directly.

## Zero-Downtime Deployment Flow

1. Build new images.
2. Run `migrate`.
3. Start replacement `api` container.
4. Wait until `GET /ready` returns `200`.
5. Shift traffic to healthy API instance through nginx/Coolify proxy.
6. Send `SIGTERM` to old API instance.
7. Old API marks readiness false, closes idle connections, drains active requests for up to 20 seconds, then disconnects DB/Redis.
8. Deploy `web`.
9. Deploy `worker`; old worker receives `SIGTERM`, closes BullMQ workers, and exits after active jobs settle.

## Health And Alert Signals

- API live: `GET /health`
- API ready: `GET /ready`
- Metrics JSON: `GET /metrics`
- DB health: `GET /health/db`
- Redis health: `GET /health/redis`
- Worker heartbeat: `GET /health/worker`
- Nginx health: `GET /nginx-health`

Alert thresholds:

- `GET /ready` non-200 for 2 consecutive checks.
- `GET /health/worker` stale for more than 60 seconds.
- `/metrics` `http.errorRate1m >= 0.05` with at least 20 rpm.
- `/metrics` queue `waiting` count grows for 5 minutes.
- `/metrics` queue `failed` count increases.
- DB health latency above 500 ms for 5 minutes.
- Redis health latency above 250 ms for 5 minutes.

## Disaster Recovery

Postgres:

```bash
docker exec -t <postgres-container> pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > backup.sql
cat backup.sql | docker exec -i <postgres-container> psql -U "$POSTGRES_USER" "$POSTGRES_DB"
```

- Snapshot at least every 6 hours.
- Keep daily backups for 14 days.
- Test restore before every major release.
- Recovery point objective: last successful backup.
- Recovery time objective: restore time plus application startup.

Redis:

- Redis loss degrades cache/rate-limit acceleration and stops queue progress.
- API remains live if DB is healthy.
- Restart Redis from volume.
- If Redis data is lost, replay pending outbox rows with worker startup recovery.

Worker:

- Restart workers.
- Check `GET /health/worker`.
- Inspect `dead-letter` queue from `/metrics`.
- Requeue dead-letter items only after fixing the provider/data failure.

API:

- Docker restarts failed instances.
- Nginx/Coolify routes only to healthy instances.
- Readiness blocks traffic during shutdown and DB failure.

## Multi-Region Readiness

Current safe mode:

- One write region.
- One Postgres primary.
- Redis local to the write region.
- Workers run only in the write region.
- CDN can serve static assets and images globally.

Future multi-region requirements:

- External managed Postgres with read replicas.
- Region-local Redis for cache only.
- Single-region queue ownership or region-partitioned queues.
- Cloudinary/CDN for all user media.
- Global DNS failover to a warm standby region.
- Idempotency keys for externally retried checkout requests before active-active writes.

## Resilience Tests

Redis outage:

```bash
docker compose stop redis
curl -f http://localhost/health/redis || true
curl -f http://localhost/ready
docker compose start redis
```

Expected: API readiness stays healthy if DB is healthy; worker heartbeat becomes stale; queue processing resumes after Redis returns.

DB outage:

```bash
docker compose stop postgres
curl -f http://localhost/ready || true
docker compose start postgres
```

Expected: readiness fails; live endpoint remains available; Docker keeps API running/restarting until DB returns.

Worker crash:

```bash
docker compose kill worker
docker compose up -d worker
curl http://localhost/health/worker
```

Expected: worker restarts, heartbeat returns, stuck outbox events recover.

Duplicate checkout pressure:

```bash
# Run repeated authenticated checkout calls against the same cart in staging.
# Expected: inventory conditional updates prevent oversell.
```

Deployment interruption:

```bash
docker compose up -d --build --scale api=2
docker compose kill api
curl -f http://localhost/ready
```

Expected: at least one API instance remains routable when scaled above one.
