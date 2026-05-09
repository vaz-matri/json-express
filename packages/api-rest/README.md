<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# `@json-express/api-rest`

> **REST API generator plugin for JSONExpress v2.**
> Automatically generates a full CRUD REST API for every collection registered in the active database adapter—including a universal cross-collection search endpoint.

---

## What It Does

This plugin implements the `IApiGenerator` interface. When the JSONExpress Kernel boots, it calls `generate(collections)` and this plugin returns a complete set of `RouteDefinition` objects — one for each standard CRUD operation per collection, plus a global `/search` endpoint.

The Transport layer (e.g., `@json-express/transport-express`) then binds these abstract definitions to real HTTP routes.

---

## Generated Endpoints

For every collection (e.g., `users`, `posts`) **that declares `fields`**:

| Method | Path | Description |
|---|---|---|
| `GET` | `/{collection}` | Get all records. Supports flat key-value filtering via query string. |
| `GET` | `/{collection}/:id` | Get a single record by ID. |
| `POST` | `/{collection}` | Create a new record. Auto-generates an `id` if not provided. |
| `PATCH` | `/{collection}/:id` | Partially update a record by ID. |
| `DELETE` | `/{collection}/:id` | Delete a record by ID. |

Fieldless models (`defineRoutes(...)` or `defineModel({ ... })` without a `fields` block) are skipped from CRUD codegen — they declare behavior only. Their custom endpoints (see below) are still mounted.

Plus a global endpoint across all collections:

| Method | Path | Description |
|---|---|---|
| `POST` | `/search` | Universal cross-collection search with a Mongo-style JSON query body. |

---

## The `/search` Endpoint

### Why `POST`?

Unlike `GET`, `POST` allows sending a rich JSON body — enabling complex nested queries, arbitrary payload sizes, and keeping sensitive query parameters out of server access logs.

### Request Body

```json
{
  "collections": ["users", "posts"],
  "query": {
    "status": "active"
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `collections` | `string[]` | No | Target specific collections. Omit to search across **all** active collections. |
| `query` | `object` | No | Key-value filter pairs. Delegated to the active `IDatabaseAdapter.search()`. |

### Response

Returns a map of collection names to their matched records. Empty collections are omitted.

```json
{
  "users": [
    { "id": "1", "name": "Alice", "status": "active" }
  ],
  "posts": [
    { "id": "42", "title": "Hello World", "status": "active" }
  ]
}
```

### Future Database Support

The query object is passed directly to `db.search(collection, query)`. Each adapter is responsible for translating it:

| Adapter | Translation |
|---|---|
| `adapter-memory` | JavaScript `.filter()` on flat key-value equality |
| `adapter-mongodb` *(future)* | Passed natively as a Mongo query object |
| `adapter-postgres` *(future)* | Translated to SQL `WHERE` clauses via Knex.js |

---

## Custom Endpoints

Models can extend the generated CRUD with their own routes via the `endpoints` block. Two forms are supported:

**Bare-function form** — quickest:

```ts
endpoints: {
    'POST /:id/play': async (req, res, ctx) => { /* ... */ },
}
```

**Object form `{ handler, validation }`** — adds per-endpoint body/query validation (read by `@json-express/middleware-validation`):

```ts
endpoints: {
    'GET /search': {
        validation: {
            query: z.object({ q: z.string().min(2) }),
        },
        handler: async (req, res, ctx) => { /* ... */ },
    },
}
```

The plugin also picks up a top-level `endpoints` export from `routes/*.ts` files for global, non-resource routes.

---

## Model-Driven Validation

When a schema declares a `validation` block, this plugin attaches the `validation` middleware to the matching CRUD route(s) and pins the relevant op block in `route.metadata.validation`:

| Slot                         | Route                  | `route.metadata.validation` shape       |
| ---------------------------- | ---------------------- | --------------------------------------- |
| `validation.create`          | `POST /{collection}`   | `{ create: { body } }`                  |
| `validation.update`          | `PATCH /{collection}/:id` | `{ update: { body } }`               |
| `validation.list`            | `GET /{collection}`    | `{ list: { query } }`                   |
| custom endpoint `validation` | the route key          | `{ body?, query? }` (no `create` wrap)  |

The middleware itself reads the resolved schemas at boot via `setSchemas` and compiles its own rule table. This plugin's job is purely to attach the middleware to the right routes and stamp the metadata so downstream consumers (e.g. `docs-swagger`) can introspect the validators.

> The legacy `validation.rules` array config (`{ method, path, body, query }`) has been removed. Validation now lives next to the entity in `models/*.ts`.

---

## Configuration

All options are set via `.env` using the `jex` or `JEX` namespace:

```env
# Global URL prefix for all generated routes
jex.api.rest.prefix=/api/v1

# Disable the /search endpoint entirely
jex.api.rest.search=false
```

With prefix `/api/v1`, routes become `/api/v1/users`, `/api/v1/search`, etc.

---

## Installation

This plugin is bundled as the default API generator in the JSONExpress CLI. To use explicitly:

```bash
npm install @json-express/api-rest
```

---

## Architecture Note

```
Kernel.boot(collections)
  └─ apiGenerator.generate(collections)
       ├─ POST /search   ← registered first to prevent route shadowing
       ├─ GET /users
       ├─ GET /users/:id
       ├─ POST /users
       ├─ PATCH /users/:id
       └─ DELETE /users/:id
```

The `/search` route is registered **before** per-collection routes. This is critical in Express — registering it after `POST /users` would result in Express matching `POST /search` as a request to create a record in a `search` collection.
