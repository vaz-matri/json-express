# `@json-express/docs-swagger`

> **Documentation provider plugin for JSON Express v2.**
> Renders interactive [Swagger UI](https://swagger.io/tools/swagger-ui/) at `/docs` and serves a generated OpenAPI 3.0 specification at `/docs/json`. The spec is built from your model schemas — not by parsing URLs — so resource grouping and component shapes are authoritative.

---

## What It Does

This plugin implements the `IDocProvider` interface. When the JSON Express Kernel boots, it:

1. Receives the project's `ModelSchema[]` via `setSchemas(schemas)` — the same set handed to the database adapter and API generator.
2. Receives the kernel's `RouteDefinition[]` via `getManifest(routes, req)` and `renderDocumentation(routes, path, req)`.
3. Combines the two: schemas drive **what** is documented (resource names, field types, required fields, defaults), routes drive **how** it's exposed (HTTP method, path, security, custom endpoints).

The Transport layer (e.g., `@json-express/transport-express`) mounts the two HTTP endpoints described below.

---

## Mounted Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/docs` | Interactive Swagger UI — full HTML shell, loads `swagger-ui-dist@5.x` from CDN. |
| `GET` | `/docs/json` | Raw OpenAPI 3.0 spec — the same JSON the UI consumes, useful for codegen and CI checks. |

The mount path is configurable via `jex.docs.path` (default `/docs`).

---

## Schema-Driven OpenAPI

For every `ModelSchema` registered with the kernel:

- **`components.schemas.<Collection>`** is generated from `schema.fields`. Field-level options become OpenAPI keywords:
  - `types.string({ minLength, maxLength })` → `{ type: 'string', minLength, maxLength }`
  - `types.number({ min, max })` → `{ type: 'number', minimum, maximum }`
  - `types.date()` → `{ type: 'string', format: 'date-time' }`
  - `types.relation({ target })` → `{ type: 'string', description: 'FK → <target>' }`
  - `{ required: true }` → added to the operation's `required` array
  - `{ default }` → preserved as `default`
- **Operations are tagged** with the resource name (capitalized collection name). Path-segment matching uses the schema's `name` as the source of truth — longest-match wins, so `albums-archive` is never shadowed by `albums`.
- **Request bodies** for `POST`/`PATCH`/`PUT` `$ref` the component schema (`#/components/schemas/<Collection>`) by default.
- **Response bodies** `$ref` the component schema for resource routes; fall back to `{ type: 'object' }` when no schema match is found (e.g., bespoke routes under `routes/`).

If a project has no `models/` folder, schemas are inferred from `data/*.json` and the same generation pipeline applies — every demo gets useful Swagger output for free.

---

## Inter-Package Integration

Three sanctioned channels (see `context/INTER_PACKAGE_ARCHITECTURE.md`) let other plugins enrich the Swagger output without coupling:

### 1. `route.metadata.schema` — Zod override

`@json-express/middleware-validation` attaches a Zod schema to mutation routes. When present, this plugin converts it to OpenAPI and uses it **in place of** the model-derived component schema for that single operation. Useful when validation rules are stricter or differently shaped than persisted fields (e.g. a `confirmPassword` field that's never stored).

### 2. `route.metadata.isProtected` — Bearer auth

When `@json-express/middleware-auth` flags a route as protected, the operation gets `security: [{ bearerAuth: [] }]` and the spec's `components.securitySchemes.bearerAuth` is populated with `{ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }`. Swagger UI's **Authorize** button then unlocks "Try it out" calls with a token.

### 3. `kernel.context` — global state

Not used by this plugin today — but the door is open for, say, a future `plugin-versioning` to pin the spec's `info.version` at boot.

---

## Configuration

All options use the `JEX` namespace:

```env
# Activate this plugin instead of the default docs-light
jex.docs=@json-express/docs-swagger

# Override the mount path (default: /docs)
jex.docs.path=/api-docs

# Override the displayed servers[].url — useful behind a reverse proxy
jex.docs.baseUrl=https://api.example.com/v1

# When api-rest mounts under a prefix, the spec auto-prepends it
jex.api.rest.prefix=/api/v1
```

`baseUrl` resolution falls through this chain, highest precedence first:
1. `jex.docs.baseUrl` (hardcoded override)
2. `x-forwarded-proto` + `x-forwarded-host` (reverse-proxy aware)
3. `req.protocol` + `req.headers.host` + `jex.api.rest.prefix`

---

## Installation

```bash
npm install @json-express/docs-swagger
```

Then activate it:

```env
jex.docs=@json-express/docs-swagger
```

The CLI's auto-discovery will swap out the default `docs-light` provider on the next boot.

---

## Architecture Note

```
Kernel.boot()
  ├─ schemas finalized (user models + plugin-contributed)
  │     │
  │     ▼
  │   docProvider.setSchemas(schemas)   ← source of truth handed in once
  │
  ├─ apiGenerator.generate(collections) → routes[]
  │
  └─ on first request to /docs:
       docProvider.renderDocumentation(routes, '/docs', req) → HTML shell
       docProvider.getManifest(routes, req)                   → OpenAPI 3.0 spec
              │
              ├─ generate components.schemas from ModelSchema[]
              ├─ for each route: tag by matching path against schema names
              ├─ honor route.metadata.schema (Zod) as request-body override
              └─ honor route.metadata.isProtected for security scheme
```

The plugin holds no shared state between requests — `setSchemas` is the only stateful call, and it happens once at boot. Spec generation per request is pure given `(routes, req)` plus the captured schema set.
