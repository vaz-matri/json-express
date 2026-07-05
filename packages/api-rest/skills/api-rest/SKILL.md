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

## Mass assignment — protect sensitive fields explicitly
CRUD writes accept **every field in the request body by default.** A model with no
`access.fields` block lets a client set any field it names, so `POST /users {"role":"admin"}`
succeeds unless you stop it. This is the single most common privilege-escalation mistake.

Rule: any field a client must not set — `role`, `emailVerified`, `passwordHash`, `isAdmin`,
balances, ownership — needs a **field-level write rule** in the model's `access.fields`. A
field with no rule is writable; `false` makes it never client-writable; a role restricts it.

```ts
// models/users.ts
access: {
  create: 'public',            // anyone may register
  fields: {
    role:          { create: false, update: false },            // never set by a client
    emailVerified: { create: false, update: false },
    passwordHash:  { create: false, update: false, read: false }, // also hidden on read
    balance:       { update: 'admin' },                          // only admins may change
  },
}
```
Notes:
- Stripping happens silently before `db.create`/`db.update` — the denied field is dropped, not rejected.
- This is a **model** concern (behavior lives in `models/`), never config.
- GraphQL already refuses *undeclared* fields via its typed input, but a *declared* sensitive field still needs a field rule — REST and GraphQL share the same `access.fields`.

## Verify
`GET /docs/json` lists your routes; owner-gated GETs return 404 (not 403) for records of other users.
Confirm mass-assignment protection: `POST` a protected field (e.g. `{"role":"admin"}`) and check the created record did not take it.
