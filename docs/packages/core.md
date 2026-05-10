---
title: "@json-express/core"
description: "The microkernel, schema engine, and runtime — ships the json-express binary that boots every JSONExpress application."
---

# @json-express/core

> The foundational kernel **and** the runtime entrypoint of the entire JSONExpress ecosystem.

The `@json-express/core` package serves two roles:

1. **The contract layer** — TypeScript interfaces every plugin must implement (`IDatabaseAdapter`, `ITransport`, `IApiGenerator`, …) plus the schema engine (`defineModel`, `defineRoutes`, `types`).
2. **The runtime** — the `json-express` binary that auto-discovers installed plugins from `package.json`, instantiates them in dependency order, and starts the server.

Core itself contains zero HTTP, zero database, and zero filesystem-handler logic. Every concrete capability comes from a separate `@json-express/*` package.

## Installation

Most users install [`@json-express/boot`](/boot), which depends on core. Install core directly only if you want to hand-pick every plugin:

```bash
npm install @json-express/core
```

You will also need at least one transport, one adapter, one API generator, one logger, and a config provider for the runtime to boot.

## The `json-express` binary

Core ships a single binary:

```bash
npx json-express                                # Start the server
npx json-express --seed                          # Run any installed seeders (idempotent)
npx json-express --seed-append                   # Append seed records instead of resetting
npx json-express --preset-init                   # Extract templates from an installed preset
npx json-express --preset-init=@scope/preset     # Pick a specific preset by name
```

The binary boots through these stages (see `kernel.ts:boot`):

1. Load the `IConfigProvider` (defaults to `@json-express/config-env`).
2. Recursively walk `package.json` dependencies for `@json-express/*` packages and any package whose name contains `json-express-`.
3. Resolve the active package per category — `adapter`, `api`, `transport`, `logger`, `docs`, `id`. If multiple are installed in one category, the binary aborts and asks you to set `jex.<category>=<pkg>` in `.env`.
4. Run every plugin's `onRegister`, generate routes via `apiGenerator.generate(collections)`, compose middlewares per route, register routes with the transport.
5. Run seeders if `--seed` was passed.
6. Run `onBoot`, mount docs routes, call `transport.start(port)`, fire `onReady`.

There is no separate `@json-express/cli` package required to use this binary.

## What core exports

### 1. Interface contracts (`src/types.ts`)

The TypeScript interfaces that define the rules of the ecosystem:

- `IDatabaseAdapter` — every database (Memory, JSON, Postgres, …)
- `IApiGenerator` — every API layer (REST, GraphQL, …)
- `ITransport` — every HTTP server (Express, Fastify, …)
- `IMiddleware` — every middleware (auth, validation, …)
- `IPlugin` — every boot-time plugin (identity, devcert, health, …)
- `IConfigProvider` — every configuration engine (env, file, …)
- `ILogger`, `IKvStore`, `IQueueAdapter`, `IEmailProvider`, `ISeeder`, `IIdGenerator`

### 2. The schema engine — `defineModel` and `defineRoutes`

`defineModel` is for entities (anything with `fields`). It auto-generates CRUD against the listed fields and lets you decorate with hooks, access rules, validation, custom endpoints, and GraphQL extensions.

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'products',
    fields: {
        id: types.id(),
        title: types.string({ unique: true }),
        price: types.number(),
        inStock: types.boolean({ default: true })
    }
});
```

`defineRoutes` is sugar for fieldless / route-only models — search endpoints, webhooks, anything that does not represent an entity. The filename becomes the mount prefix, the endpoint key the suffix.

```typescript
// models/search.ts
import { defineRoutes } from '@json-express/core';

export default defineRoutes({
    endpoints: {
        'GET /': async ({ query }) => {
            // GET /search?q=...
        }
    }
});
```

Internally `defineRoutes` is `defineModel({ exposeApi: false, ... })` — it suppresses the auto-generated CRUD surface and keeps everything else.

### 3. The kernel and runtime utilities

```typescript
import { JsonExpressKernel, startServer, runPresetInit } from '@json-express/core';
```

- `JsonExpressKernel` — the awilix container, plugin registries, and `boot()` / `shutdown()` lifecycle.
- `startServer()` — what `npx json-express` calls. Auto-discovery + boot.
- `runPresetInit(cwd, flagArg)` — what `--preset-init` calls. Copies a preset's `templates/` into `cwd`.

### 4. Access control utilities

- `evaluateAccess(rule, userPayload)` — allow / deny / owner-check decision.
- `needsOwnerCheck(rule)` — `true` if rule is `'owner'`.
- `ownsRecord(record, ownerField, user)` — compares the record owner field against the JWT payload.
- `stripDeniedReadFields()` / `stripDeniedWriteFields()` — strip forbidden fields from API payloads.

### 5. The adapter compliance suite

A testing utility that lets custom adapter authors verify their implementation:

```typescript
import { runAdapterComplianceTests } from '@json-express/core';

await runAdapterComplianceTests(
    async () => new MyCustomAdapter(),
    async (db) => await db.disconnect()
);
```

### 6. Request context (`AsyncLocalStorage`)

Per-request tracing wrapper:

```typescript
import { RequestContext } from '@json-express/core';

const traceId = RequestContext.getTraceId(); // auto-injected UUID
```

## Related

- [@json-express/boot](/boot) — the recommended default stack
- [Presets](/presets) — bundle a stack as a single npm package
- [@json-express/config-env](/config-env) — the default configuration provider
- [Architecture](/architecture) — kernel, IoC container, plugin lifecycle in depth
