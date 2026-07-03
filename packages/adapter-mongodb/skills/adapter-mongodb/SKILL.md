---
name: adapter-mongodb
description: Run a JSON Express app on MongoDB. Use when moving from prototype adapters to Mongo, or starting a Mongo-backed backend. Covers connection config, index migration via jex migrate, and id mapping.
---

# @json-express/adapter-mongodb

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Production/staging on MongoDB, or local Mongo via docker.

## How
1. `npm i @json-express/adapter-mongodb`.
2. `.env`: `jex.adapter-mongodb.connectionString=mongodb://...` (required — boot fails loudly without it); optional `jex.adapter-mongodb.dbName=...`.
3. `npx jex migrate` builds indexes from model fields (`unique`, `primaryKey`, composite `primaryKeys`).
4. Application data always uses `id` — the adapter maps `_id` both ways; never touch `_id` in models.

## Verify
Boot logs show no connection errors; POST then GET /<collection>/:id round-trips; duplicate unique fields return HTTP 400.
