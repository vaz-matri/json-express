---
title: "@json-express/middleware-validation"
description: "Model-driven request body and query string validation middleware for JSONExpress APIs, powered by Zod."
---

# @json-express/middleware-validation

> Official Zod validation middleware for JSONExpress.

The `@json-express/middleware-validation` package implements `IMiddleware` and provides automatic request body / query string validation. Validation rules live **inside the model file** they guard — there is no separate `validation.rules` block in `jex.config.ts`. The middleware reads each model's `validation` block at boot, derives a Zod baseline from the model's `fields`, and rejects malformed requests with a structured 400 before they reach the database.

## Installation

```bash
npm install @json-express/middleware-validation zod
```

The CLI auto-discovers and registers it. No further wiring required.

## Configuration

Validation lives next to the entity it describes:

```typescript
// models/users.ts
import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        id: types.id(),
        email: types.string({ required: true }),
        role: types.string({ required: true }),
    },
    validation: {
        // POST /users — full schema (overrides baseline)
        create: {
            body: z.object({
                email: z.string().email(),
                role: z.enum(['user', 'admin']).default('user'),
            }),
        },
        // PATCH /users/:id — partial baseline + email refinement via builder
        update: {
            body: (baseline) =>
                (baseline as any).extend({
                    email: z.string().email().optional(),
                }),
        },
        // GET /users — query-string validation
        list: {
            query: z.object({
                role: z.enum(['user', 'admin']).optional(),
            }),
        },
    },
});
```

## Core Features

### 1. Op-keyed validation (CRUD)

Each entry under `validation` corresponds to a generated CRUD operation:

| Op | HTTP route | What it validates |
|---|---|---|
| `create` | `POST /<collection>` | request body |
| `update` | `PATCH /<collection>/:id` | request body (baseline auto-becomes `.partial()`) |
| `list`   | `GET /<collection>` | query string |

You don't write `{ method, path }` — the route is implied by the model.

### 2. Auto-derived baseline

When `validation[op].body` is `undefined` (an empty op block: `create: {}`), the middleware uses a baseline Zod schema derived from the model's `fields`:

| Field type | Zod | Honored options |
|---|---|---|
| `types.string` | `z.string()` | `minLength` → `.min(n)`, `maxLength` → `.max(n)` |
| `types.number` | `z.number()` | `min` → `.min(n)`, `max` → `.max(n)` |
| `types.boolean` | `z.boolean()` | — |
| `types.date` | `z.union([z.string(), z.date()])` | — |
| `types.id` / `types.relation` | skipped | (server-generated / server-resolved) |

`required: true` keeps the field non-optional; otherwise it's `.optional()`. For `update` the baseline is automatically `.partial()` so PATCH requests can omit fields.

### 3. Extend, override, or take the baseline

| Form | Behavior |
|---|---|
| op block absent | No validation — middleware passes through. |
| `{}` (empty op block) | Use baseline. |
| `(baseline) => Validator` | Builder — extend the baseline. |
| `Validator` (e.g. `z.object(...)`) | Override the baseline. |

### 4. Custom endpoints

Per-endpoint validation lives next to the handler in the model's `endpoints` block:

```typescript
endpoints: {
    'POST /:id/play': {
        handler: async (req, res, ctx) => { /* ... */ },
        validation: {
            body: z.object({ trackNumber: z.number().int().positive() }),
        },
    },
}
```

The bare-function form (`'POST /:id/play': handler`) still works when no validation is needed.

### 5. Fieldless / route-only models

Routes that don't model an entity (`/search`, `/auth/login`, webhooks) use `defineRoutes()`:

```typescript
// models/search.ts
import { defineRoutes } from '@json-express/core';
import { z } from 'zod';

export default defineRoutes({
    endpoints: {
        'GET /': {
            handler: async (req, res, ctx) => { /* ... */ },
            validation: {
                query: z.object({ q: z.string().min(2) }),
            },
        },
    },
});
```

Mounts as `GET /search`. No CRUD codegen.

### 6. Payload sanitization

When validation succeeds, the middleware replaces the raw `req.body` (or `req.query`) with Zod's parsed output. Transformations like `.default()`, `.trim()`, `.transform()`, and `.coerce.number()` are applied before the handler runs.

### 7. Structured error responses

```json
{
    "error": "Validation failed",
    "details": {
        "body": {
            "email": { "_errors": ["Invalid email"] }
        }
    }
}
```

### 8. Plugin-swappable

`Validator` is a structural type — anything with `safeParse(v): { success, data, error }` works. Core never imports Zod, so a future `middleware-validation-yup` or `-valibot` could ship without forking.

### 9. GraphQL

`api-graphql` reads `validation.create.body` and `validation.update.body` directly from each model. Only the direct-Validator form is honored on the GraphQL side (the builder form requires the auto-baseline that lives in this middleware). Declare a concrete schema if you want validation on both REST and GraphQL.

## Related Packages

- [`@json-express/middleware-auth`](/packages/middleware-auth) — auth runs *before* validation, so unauthenticated callers are 401'd before any schema is parsed.
- [`@json-express/api-rest`](/packages/api-rest) — attaches this middleware to CRUD routes when the model declares a `validation` block for the matching op, and to custom endpoints whose object form carries `validation`.
- [`@json-express/api-graphql`](/packages/api-graphql) — applies the create/update validators to mutations, throwing `GraphQLError` with `BAD_USER_INPUT` extensions on failure.
