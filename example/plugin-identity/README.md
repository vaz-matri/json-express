# Drop-in identity provider example

A complete identity flow — register, login, refresh, logout — wired up with one plugin. JWTs are issued by the framework, persisted via the JSON adapter, and verified by `middleware-auth` on every protected route.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

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

Define a model with owner-scoped access — only authenticated owners may write:

```ts
// models/notes.ts
export default defineModel({
    name: 'notes',
    fields: {
        id: types.id(),
        title: types.string(),
        body: types.string(),
        ownerId: types.string(),
    },
    access: {
        read: 'public',
        create: 'owner',   // auto-stamps caller as owner
        update: 'owner',
        delete: 'owner',
    },
});
```

## Run it

```bash
npm run serve
```

You get the standard `/notes` CRUD routes plus four identity endpoints:

| Method | Path | Description |
| --- | --- | --- |
| `POST` | `/auth/register` | Create a new user; returns `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/login` | Verify credentials; returns fresh tokens |
| `POST` | `/auth/refresh` | Exchange a refresh token for a new access token |
| `POST` | `/auth/logout` | Invalidate the refresh token |

### Walk through the flow

```bash
# Register
curl -X POST http://localhost:3000/auth/register \
  -H 'content-type: application/json' \
  -d '{"email":"alice@example.com","password":"correct horse battery staple"}'
# → 201 { user: {...}, accessToken: "ey...", refreshToken: "..." }

# Use the access token to write a note
curl -X POST http://localhost:3000/notes \
  -H 'content-type: application/json' \
  -H "authorization: Bearer $ACCESS_TOKEN" \
  -d '{"title":"hello","body":"world"}'
# → 201 — ownerId is auto-stamped from the JWT subject

# Refresh when the access token expires
curl -X POST http://localhost:3000/auth/refresh \
  -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"

# Logout — invalidates the refresh token in the kv store
curl -X POST http://localhost:3000/auth/logout \
  -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```

The `email-console` plugin prints any sent emails (verification, password reset) directly to your terminal — no SMTP setup needed for development.

## What's in this folder

- `package.json` — declares `plugin-identity` and its peer dependencies
- `.env` — JWT secret and `/auth` exclusion for `middleware-auth`
- `models/notes.ts` — owner-scoped model used to demonstrate authenticated writes
- `data/notes.json` — empty seed; users are stored separately by `plugin-identity`

## See also

- [`@json-express/plugin-identity`](../../packages/plugin-identity/README.md) — the package's own README
- [`middleware-auth` example](../middleware-auth/) — JWT verification + RBAC without the registration/login flow on top
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
