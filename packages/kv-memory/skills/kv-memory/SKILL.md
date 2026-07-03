---
name: kv-memory
description: Add an in-process key-value store with TTL to a JSON Express app — OTPs, rate-limit counters, temp tokens via ctx.kvStore. Development counterpart of kv-redis.
---

# @json-express/kv-memory

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Development/tests needing ctx.kvStore, or as the required KV of plugin-identity in dev.

## How
1. `npm i @json-express/kv-memory` — no config (optional `jex.kv.purgeIntervalMs`).
2. In hooks/endpoints: `await ctx.kvStore.set(key, value, { ttlMs: 60000 })`, `get`, `delete`.
3. State is per-process and lost on restart — never store business data here.

## Verify
Set with a short ttlMs; get after expiry returns null.
