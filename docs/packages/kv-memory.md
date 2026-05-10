---
title: "@json-express/kv-memory"
description: "An in-memory key-value store for JSONExpress with automatic TTL expiration. Perfect for local development."
---

# @json-express/kv-memory

> The default in-memory key-value store for JSONExpress.

The `@json-express/kv-memory` package implements `IKvStore` using a standard JavaScript `Map`. It provides a high-speed ephemeral storage engine with automatic TTL-based key expiration, making it ideal for local development and testing.

## Installation

```bash
npm install @json-express/kv-memory
```

## Configuration

The store is auto-discovered by the `json-express` runtime — you do not instantiate it manually. Tune the purge interval via the config provider:

```bash
# .env — how often (in ms) the purge cycle runs to clean expired keys (default: 30000)
jex.kv.purgeIntervalMs=30000
```

## Core Features

### 1. TTL-Based Expiration
When you `.set()` a key, you can provide a `ttlMs` option. The key will automatically become inaccessible after the specified duration:

```typescript
await kvStore.set('reset-token:abc123', { userId: '1' }, { ttlMs: 900000 }); // 15 minutes
// After 15 minutes:
await kvStore.get('reset-token:abc123'); // → null
```

### 2. Background Purge Cycle
To prevent memory leaks from accumulating expired entries, the store runs a periodic background purge cycle (default: every 30 seconds). The timer is created with `.unref()` so it does not prevent the Node.js process from exiting gracefully.

### 3. Health Check
The store exposes an `isHealthy()` method that always returns `true` (since RAM is always available). This method is consumed by the `@json-express/plugin-health` readiness probe.

## Related Ecosystem Packages
*   **@json-express/kv-redis** *(coming soon)***:** The production-grade alternative that delegates TTL expiration to native Redis `PSETEX` commands.
*   **[@json-express/plugin-identity](/packages/plugin-identity):** The primary consumer of the KV store — stores refresh tokens and password reset tokens.
