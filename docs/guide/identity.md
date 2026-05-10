---
title: Identity & Auth Plugin
description: Secure your JSONExpress APIs with auto-discovered identity management, argon2id password hashing, JWT issuance, and asymmetric JWKS validation.
---

# Identity & Auth

The [`@json-express/plugin-identity`](/plugin-identity) package turns JSONExpress from an open API into a zero-trust backend. It is **auto-discovered** — install it (along with its peers) and the `json-express` runtime registers it for you. There is no manual `new IdentityPlugin(...)` wiring.

## What it does on boot

1. **Contributes a strict `users` schema** that blocks `passwordHash` and `tokenVersion` from ever appearing in API responses.
2. **Hashes passwords with argon2id** through `beforeCreate` / `beforeUpdate` hooks — the plain-text value never reaches the database.
3. **Mounts the `/auth/*` route group** (login, register, refresh, logout, password change, plus the email-driven flows when an email provider is installed).
4. **Auto-seeds an admin** when the `users` collection is empty — the generated password is logged once on first boot.
5. **Validates installed peers**: it throws on boot if `middleware-auth` or an `IKvStore` is missing.

---

## The Zero-Knowledge Provisioning Flow

Plain-text passwords are never accepted via generic REST `POST` / `PATCH /users` requests:

1. An admin creates a user via `POST /users` with only `email` and `role`.
2. The user is stored with `emailVerified: false` and no password.
3. A TTL-bound reset token is written to the `IKvStore`.
4. The reset email is enqueued on the `IQueueAdapter` and sent asynchronously.
5. The user follows the link and submits their password to `POST /auth/password/reset`, which performs the argon2id hashing.

Administrators and API logs never see user passwords.

---

## JWT Verification & Security

The plugin partners with [`@json-express/middleware-auth`](/middleware-auth) to verify the tokens it issues. Both sides read the same keys from the config provider — there is no cross-plugin import.

### Symmetric (HMAC) vs Asymmetric (JWKS)

For local development, `jex.auth.secret` is enough. For production, point both plugins at a JWKS endpoint and JSONExpress acts as a pure resource server validating tokens issued by an external IdP (Auth0, Cognito, Okta, …).

```bash
# .env

# Local development — HMAC
jex.auth.secret=a-strong-32-byte-secret

# Production — JWKS
jex.auth.jwksUri=https://your-tenant.us.auth0.com/.well-known/jwks.json
jex.auth.algorithms=RS256

# Public paths the verifier must skip
jex.auth.exclude=/auth,/public
```

### The `tokenVersion` Pattern (instant revocation)

Stateless JWTs cannot normally be revoked without a centralized blocklist. JSONExpress instead stamps each token with the user's current `tokenVersion` integer (a non-readable field on the user record). When you need to revoke, increment that user's `tokenVersion` — every previously issued JWT becomes invalid on the next request because the stamped version no longer matches the database value. No blocklist, no cache invalidation, no extra storage.

---

## Admin Auto-Seeding

When the plugin boots and the `users` collection is empty, it creates an `admin@local` account with role `admin` and a randomly generated password. The password is printed once to the configured logger.

> [!WARNING]
> Change the auto-generated admin password immediately on first boot via `POST /auth/password/change`.

There is no `ROOT_ADMIN_EMAIL` / `ROOT_ADMIN_PASSWORD` environment variable — the admin email is fixed at `admin@local` and the password is randomly generated each fresh boot.

---

## Common Questions

### Where are refresh tokens stored?

Refresh tokens, email verification tokens, and password reset tokens are **not** stored in your primary database. They live in the `IKvStore` ([`@json-express/kv-memory`](/kv-memory) for development; a Redis-backed implementation in production). This keeps the primary database free of ephemeral records and offloads TTL expiration to native KV commands.

### Can I use Auth0 / Firebase / Cognito instead of issuing my own tokens?

Yes — set `jex.auth.jwksUri` to your IdP's JWKS endpoint. `middleware-auth` will validate every incoming JWT against those keys. You can keep `plugin-identity` installed for the `users` schema and admin endpoints, or remove it entirely and rely on the IdP's user store.

### How do I install the whole stack in one command?

```bash
npm install @json-express/preset-identity
```

The [`@json-express/preset-identity`](/presets) preset bundles `plugin-identity`, `middleware-auth`, `kv-memory`, `queue-memory`, and `email-console`.
