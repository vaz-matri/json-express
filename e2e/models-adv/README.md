<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# Advanced models example

Three model-level options of `defineModel` working in concert: **`hooks`**, **`endpoints`**, and **`exposeApi`**. The example boots three cooperating models — `albums` (mutated through hooks + a custom action), `artists` (relation target), and `audit-log` (an internal collection hidden from auto-CRUD) — and uses each to demo one option without losing sight of the others.

> If you haven't read the [`simple-models`](../simple-models/README.md) example yet, start there. This one assumes you're already comfortable with `defineModel`, field types, and relations.

## Setup

```bash
npm install @json-express/boot
```

Default in-memory adapter, no `.env` overrides.

## Run it

```bash
npm run serve
```

## What's modeled

```
models/
├── albums.ts       # hooks + custom endpoint
├── artists.ts      # plain relation target
└── audit-log.ts    # exposeApi: false + a curated read endpoint
```

## `hooks` — lifecycle callbacks on writes

Four hook points fire around each `db.create` / `db.update` call, regardless of whether the call came in through the auto-CRUD REST routes, a custom endpoint, or another hook on a different collection:

| Hook | Signature | Returns |
| --- | --- | --- |
| `beforeCreate` | `(data, ctx) => Partial<T>` | The (optionally mutated) payload that goes to the adapter |
| `afterCreate` | `(record, ctx) => void` | — (side-effects only) |
| `beforeUpdate` | `(patch, ctx) => Partial<T>` | The (optionally mutated) patch |
| `afterUpdate` | `(record, patch, ctx) => void` | — |

`ctx` is a `HookContext` populated by the kernel during boot. It carries:

| Key | When available |
| --- | --- |
| `ctx.db` | Always — the active `IDatabaseAdapter`. Use it to read/write any collection from inside a hook |
| `ctx.logger` | Always |
| `ctx.email` | If an `EmailProvider` is registered (see [`email-console`](../../packages/email-console/README.md)) |
| `ctx.kvStore` | If a KV store is registered (see [`kv-memory`](../../packages/kv-memory/README.md)) |
| `ctx.queue` | If a queue adapter is registered (see [`queue-memory`](../../packages/queue-memory/README.md)) |

`beforeCreate` and `beforeUpdate` may return a new payload to override what gets written; returning `undefined` means "leave it alone." `afterCreate` and `afterUpdate` run for side-effects after the write commits — common uses are audit logging, sending emails, or enqueueing background work.

```ts
// models/albums.ts
hooks: {
    beforeCreate: (data) => ({
        ...data,
        createdAt: new Date().toISOString(),
        playCount: data.playCount ?? 0
    }),
    afterCreate: async (album, ctx) => {
        await ctx.db.create('audit-log', {
            collection: 'albums',
            action: 'create',
            recordId: album.id,
            at: new Date().toISOString()
        });
    },
    beforeUpdate: (patch) => ({ ...patch, updatedAt: new Date().toISOString() }),
    afterUpdate: async (album, _patch, ctx) => {
        await ctx.db.create('audit-log', {
            collection: 'albums',
            action: 'update',
            recordId: album.id,
            at: new Date().toISOString()
        });
    }
}
```

```bash
curl -X POST http://localhost:3000/albums \
  -H 'content-type: application/json' \
  -d '{"title":"Currents","artistId":"art-1"}'
# response includes { ..., createdAt: "2026-...", playCount: 0 }

curl -X PATCH http://localhost:3000/albums/alb-1 \
  -H 'content-type: application/json' \
  -d '{"title":"Abbey Road (Remastered)"}'
# response includes { ..., updatedAt: "2026-..." }

curl http://localhost:3000/audit-log/list
# [{ collection: "albums", action: "create", recordId: "...", at: "..." }, ...]
```

> **Hooks fire on every `db.create` / `db.update`, including ones triggered from inside another hook.** Watch for accidental loops if a hook on collection A writes to collection A.
>
> **Hooks do not fire on `loadData()`** — initial seed records skip the lifecycle, which is usually what you want.

## `endpoints` — custom routes attached to a model

`endpoints` is a record of `"METHOD /path"` keys to handler functions. Each gets mounted at `${apiPrefix}/${modelName}${path}`. Handlers receive `(req, res, ctx)`:

| Param | Type | Notes |
| --- | --- | --- |
| `req` | `JsonRequest` | `{ method, path, params, query, headers, body }` |
| `res` | `ResponseHelper` | Express-flavored `.status(code).json(body)` / `.send(body)` |
| `ctx` | `RouteContext` | `{ db }` — same adapter used by auto-CRUD |

```ts
// models/albums.ts
endpoints: {
    'POST /:id/play': async (req, res, ctx) => {
        const id = req.params.id;
        try {
            const album = await ctx.db.getById('albums', id);
            const next = (album.playCount ?? 0) + 1;
            const updated = await ctx.db.update('albums', id, { playCount: next });
            res.status(200).json(updated);
        } catch {
            res.status(404).json({ error: `Album '${id}' not found.` });
        }
    }
}
```

```bash
curl -X POST http://localhost:3000/albums/alb-1/play
# { ..., playCount: 1 }
```

A handler may either:
- Use the Express-style mutator (`res.status(...).json(...)`) and return nothing, **or**
- Return a `JsonResponse` object (`{ statusCode, body }`) directly.

### Path-collision warning

Custom endpoints register **after** the auto-CRUD routes, and Express picks the first matching route. That means any `GET /:something` on a model with auto-CRUD enabled will be shadowed by the auto `GET /:id` route. Two safe patterns:

- Use a sub-segment: `'POST /:id/play'`, `'GET /:id/related'` — these don't collide because the auto route is exactly `/:id`, not `/:id/anything`.
- Hang the endpoint off a model with `exposeApi: false` (the audit-log pattern below) — that model has no auto routes, so its own custom endpoints can use any path including bare `'GET /list'`.

## `exposeApi` — hide a model from auto-CRUD

Set `exposeApi: false` and the framework will:

- **Skip** auto-generated `GET / GET /:id / POST / PATCH /:id / DELETE /:id` for that collection.
- **Skip** auto-generated GraphQL types/resolvers (when `api-graphql` is in use).
- **Still register** the model's schema with the database adapter, so other code can read/write it through `ctx.db`.
- **Still register** any `endpoints` declared on the model. Use this to expose only the operations you want to allow.

```ts
// models/audit-log.ts
export default defineModel({
    exposeApi: false,
    fields: {
        id: types.id(),
        collection: types.string({ required: true }),
        action: types.string({ required: true }),
        recordId: types.string({ required: true }),
        at: types.date()
    },
    endpoints: {
        'GET /list': async (_req, res, ctx) => {
            const rows = await ctx.db.getAll('audit-log');
            res.status(200).json(rows);
        }
    }
});
```

```bash
# Auto-CRUD is gone:
curl -i http://localhost:3000/audit-log         # → 404
curl -i -X POST http://localhost:3000/audit-log # → 404

# But the curated read endpoint works:
curl http://localhost:3000/audit-log/list
```

This pattern — hidden auto-CRUD plus a small allowlist of custom endpoints — is the cleanest way to model an internal collection (audit logs, outboxes, denormalized caches) without giving HTTP clients write access.

## Reading related records — `_expand`

`types.relation(...)` declares a virtual field that's omitted from auto-CRUD responses by default — only the foreign-key column comes through. Pass `_expand=<fieldName>` on any auto-generated `GET` to hydrate the relation inline.

The name in `_expand` is the **relation field**, not the FK column. On `albums.ts` the relation field is `artist`, the FK is `artistId`:

```bash
# A single album with its artist record inlined
curl 'http://localhost:3000/albums/alb-1?_expand=artist'

# Every album with its artist
curl 'http://localhost:3000/albums?_expand=artist'

# Inverse direction — an artist plus the albums that point at them
curl 'http://localhost:3000/artists/art-1?_expand=albums'

# Multiple relations in one request
curl 'http://localhost:3000/albums?_expand=artist,producer'
```

Shape of the expanded value depends on the relation type:

| Relation type | `_expand=field` returns |
| --- | --- |
| `many-to-one` | A single object (the parent record) or `null` |
| `one-to-one` | A single object or `null` |
| `one-to-many` | An array of children pointing back via the FK |
| `many-to-many` | An array |

`_expand` accepts a comma-separated list of field names defined on the current model. Nested expansion (e.g. `_expand=artist.albums`) is **not** supported — issue follow-up requests on the expanded record if you need to walk further.

> Without `_expand`, the FK column appears alone and the relation field is left out of the response.

## What this folder contains

- `package.json` — declares only `@json-express/boot`
- `models/` — three cooperating model files
- `data/` — minimal seed data so curl examples have something to hit
- `tests/` — Playwright specs grouped by feature: `hooks.spec.ts`, `endpoints.spec.ts`, `expose.spec.ts`

## See also

- [`simple-models`](../simple-models/README.md) — fields, types, relations, the basics of `defineModel`
- [`middleware-auth`](../middleware-auth/README.md) — the `access` block on a model
- [`api-graphql`](../api-graphql/README.md) — the `graphql` block on a model
- [`@json-express/core`](../../packages/core/README.md) — full reference for `ModelConfig`, `HookContext`, and `CustomEndpointHandler`
