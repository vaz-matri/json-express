<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# Full identity flow — one preset, two installs

A complete, runnable showcase of how `plugin-identity` and `middleware-auth` collaborate to deliver real authentication: registration, login, refresh-token rotation, logout, password recovery, role gating, owner-scoped resources, and a public health probe — all installed with a single meta-package.

> **Two examples, one plugin.** This folder is the **showcase** — narrative-driven, end-to-end. Looking for a per-package E2E suite that pins down each access pattern in isolation? See [`example/plugin-identity`](../../example/plugin-identity/README.md).

## Setup — two deps total

```bash
npm install @json-express/boot @json-express/preset-identity
```

That's it. `@json-express/preset-identity` is a zero-code meta-package whose only job is to declare the identity stack as `dependencies` — the kernel's recursive auto-discovery (`packages/core/src/runner.ts:64-102`) walks the dep tree and registers everything the same way it would if you'd installed each package by hand.

| Slot | Bundled default | Swap for prod |
| --- | --- | --- |
| Identity plugin | [`@json-express/plugin-identity`](../../packages/plugin-identity/README.md) | — |
| Auth verifier | [`@json-express/middleware-auth`](../../packages/middleware-auth/README.md) | — (hard peer of plugin-identity) |
| `email-*` | [`@json-express/email-console`](../../packages/email-console/README.md) | `email-ses`, `email-sendgrid`, … |
| `kv-*` | [`@json-express/kv-memory`](../../packages/kv-memory/README.md) | `kv-redis` |
| `queue-*` | [`@json-express/queue-memory`](../../packages/queue-memory/README.md) | `queue-bullmq` |

## How `plugin-identity` and `middleware-auth` collaborate

These two packages never import each other. They communicate purely through:

1. **Shared config keys** (`auth.secret`, `auth.issuer`, `auth.audience`, `auth.algorithms`). Issuer + audience are stamped into every JWT `plugin-identity` mints AND verified by `middleware-auth` on every protected request.
2. **The JWT payload shape**. `plugin-identity` writes `{ sub, role, email, emailVerified }`; `middleware-auth` decodes and forwards it as `req.headers['x-user-payload']`; the kernel hands that to the access engine.
3. **Path exclusion.** `auth.exclude` tells `middleware-auth` which paths to bypass — `/auth/*` is mandatory (the login route can't gate itself on a Bearer token).

This example's `.env` exercises all three:

```env
JEX__AUTH__SECRET=preset-identity-example-secret
JEX__AUTH__EXCLUDE=/auth
JEX__AUTH__ISSUER=preset-identity-example
JEX__AUTH__AUDIENCE=preset-identity-clients
```

> **Note:** `read: 'public'` model rules also opt their routes out of the auth middleware (api-rest only attaches the `auth` gate to routes whose op-rule isn't `'public'`). So `/tags` works anonymously without being listed in `auth.exclude` — the model rule and the middleware collaborate.

## What's modeled

```
models/
  tasks.ts    read:'owner'                   private to-do list per user
  tags.ts     read:'public', writes 'admin'  shared catalog, admin-managed
  me.ts       defineRoutes                   GET /me, GET /me/stats
data/
  tags.json                                  seeds two tags
```

`tasks` uses `read: 'owner'` — different from the public-read pattern in `example/plugin-identity` and a stricter posture: a user's task list is invisible to anyone else, even on the collection endpoint. The framework injects `ownerId = JWT.sub` into every read query automatically, so `GET /tasks` returns disjoint lists per caller without any custom filtering.

## The end-to-end flow

```bash
npm run serve
```

### 1. Browse the public catalog (no auth)

```bash
curl http://localhost:3000/tags
# → 200 [ { id, name, color }, ... ]
```

The `tags` model declares `read: 'public'`, so api-rest doesn't attach the auth middleware to that route at all — it serves anonymous requests without a token. (For a dedicated public liveness probe, install [`@json-express/plugin-health`](../../packages/plugin-health/README.md) — it auto-mounts a database-aware `/health`.)

### 2. Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"correct horse battery staple"}'
# → 201 { user: {...}, accessToken: "ey...", refreshToken: "..." }
```

The issued JWT carries `iss=preset-identity-example` and `aud=preset-identity-clients` — `plugin-identity` reads those from config when signing.

### 3. Use the access token to manage your tasks

```bash
curl -X POST http://localhost:3000/tasks \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -d '{"title":"finish the writeup","priority":1}'
# → 201 — ownerId is auto-stamped from JWT.sub

curl -H "authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/tasks
# → 200 [...] — only Alice's tasks; Bob's tasks are filtered out at the DB layer
```

### 4. Try to write a tag (you'll be denied)

```bash
curl -X POST http://localhost:3000/tags \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -d '{"name":"pizza","color":"#fc0"}'
# → 403 { "error": "Role required: admin" }
```

The model rule `create: 'admin'` rejects the request before the handler runs. To create tags as admin, grab the auto-seeded admin password from the boot logs (`admin@local` / printed once during `onReady`), log in, and try the same request.

### 5. Aggregate from the JWT

```bash
curl -H "authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/me
# → 200 { id, email, role, ... }   (passwordHash stripped)

curl -H "authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/me/stats
# → 200 { total: 1, done: 0, pending: 1 }
```

Both routes live in `models/me.ts` as a fieldless `defineRoutes` module — they decode the JWT manually via `evaluateAccess` + `resolveUserId` from `@json-express/core` and read across collections.

### 6. Forgot password — `email-console` prints to stdout

```bash
curl -X POST http://localhost:3000/auth/password/forgot \
  -d '{"email":"alice@example.com"}'
# → 200 (always 200, no enumeration)
```

The reset email lands in your terminal where the server is running. Copy the link, hit `POST /auth/password/reset` with the token, and you're done. (`queue-memory` runs the email-dispatch job; `email-console` is the transport that "delivers" it by logging it.)

### 7. Refresh and logout — `kv-memory` is the session store

```bash
curl -X POST http://localhost:3000/auth/refresh \
  -d "{\"refreshToken\":\"$REFRESH\"}"
# → 200 with a new pair; the old refresh token is revoked

curl -X POST http://localhost:3000/auth/logout \
  -d "{\"refreshToken\":\"$NEW_REFRESH\"}"
# → 200 — token revoked in the kv store; subsequent refresh fails
```

In production you'd swap `kv-memory` → `kv-redis` so refresh-token state survives restarts and is shared across instances. The model and handler code don't change — only the `.env`.

## Swapping a default

Install the alternative alongside the preset and pick it via `.env`:

```bash
npm install @json-express/kv-redis
```

```env
jex.kv=@json-express/kv-redis
```

The CLI sees both `kv-*` plugins, the override wins, and `kv-memory` is left in `node_modules` but never instantiated.

## What's in this folder

- `package.json` — only **two** deps: `@json-express/boot` + `@json-express/preset-identity`
- `.env` — secret, exclude paths, iss + aud
- `models/tasks.ts` — owner-scoped private list (`read: 'owner'`)
- `models/tags.ts` — shared catalog (`read: 'public'`, writes `admin`-only)
- `models/me.ts` — `defineRoutes`: `/me`, `/me/stats`
- `data/tags.json` — two seeded tags
- `data/tasks.json` — empty
- `tests/identity.spec.ts` — 25 specs walking the full lifecycle

## See also

- [`example/plugin-identity`](../../example/plugin-identity/README.md) — the per-package E2E suite (articles + comments + custom endpoints) with peers installed individually
- [`@json-express/preset-identity`](../../presets/preset-identity/README.md) — the preset's own README
- [`@json-express/plugin-identity`](../../packages/plugin-identity/README.md) — the plugin itself
- [`@json-express/middleware-auth`](../../packages/middleware-auth/README.md) — the verifier
