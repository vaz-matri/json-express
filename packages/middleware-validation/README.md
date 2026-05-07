# @json-express/middleware-validation

Model-driven validation middleware for JSON Express v2. Reads each model's `validation` block at boot, derives a Zod baseline from `fields`, and rejects malformed requests with a structured 400.

## Features

- **Schema-driven** — declare validation alongside the entity it guards, in `models/*.ts`. No second surface in `jex.config.ts`.
- **Auto-derived baseline** — `required`, `min`/`max`, `minLength`/`maxLength` field options map to Zod automatically. Free 400s without restating the field shape.
- **Extend or override** — pass a builder `(baseline) => baseline.extend({...})` for richer rules, or a hand-rolled Zod schema to fully replace the baseline.
- **Custom endpoints** — per-endpoint validation lives next to the handler in the model's `endpoints` block.
- **Plugin-swappable** — anything with a `safeParse(v)` method works; core stays Zod-agnostic so a future `middleware-validation-yup` could ship without forking.

## Installation

```bash
npm install @json-express/middleware-validation
```

The CLI auto-discovers and registers it. No further wiring needed.

## Usage

### Entity validation

```ts
// models/products.ts
import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        id: types.id(),
        name: types.string({ required: true, minLength: 2 }),
        price: types.number({ required: true, min: 0 }),
        inStock: types.boolean(),
    },
    validation: {
        // Use the auto-derived baseline as-is — empty op block opts in.
        list: {},
        // Extend the baseline for create — adds an email-format check on a new field.
        create: {
            body: (baseline) =>
                (baseline as any).extend({
                    inStock: z.boolean().default(true),
                }),
        },
        // Hand-rolled override for update.
        update: {
            body: z.object({
                name: z.string().min(2).optional(),
                price: z.number().min(0).optional(),
            }),
        },
    },
});
```

This wires:

- `POST /products` → validates body against the create schema.
- `PATCH /products/:id` → validates body against the update schema (or `.partial()` of the baseline if no override).
- `GET /products` → validates query string.

A failing request returns:

```json
{
    "error": "Validation failed",
    "details": { "body": { "_errors": [], "name": { "_errors": ["Required"] } } }
}
```

### Custom endpoints

```ts
// models/albums.ts
export default defineModel({
    fields: { /* ... */ },
    endpoints: {
        'POST /:id/play': {
            handler: async (req, res, ctx) => { /* ... */ },
            validation: {
                body: z.object({ trackNumber: z.number().int().positive() }),
            },
        },
    },
});
```

### Fieldless route-only models

For non-entity routes (`/search`, `/auth/login`, webhooks), use `defineRoutes()`:

```ts
// models/search.ts
import { defineRoutes } from '@json-express/core';
import { z } from 'zod';

export default defineRoutes({
    endpoints: {
        'GET /': {
            handler: async (req, res, ctx) => {
                const products = await ctx.db.getAll('products');
                res.json(products.filter(p => p.name.includes(String(req.query.q))));
            },
            validation: {
                query: z.object({ q: z.string().min(2) }),
            },
        },
    },
});
```

Mounts as `GET /search`. No CRUD codegen, no entity schema — just behavior.

## Validator Resolution

Each `validation[op].body` (and `validation[op].query`) accepts:

| Form | Behavior |
|---|---|
| absent (no op block) | No validation — middleware passes through. |
| `{}` (op block, no body) | Use auto-derived baseline. |
| `(baseline) => Validator` | Builder — receives the baseline, returns the final validator. |
| `Validator` (e.g. `z.object(...)`) | Used directly; baseline ignored. |

The `Validator` type is structural: anything with `safeParse(v): { success, data, error }` works.

## Field → Zod Mapping (Baseline)

| Field type | Zod | Honored options |
|---|---|---|
| `types.string` | `z.string()` | `minLength` → `.min(n)`, `maxLength` → `.max(n)` |
| `types.number` | `z.number()` | `min` → `.min(n)`, `max` → `.max(n)` |
| `types.boolean` | `z.boolean()` | — |
| `types.date` | `z.union([z.string(), z.date()])` | — |
| `types.id` | skipped (server-generated) | — |
| `types.relation` | skipped (resolved server-side) | — |

`required: true` keeps the field non-optional; otherwise it's marked `.optional()`. For `update` ops the baseline is automatically `.partial()` to match PATCH semantics.

## License

MIT
