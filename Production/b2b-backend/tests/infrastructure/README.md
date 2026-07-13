# Infrastructure Test Suite

Optional tests that require **real Redis** (BullMQ Lua scripts), Redis outage simulation, or isolated Mongo disconnect.

These tests are **excluded from `npm test`** to keep the main suite deterministic with ioredis-mock.

## Run

```bash
# Requires Redis on REDIS_HOST:REDIS_PORT (default localhost:6379)
ENABLE_QUEUE=true RUN_INFRA_TESTS=true npm run test:infrastructure
```

## Covered scenarios (moved from integration skips)

- BullMQ queue create, enqueue, worker process, cleanup
- Inventory reservation under Redis circuit-open
- Lock acquisition when MongoDB is disconnected

Frontend browser checkout E2E lives in `Production/ME/tests/e2e/` (Playwright).
