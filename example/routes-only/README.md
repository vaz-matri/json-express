# Fieldless models / `defineRoutes()` example

Some routes don't belong to an entity — `/search`, `/auth/login`, `/webhooks/stripe`. In JSONExpress v2, those still live in `models/*.ts`, but with no `fields` block. `defineRoutes()` is sugar that signals intent.

## Setup

```bash
npm install @json-express/boot @json-express/middleware-validation zod
```

Drop a regular collection in `data/`:

```
data/
└── products.json
```

Add a fieldless model that exposes a search endpoint:

```ts
// models/search.ts
import { defineRoutes } from '@json-express/core';
import { z } from 'zod';

export default defineRoutes({
    endpoints: {
        'GET /': {
            handler: async (req, res, ctx) => {
                const q = String(req.query.q ?? '').toLowerCase();
                const products = await ctx.db.getAll('products');
                const matches = products.filter((p: any) => p.name.toLowerCase().includes(q));
                res.status(200).json({ query: q, results: matches });
            },
            validation: {
                query: z.object({ q: z.string().min(2) }),
            },
        },
    },
});
```

`defineRoutes` is a thin wrapper over `defineModel({ exposeApi: false, ... })` — same loader, same machinery, just no entity declared.

## Path derivation

The filename is the mount prefix; the endpoint key is the suffix:

| File | Endpoint key | Mounted as |
|---|---|---|
| `models/search.ts` | `'GET /'` | `GET /search` |
| `models/search.ts` | `'GET /suggest'` | `GET /search/suggest` |
| `models/webhooks.ts` | `'POST /stripe/payment'` | `POST /webhooks/stripe/payment` |

## Run it

```bash
npm run serve
```

```bash
# Valid query — returns matching products
curl 'http://localhost:3000/search?q=key'

# Too-short query — 400 from middleware-validation
curl 'http://localhost:3000/search?q=a'

# CRUD on /search is NOT generated (no fields, exposeApi:false)
curl 'http://localhost:3000/search/anything'   # → 404

# The underlying products collection still has full CRUD
curl 'http://localhost:3000/products'
```

## When to use `defineRoutes` vs `defineModel`

| You want… | Use |
|---|---|
| An entity with auto-CRUD + maybe custom endpoints/validation | `defineModel({ fields, ... })` |
| Routes only, no entity (search, login, webhooks) | `defineRoutes({ endpoints, ... })` |

Same folder (`models/`), same loader, same mental model.

## See also

- [`@json-express/middleware-validation`](../../packages/middleware-validation/README.md) — validation block and validator resolution
- [`middleware-validation` example](../middleware-validation/README.md) — entity-bound validation
