# @json-express/core

The IoC Kernel **and** the Auto-Discovery Engine for [JSONExpress](https://github.com/vaz-matri/json-express). Provides the `json-express` binary that runs your server.

This package contains **zero** HTTP logic, **zero** database logic, and **zero** CLI prompts. It plays two roles:

1. **The Kernel** — an `awilix`-backed IoC container that defines the framework's interface contracts and orchestrates the boot lifecycle (register → onRegister → generate routes → boot transport → onReady).
2. **The Auto-Discovery Engine** — at startup, it reads the user's local `package.json`, discovers every installed `@json-express/*` plugin, and wires them into the kernel automatically.

## 📦 Installation

For the **expert** path, install `core` alongside the specific plugins you want — at minimum a config provider, a database adapter, an API generator, a transport, and a logger:

```bash
npm install @json-express/core @json-express/config-env \
            @json-express/adapter-memory @json-express/api-rest \
            @json-express/transport-express @json-express/logger-console
```

For the **beginner** path, just install [`@json-express/boot`](../boot) — it brings `core` plus the recommended default stack via npm dependency resolution.

Run the server with the bundled binary:

```bash
npx json-express
```

## 🧠 The Auto-Discovery Engine

When `json-express` starts, the engine boots in phases:

1. **Discover the config module first.** It scans `package.json` for `@json-express/config-*` packages and instantiates the config provider before anything else, so `jex.*` or `JEX.*` env values can drive plugin selection in subsequent steps. **At least one `config-*` plugin is required** — without it, `core` exits with a clear error.
2. **Discover the rest** of the installed `@json-express/*` plugins, bucketed by category prefix: `transport-`, `adapter-`, `api-`, `logger-`, `docs-`, `middleware-`, `seeder-`, `id-`, `email-`, `kv-`, `queue-`, `plugin-`.
3. **Resolve one plugin per required category.** Required categories are `config-`, `adapter-`, `api-`, `transport-`, `logger-`. If a category has multiple installs and no `jex.<category>` or `JEX.<CATEGORY>` env override, `core` errors out and points the user at `npx jex configure`.
4. **Wire everything into the kernel** and call `kernel.boot(...)` — the API generator builds routes, the database loads data, and the transport starts listening.

The engine is **non-interactive** — for plugin disambiguation, see [`@json-express/cli`](../cli)'s `jex configure` wizard.

## 🏗️ Schema Definition (Models)

JSONExpress is a schema-driven engine. You can define your data models in pure JSON or use the powerful TypeScript API via `defineModel`.

We support **two API styles** for TypeScript definitions, allowing you to choose between ergonomic Zod-style builders or a declarative Options-Object format.

### 1. The Fluent Zod-Style API (Recommended)
This provides chainable methods with perfect IDE autocomplete, ideal for TypeScript developers:

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'product',
    fields: {
        name: types.string().required().unique(),
        price: types.number().required().default(0).min(0),
        isActive: types.boolean().default(true),
        brandId: types.relation({ target: 'brand', type: 'many-to-one' }).onDelete('RESTRICT')
    }
});
```

### 2. The Options-Object API
This maps 1:1 with pure `.json` models, ideal for strict serialization:

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'product',
    fields: {
        name: types.string({ required: true, unique: true }),
        price: types.number({ required: true, default: 0, min: 0 }),
        isActive: types.boolean({ default: true }),
        brandId: types.relation({ target: 'brand', type: 'many-to-one', onDelete: 'RESTRICT' })
    }
});
```

### Supported Properties

Every field type supports the following `BaseOptions`:
- `required?: boolean`
- `default?: any`
- `unique?: boolean`
- `index?: boolean`

**Specific Types:**
- `types.string()` supports `maxLength`, `minLength`.
- `types.number()` supports `min`, `max`.
- `types.relation({ target, type })` requires `target` (collection name) and `type` (`one-to-many`, `many-to-one`, etc.), and supports `foreignKey`, `onDelete`.
- `types.boolean()`, `types.date()`, `types.id()` support all `BaseOptions`.

### Per-Model Validation

Models may declare a `validation` block — read by [`@json-express/middleware-validation`](../middleware-validation) at boot, inert metadata when that package isn't installed.

```typescript
import { defineModel, types } from '@json-express/core';
import { z } from 'zod';

export default defineModel({
    fields: {
        name: types.string({ required: true }),
        price: types.number({ required: true, min: 0 }),
    },
    validation: {
        create: { body: z.object({ name: z.string().min(2), price: z.number().positive() }) },
        update: { body: (baseline) => baseline.partial() }, // builder form
        list:   { query: z.object({ limit: z.coerce.number().int().max(100).optional() }) },
    },
});
```

Each slot accepts a `Validator` (anything with `safeParse`), a `ValidatorBuilder` `(baseline) => Validator` over the auto-derived field baseline, or `{}` to opt into the baseline as-is. Core never imports Zod — the structural `Validator` interface lets a future `middleware-validation-yup` ship without forking.

### Custom Endpoints

The `endpoints` block accepts both the bare-function form and an object form that lets validation sit next to the handler:

```typescript
endpoints: {
    'GET /:id/play': async (req, res, ctx) => { /* ... */ },        // sugar
    'POST /search': {                                                 // object form
        handler: async (req, res, ctx) => { /* ... */ },
        validation: {
            body: z.object({ q: z.string().min(2) }),
        },
    },
}
```

### Fieldless Route-Only Models — `defineRoutes()`

`fields` is optional. For non-entity routes (`/search`, `/auth/login`, webhooks), use `defineRoutes()` — sugar for `defineModel({ exposeApi: false, ... })`:

```typescript
import { defineRoutes } from '@json-express/core';
import { z } from 'zod';

export default defineRoutes({
    endpoints: {
        'POST /login': {
            handler: async (req, res, ctx) => { /* ... */ },
            validation: { body: z.object({ email: z.string().email(), password: z.string().min(8) }) },
        },
    },
});
```

The filename is the mount prefix (`models/auth.ts` → `/auth/login`). Fieldless models skip CRUD codegen, schema-derived OpenAPI components, and auto-seeding — they declare behavior only.

## 🧩 The Standardized Contracts

Any official or community plugin must implement one of the interfaces exported from `@json-express/core/types`:

- `IConfigProvider` (Configuration Layer)
- `IDatabaseAdapter` (Storage Layer)
- `IApiGenerator` (Paradigm Layer)
- `ITransport` (Server Layer)
- `ILogger` (Observability Layer)
- `IDocProvider` (Documentation Layer)
- `IMiddleware` (Interceptor Layer) — implementations may opt into `setSchemas?(schemas)` to receive the loaded model set once at boot. The runner calls it after middlewares are registered; `middleware-validation` uses this to compile its rule table.
- `ISeeder` (Data Seeding Layer)
- `IPlugin` (Lifecycle Layer)
- `IIdGenerator` (ID Layer)
- `IEmailProvider` / `IKvStore` / `IQueueAdapter` (Optional Side-Effect Layers)

### Request Context & Tracing
The `core` package provides a robust mechanism for request-scoped correlation using Node.js `AsyncLocalStorage`:
- `RequestContext` — a global utility to store and retrieve `traceId` and `startTime` consistently across the entire framework without parameter drilling. Logger plugins (e.g. `@json-express/logger-console`, `@json-express/logger-pino`) read this to enrich every log entry with `traceId`.

### Core Utilities
`core` also exposes Twelve-Factor configuration helpers used by other plugins:
- `buildNestedConfigFromEnv(envVars, namespace)` — converts flat `jex.*` or `JEX.*` env vars into a nested config object.
- `getNestedValue(obj, path, default)` / `setNestedValue(obj, path, value)` — dot-notation access.
- `deepMerge(...objects)` — right-to-left precedence object merge.

## 🚀 Programmatic Usage

If you are building a custom Node.js script and want to bypass auto-discovery, you can instantiate the kernel and register your plugins manually. Note that **`registerLogger` must be called before `boot`** — the kernel no longer ships an internal fallback.

```typescript
import { JsonExpressKernel } from '@json-express/core';
import { EnvConfigProvider } from '@json-express/config-env';
import { ConsoleLogger } from '@json-express/logger-console';
import { MemoryDatabaseAdapter } from '@json-express/adapter-memory';
import { RestApiGenerator } from '@json-express/api-rest';
import { ExpressTransport } from '@json-express/transport-express';

const kernel = new JsonExpressKernel();
const configProvider = new EnvConfigProvider(process.cwd());
const logger = new ConsoleLogger();

kernel.registerConfigProvider(configProvider);
kernel.registerLogger(logger);
kernel.registerDatabase(new MemoryDatabaseAdapter({ configProvider, logger }));
kernel.registerApiGenerator(new RestApiGenerator({ database: kernel.container.resolve('database'), configProvider, logger }));
kernel.registerTransport(new ExpressTransport({ configProvider, logger }));

await kernel.boot(['users', 'posts']);
```

## 📄 License
[MIT License](../../LICENSE)
