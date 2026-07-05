---
name: kv-redis
description: Back the key-value store of a JSON Express app with Redis — production TTL storage for tokens, counters, OTPs. Use when deploying anything that relies on ctx.kvStore or plugin-identity.
---

# @json-express/kv-redis

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Production KV. Same ctx.kvStore surface as kv-memory.

## How
1. `npm i @json-express/kv-redis`; `jex.kv=@json-express/kv-redis` if kv-memory is also installed.
2. `.env`: `jex.kv-redis.connectionString=redis://...` (required — boot fails loudly without it).
3. Failed writes throw — callers see real errors, never phantom successes.

## Verify
Boot logs "Connected to Redis KV Store"; identity refresh flow works across server restarts.
