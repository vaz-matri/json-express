---
name: plugin-health
description: Add /health and /info operational endpoints to a JSON Express app for load balancers, orchestrators, and monitoring.
---

# @json-express/plugin-health

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Anything deployed behind a health check.

## How
1. `npm i @json-express/plugin-health` — no config.
2. Point liveness/readiness probes at `GET /health` (503 when the DB adapter is unhealthy).
3. `GET /info` → environment, uptime, node version, memory.

## Verify
`GET /health` returns `{ status: "UP", database: "connected" }`.
