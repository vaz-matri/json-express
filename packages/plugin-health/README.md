# `@json-express/plugin-health`

> **Advanced health check plugin for JSONExpress v2.**
> Replaces the built-in baseline `/health` endpoint with a deep, database-aware health probe—ideal for Kubernetes liveness/readiness probes and enterprise observability pipelines.

---

## How It Works

JSONExpress ships with a safe, static baseline `/health` endpoint baked into the CLI:

```json
{ "status": "UP" }
```

This is enough to prevent orchestrators (K8s, AWS ALB) from declaring your container dead. However, in production you often need to know **whether your database is actually reachable.**

When you install `@json-express/plugin-health`, the CLI's Auto-Discovery Engine detects it and **yields the baseline**, allowing this plugin to register a fully dynamic health handler in its place.

---

## Installation

```bash
npm install @json-express/plugin-health
```

JSONExpress will detect this plugin automatically. No registration code required.

---

## Endpoints

### `GET /health`

Returns the real-time health of the active database adapter.

**Healthy response** (`200 OK`):
```json
{
  "status": "UP",
  "database": "connected"
}
```

**Unhealthy response** (`503 Service Unavailable`):
```json
{
  "status": "DOWN",
  "database": "disconnected"
}
```

If an unexpected exception is thrown during the health check:
```json
{
  "status": "DOWN",
  "error": "Connection timeout"
}
```

### `GET /info`

Available out-of-the-box from the CLI baseline regardless of this plugin. Returns runtime observability metadata:

```json
{
  "environment": "production",
  "uptimeSeconds": 3621.47,
  "timestamp": "2026-04-03T08:13:00.000Z",
  "system": {
    "nodeVersion": "22.18.0",
    "platform": "linux",
    "memoryUsageMb": 64.3
  }
}
```

---

## Database Adapter Support

The health check calls `db.isHealthy()` on the active adapter. Support depends on whether the adapter implements this optional method:

| Adapter | `isHealthy()` support | Notes |
|---|---|---|
| `adapter-memory` | ✅ Always returns `true` | In-memory is always up |
| `adapter-mongodb` *(future)* | ✅ Pings the connection | Returns `false` on timeout |
| `adapter-postgres` *(future)* | ✅ Runs `SELECT 1` | Returns `false` on error |

If the adapter does **not** implement `isHealthy()`, the plugin gracefully falls back to `"UP"`.

---

## Configuration

Disable the `/health` endpoint entirely via `.env`:

```env
jex.transport.express.health=false
```

---

## Architecture Note

This plugin implements the `IPlugin` interface and uses the Kernel's Awilix IoC container to resolve the active Transport and Database Adapter at boot time — keeping all layers fully decoupled.

```
CLI Auto-Discovery
  └─ Detects plugin-health → skips BaselineHealthPlugin
       └─ AdvancedHealthPlugin.onBoot(kernel)
            ├─ resolves transport → registers route
            └─ resolves database → calls isHealthy() per request
```
