<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# @json-express/preset-identity

Zero-code preset that bundles `plugin-identity` with sensible local defaults so you can boot a working auth stack with a single install.

```bash
npm install @json-express/boot @json-express/preset-identity
```

Set the JWT secret and exclude `/auth/*` from the verifier in `.env`:

```env
jex__auth__secret=a-strong-32-byte-secret
jex__auth__exclude=/auth
```

Run it:

```bash
npx json-express
```

You now have `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/password/change`, plus the email-dependent endpoints (`/auth/verify`, `/auth/password/forgot`, …) printed to stdout by `email-console`.

## What's in the box

This package ships **no application code** — its only purpose is to declare the identity stack as `dependencies`:

- `@json-express/plugin-identity` — issues JWTs, mounts `/auth/*`, hashes with argon2id, auto-seeds an admin user
- `@json-express/middleware-auth` — verifies JWTs on every protected route (hard peer of `plugin-identity`)
- `@json-express/email-console` — prints verification / reset emails to stdout (swap for `email-ses`, `email-sendgrid`, … in prod)
- `@json-express/kv-memory` — refresh-token store (swap for `kv-redis` in prod)
- `@json-express/queue-memory` — background job queue for email dispatch (swap for `queue-bullmq` in prod)

## Swapping a default

Install the alternative alongside this preset, then pick it via `.env`:

```bash
npm install @json-express/kv-redis
```

```env
jex.kv=@json-express/kv-redis
```

The CLI's auto-discovery sees both, and the `.env` override wins. The unused default stays in `node_modules` but is never instantiated.

## When to use this vs. installing peers individually

- **Quickstart / dev:** install `@json-express/preset-identity`. One command, working auth.
- **Production / opinionated stack:** install `@json-express/plugin-identity` + `@json-express/middleware-auth` plus only the specific `email-*` / `kv-*` / `queue-*` providers you want. Keeps `node_modules` lean.

## See also

- [`@json-express/plugin-identity`](../../packages/plugin-identity/README.md) — the plugin itself
- [`@json-express/boot`](../boot/README.md) — the equivalent preset for the default server stack
- [`example/plugin-identity`](../../example/plugin-identity/README.md) — a full project using this preset
