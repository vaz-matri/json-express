---
name: plugin-identity
description: Add complete authentication to a JSON Express app: signup, login, JWT + refresh, email verification, password reset — all under /auth/*, no code. Use whenever an app needs user accounts.
---

# @json-express/plugin-identity

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
User accounts. Prefer `npm i @json-express/preset-identity` (bundles everything below).

## How
1. `npm i @json-express/plugin-identity @json-express/middleware-auth @json-express/kv-memory` (+ `email-console` for verification/reset flows).
2. `.env`: `jex.auth.secret=...` (required). Tune: `jex.auth.tokenTtl`, `refreshTtl`, `allowRegistration`, `defaultRole`, `requireVerifiedEmail`, `minPasswordLength`, `jex.auth.email.*`.
3. It contributes the `users`/`roles` collections (argon2id hashes; passwordHash unreadable/unpatchable via CRUD).
4. Protect your own models with `access` blocks — the roles issued by identity power them.

## Verify
POST /auth/register → /auth/login returns tokens → GET /auth/me with the Bearer token returns the user; refresh + logout flows work.
