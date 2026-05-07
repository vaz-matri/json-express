# Zod request validation example

Adds [Zod](https://zod.dev) schema validation in front of your routes. Bad payloads get rejected with `400` and a structured error before they reach your data layer.

Validation lives in your model file, alongside the entity it guards — there is no separate `validation.rules` block in `jex.config.ts`.

## Setup

```bash
npm install @json-express/boot @json-express/middleware-validation zod
```

Declare the entity and its validation in `models/products.ts`:

```ts
import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true }),
        price: types.number({ required: true }),
        inStock: types.boolean(),
    },
    validation: {
        create: {
            body: z.object({
                name: z.string(),
                price: z.number(),
                inStock: z.boolean().default(true),
            }),
        },
    },
});
```

Drop your data into `data/`:

```
data/
├── products.json     # baseline shape demo
├── authors.json      # email + country-code validators
├── books.json        # ISBN regex + relation to authors + custom search endpoint
└── events.json       # all four validation slots: create, update, list, custom
```

## Run it

```bash
npm run serve
```

Now `POST /products` is guarded:

```bash
# Valid — 201 Created
curl -X POST http://localhost:3000/products \
  -H 'content-type: application/json' \
  -d '{"name":"Keyboard","price":79.99}'

# Missing required field — 400 Validation failed
curl -X POST http://localhost:3000/products \
  -H 'content-type: application/json' \
  -d '{"price":49.99}'

# Wrong type — 400 Validation failed
curl -X POST http://localhost:3000/products \
  -H 'content-type: application/json' \
  -d '{"name":"Mouse","price":"not-a-number"}'
```

Failed validations return:

```json
{
  "error": "Validation failed",
  "details": { "body": { "_errors": [], "name": { "_errors": ["Required"] } } }
}
```

## The four validation slots

The `validation` block on a model maps to four kinds of route. You only fill the ones you want guarded — anything you skip is unguarded (or, for `update`, falls back to the auto-derived `.partial()` baseline if you opt in with `{}`).

| Slot                 | Route guarded         | What's checked       | Default baseline                       |
| -------------------- | --------------------- | -------------------- | -------------------------------------- |
| `create.body`        | `POST /<entity>`      | request body         | full Zod object derived from `fields`  |
| `update.body`        | `PATCH /<entity>/:id` | request body         | `.partial()` of the same object        |
| `list.query`         | `GET /<entity>`       | querystring          | `z.object({}).passthrough()`           |
| `endpoints[…]`       | any custom route      | body and/or query    | per-endpoint, no auto-baseline applied |

Each slot accepts three input forms:

- a Zod schema (`z.object({...})`) — used as-is
- a builder `(baseline) => z.ZodTypeAny` — extend or replace the auto-derived baseline
- `{}` — opt into the baseline as-is

See [`@json-express/middleware-validation`](../../packages/middleware-validation/README.md) for the baseline derivation rules.

### `update.body` — partial body on PATCH

```ts
// models/events.ts
update: {
    body: (baseline) =>
        baseline.extend({
            capacity: z.number().int().min(1).max(10_000).optional(),
        }),
},
```

```bash
# Valid partial update — 200
curl -X PATCH http://localhost:3000/events/1 \
  -H 'content-type: application/json' \
  -d '{"capacity":300}'

# Capacity out of range — 400
curl -X PATCH http://localhost:3000/events/1 \
  -H 'content-type: application/json' \
  -d '{"capacity":99999}'
```

The `update` baseline is automatically `.partial()`'d — clients only need to send the fields they're changing.

### `list.query` — querystring filters

```ts
list: {
    query: z.object({
        location: z.string().optional(),
        upcoming: z.enum(['true', 'false']).optional(),
        limit: z.coerce.number().int().min(1).max(100).optional(),
    }),
},
```

```bash
# Valid — 200
curl 'http://localhost:3000/events?location=Berlin&limit=20'

# limit isn't a number — 400
curl 'http://localhost:3000/events?limit=banana'
```

`z.coerce.number()` is handy here since querystrings arrive as strings.

### Custom endpoints — `{ handler, validation }`

The bare-function form `'POST /:id/play': async (req, res, ctx) => {...}` still works. To attach validation, switch to the object form:

```ts
// models/books.ts
endpoints: {
    'GET /search': {
        validation: {
            query: z.object({
                q: z.string().min(2, 'Search term must be at least 2 characters'),
                limit: z.coerce.number().int().min(1).max(50).default(10),
            }),
        },
        handler: async (req, res, ctx) => {
            const { q, limit } = req.query as { q: string; limit: number };
            const all = await ctx.db.list('books');
            const needle = q.toLowerCase();
            const hits = all
                .filter((b: any) => String(b.title).toLowerCase().includes(needle))
                .slice(0, limit);
            res.status(200).json({ q, count: hits.length, results: hits });
        },
    },
},
```

```bash
# Valid — 200
curl 'http://localhost:3000/books/search?q=pragmatic'

# Too short — 400
curl 'http://localhost:3000/books/search?q=p'
```

Custom-endpoint validation supports `body` and `query` only. URL params (`:id`) are not auto-validated — assert on `req.params` inside your handler if you need it.

## More collections, more validators

The other models each demonstrate a different flavor of Zod check:

### `authors` — email + ISO country code

```ts
// models/authors.ts
validation: {
    create: {
        body: z.object({
            name: z.string().min(2),
            email: z.string().email(),
            country: z.string().length(2, 'Use a 2-letter country code').optional(),
        }),
    },
}
```

```bash
# Bad email — 400
curl -X POST http://localhost:3000/authors \
  -H 'content-type: application/json' \
  -d '{"name":"Andy","email":"not-an-email"}'
```

### `books` — ISBN regex + relation to authors

```ts
// models/books.ts
fields: {
    // ...
    authorId: types.number({ required: true }),
    author: types.relation({ target: 'authors', type: 'many-to-one', foreignKey: 'authorId' }),
},
validation: {
    create: {
        body: z.object({
            title: z.string().min(1),
            authorId: z.number().int().positive(),
            isbn: z.string().regex(/^\d{3}-\d{10}$/, 'ISBN must look like 978-0135957059'),
            pages: z.number().int().positive().optional(),
        }),
    },
}
```

```bash
# Valid book linked to author 1 — 201
curl -X POST http://localhost:3000/books \
  -H 'content-type: application/json' \
  -d '{"title":"Refactoring","authorId":1,"isbn":"978-0134757599"}'

# Hydrate the author inline
curl 'http://localhost:3000/books?_expand=author'
```

The reverse side is declared on `authors` as `books: types.relation({ target: 'books', type: 'one-to-many', foreignKey: 'authorId' })`, so `GET /authors?_expand=books` returns each author with their books array.

## Framework config in `jex.config.ts`

`jex.config.ts` is for **framework-level** settings (port, log level, CORS, etc.) — never validation rules.

```ts
// jex.config.ts
export default ({ env }: { env: string }) => ({
    transport: {
        port: 3000,
        host: '0.0.0.0',
    },
    logger: {
        level: env === 'production' ? 'warn' : 'debug',
    },
    cors: {
        origin: '*',
    },
});
```

This file is read by [`@json-express/config`](../../packages/config/README.md) (the advanced YAML/JSON/TS provider). The default stack from `@json-express/boot` ships with `@json-express/config-env` — there, the same keys live in `.env` instead, e.g. `jex.transport.port=3000`. Either provider hands the same shape to plugins. See the [`config` example](../config/README.md) for the full key inventory.

## Why this matters

Validation rules live next to the entity, so the file you read to understand "what is a Product" is the same file that defines "what does a valid Product request look like." No second surface, no two-place duplication.

## What's in this folder

- `package.json` — declares `@json-express/boot`, `@json-express/middleware-validation`, and `zod`
- `models/products.ts` — baseline + `.default()` demo
- `models/authors.ts` — email + country-code validators, one-to-many to books
- `models/books.ts` — ISBN regex + many-to-one to authors + custom `GET /search` endpoint with query validation
- `models/events.ts` — full slot tour: `create.body`, `update.body`, `list.query`
- `data/*.json` — initial collection state (two seed rows each)
- `jex.config.ts` — framework-level config example (transport, logger, cors)

## See also

- [`@json-express/middleware-validation`](../../packages/middleware-validation/README.md) — package README with auto-baseline and builder-form details
- [`routes-only` example](../routes-only/README.md) — fieldless models via `defineRoutes()` for non-entity routes
- [`models-adv` example](../models-adv/README.md) — relations, hooks, and custom endpoints in depth
- [`config` example](../config/README.md) — every framework config key, in `.env` form
