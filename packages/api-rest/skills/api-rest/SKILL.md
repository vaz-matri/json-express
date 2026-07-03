---
name: api-rest
description: Generate and shape the REST API of a JSON Express app: CRUD per collection, prefixes, access-rule enforcement, custom endpoints. Use when adding endpoints, securing routes, or setting a global /api prefix.
---

# @json-express/api-rest

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Default API paradigm (included in boot). Reach for this skill when shaping routes, not creating them — creation is automatic.

## How
1. Prefix all routes: `jex.api.rest.prefix=/api/v1` in `.env`.
2. Gate routes: set `jex.auth.secret` (or `jex.auth.jwksUri`) — with `middleware-auth` installed, non-public routes then require a Bearer token.
3. Custom endpoints live in models:
   `endpoints: { 'POST /publish': { handler: async (req, res, ctx) => { /* ... */ } } }` — `ctx` carries `db`, plus `email`/`kvStore`/`queue` when installed.
4. Per-operation access in models: `access: { read: 'public', create: 'user', update: 'owner', delete: 'admin' }` (+ per-field rules).

## Verify
`GET /docs/json` lists your routes; owner-gated GETs return 404 (not 403) for records of other users.
