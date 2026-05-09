<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# Identity-driven mini publishing platform

A working example that exercises every access pattern `plugin-identity` introduces — owner-scoped writes, field-level redaction, role-gated custom endpoints, and a fieldless route module that reads the JWT directly. Use it as a reference for any project that needs real auth out of the box.

> Quick start? See [`examples/preset-identity`](../../examples/preset-identity/README.md) — same plugin, same flows, but installed with one meta-package instead of six.

## Setup

```bash
npm install @json-express/boot \
  @json-express/plugin-identity \
  @json-express/middleware-auth \
  @json-express/email-console \
  @json-express/kv-memory \
  @json-express/queue-memory
```

`plugin-identity` depends on three peer plugins:

| Slot | Used here | Why |
| --- | --- | --- |
| `email-*` | [`@json-express/email-console`](../../packages/email-console/README.md) | Verification / reset emails — `console` prints them to stdout for local dev |
| `kv-*` | [`@json-express/kv-memory`](../../packages/kv-memory/README.md) | Refresh-token store — swap for Redis in prod |
| `queue-*` | [`@json-express/queue-memory`](../../packages/queue-memory/README.md) | Background jobs (e.g. send email) — swap for BullMQ in prod |

Set the JWT secret and tell `middleware-auth` to skip auth on the `/auth/*` routes themselves (otherwise nobody could log in):

```env
jex__auth__secret=plugin-identity-example-secret
jex__auth__exclude=/auth
```

## What this example demonstrates

Three models, each highlighting a different identity pattern:

### `articles` — owner-scoped CRUD with admin-only fields

```ts
access: {
    read: 'public',
    create: 'owner',     // any auth caller; framework auto-stamps `authorId`
    update: 'owner',     // only the author edits
    delete: 'owner',
    ownerField: 'authorId',
    fields: {
        internalNotes: { read: 'admin', create: 'admin', update: 'admin' },
    },
},
endpoints: {
    'POST /:id/feature': /* admin-only toggle (manual evaluateAccess check) */,
},
```

- **Public read** — `GET /articles` works without a token.
- **Auth required to write** — `POST /articles` returns 401 without a Bearer token.
- **Auto-stamp** — the framework writes `authorId = <JWT.sub>` on create. Clients don't pass it.
- **Per-record ownership** — User B trying to PATCH or DELETE User A's article gets a 404 (not 403, by design — no enumeration).
- **Field-level redaction** — `internalNotes` is silently stripped from responses for non-admins, AND silently stripped from any body a non-admin submits. The data is *never* visible to or settable by users.
- **Role-gated custom endpoint** — `POST /articles/:id/feature` runs `evaluateAccess('admin', …)` manually; non-admins get 403, admins flip the `featured` flag on any article (moderation, bypassing the owner rule on purpose).

### `comments` — simpler owner-scoped resource

Same access shape as articles but no field-level rules and no custom endpoint. Demonstrates that a "normal" auth-protected entity is one `access:` block.

### `me` — fieldless `defineRoutes` module

```ts
defineRoutes({
    endpoints: {
        'GET /':         /* returns caller's user record (passwordHash stripped) */,
        'GET /articles': /* returns articles where authorId === caller */,
    },
});
```

Demonstrates the `defineRoutes` sugar (no `fields`, no auto-CRUD), manual JWT decoding via `evaluateAccess` + `resolveUserId`, and cross-collection reads driven by the JWT subject.

## Run it

```bash
npm run serve
```

You get the standard auth endpoints from `plugin-identity`:

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a user, get `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/login` | Verify credentials, get fresh tokens |
| `POST` | `/auth/refresh` | Rotate the refresh token |
| `POST` | `/auth/logout` | Revoke the refresh token |
| `POST` | `/auth/password/change` | Authenticated password change |

Plus the auto-generated CRUD and the custom endpoints declared above:

| Method | Path | Auth | Notes |
| --- | --- | --- | --- |
| `GET` | `/articles` | none | Public — anyone can browse |
| `POST` | `/articles` | Bearer | `authorId` auto-stamped |
| `PATCH` | `/articles/:id` | Bearer (owner) | Non-owners see 404 |
| `DELETE` | `/articles/:id` | Bearer (owner) | |
| `POST` | `/articles/:id/feature` | Bearer (**admin**) | Toggles `featured` on any article |
| `GET`/`POST`/`PATCH`/`DELETE` | `/comments[/...]` | Same shape as articles | |
| `GET` | `/me` | Bearer | Caller's user record (no `passwordHash`) |
| `GET` | `/me/articles` | Bearer | Caller's articles |

## Walk through the flow

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"correct horse battery staple"}'
# → 201 { user, accessToken, refreshToken }

# Post an article — authorId is auto-stamped
curl -X POST http://localhost:3000/articles \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -d '{"title":"Hello","body":"World","internalNotes":"this is hidden"}'
# → 201, but the response will NOT include `internalNotes` (you're not an admin)
#   AND the stored row also has no `internalNotes` (it was stripped on the way in)

# Read it back — anonymously
curl http://localhost:3000/articles
# → 200 [...]; still no `internalNotes`

# Look at your own profile
curl -H "authorization: Bearer $ACCESS_TOKEN" http://localhost:3000/me
# → 200 { id, email, role: 'user', emailVerified, ... } (no passwordHash)

# Try to feature an article (admin-only)
curl -X POST http://localhost:3000/articles/$ARTICLE_ID/feature \
  -H "authorization: Bearer $ACCESS_TOKEN"
# → 403 Role required: admin
```

## What's in this folder

- `package.json` — declares `plugin-identity` and its peer dependencies
- `.env` — JWT secret and `/auth` exclusion for `middleware-auth`
- `models/articles.ts` — owner-scoped entity with field-level redaction and a role-gated custom endpoint
- `models/comments.ts` — minimal owner-scoped entity
- `models/me.ts` — fieldless `defineRoutes` module reading the JWT directly
- `data/articles.json`, `data/comments.json` — empty seeds (users live in their own collection, managed by `plugin-identity`)

## See also

- [`@json-express/plugin-identity`](../../packages/plugin-identity/README.md) — the package's own README
- [`examples/preset-identity`](../../examples/preset-identity/README.md) — the same demo behind a one-line install
- [`example/middleware-auth`](../middleware-auth/) — JWT verification + RBAC without the registration flow
- [`example/simple`](../simple/README.md) — the default stack and the directory of every plugin
