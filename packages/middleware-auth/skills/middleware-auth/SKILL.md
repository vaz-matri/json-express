---
name: middleware-auth
description: Protect a JSON Express app with JWT auth: Bearer verification, model access rules, public paths, strict mode. Use when securing routes, integrating an IdP via JWKS, or enforcing roles/ownership.
---

# @json-express/middleware-auth

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Any app with non-public endpoints.

## How
1. `npm i @json-express/middleware-auth`.
2. `.env`: `jex.auth.secret=...` (HMAC) or `jex.auth.jwksUri=https://idp/.well-known/jwks.json` (+ optional audience/issuer/algorithms).
3. Public routes: `jex.auth.exclude=/health,/docs` or `access: { read: 'public' }` per model.
4. Roles/ownership live in models: `access: { create: 'user', update: 'owner', delete: 'admin' }`.
5. Production: `jex.auth.required=true` — misconfigured auth returns 503 instead of silently bypassing.

## Verify
No token → 401; invalid token → 403; valid token honors access rules; with auth.required=true and no secret, requests return 503.
