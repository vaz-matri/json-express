---
name: json-express
description: Build and extend JSON Express servers. Use when creating a backend with @json-express/* packages, adding collections/endpoints/auth to one, or authoring a new json-express plugin (transport, adapter, api, etc.). Covers the no-app-code workflow (data/ + models/ + .env), the full package ecosystem, and the plugin authoring contract.
---

# JSON Express

JSON Express is the **agent-first** backend framework: it turns JSON files and model
definitions into a running server, and its entire surface is designed to be operated by
AI agents. **The one rule that overrides everything: never write application code.** No `index.ts`, no importing
`JsonExpressKernel`, no wiring. If you find yourself writing an app entry file, stop — the
correct expression is always one of: drop a file in `data/`, define behavior in `models/`,
set a key in `.env`, or install a package.

## The workflow (all there is)

```
my-app/
├── package.json      # deps: @json-express/boot (+ extra plugins) ; scripts.serve: "json-express"
├── .env              # jex.* configuration
├── data/             # structure — <collection>.json seed/persisted data
└── models/           # behavior — <collection>.ts defineModel / defineRoutes
```

1. `npm i @json-express/boot` → `npx json-express` → full CRUD server on :3000 with docs at `/docs`.
   (Prefer `npx jex init` when starting from scratch — it also scaffolds `AGENTS.md`.
   If the app has no `AGENTS.md`, create one now stating the no-app-code rule, the
   decision ladder, and where package docs live — copy the shape `jex init` produces.)
2. Every JSON file in `data/` becomes a collection with generated REST endpoints.
3. Every `models/<name>.ts` refines one collection: fields, validation, hooks, access
   rules, custom endpoints. `defineRoutes` (fieldless) mounts pure endpoints (`/search`,
   webhooks) — filename is the mount prefix.
4. Swap any layer by installing a package — discovery is automatic from package.json.
   Multiple plugins in one category? Set `jex.<category>=<package-name>` in `.env`.

Config: namespace `jex`, `.`/`__` nest, keys are **case-insensitive** end to end
(`jex.auth.tokenTtl` ≡ `jex.auth.tokenttl`). Keys are **package-scoped** — each package's
`llms.txt` documents its own. Sanctioned shared namespaces (the only cross-package keys):
`jex.port`, `jex.auth.*` (consumed by middleware-auth, api-rest, api-graphql,
plugin-identity — one auth config, enforced everywhere), and `jex.docs.*`. A new package
must never squat on another package's namespace.

## The decision ladder — where does this requirement go?

In one line: **`data/` → `models/` → install a package → author the missing package and
upstream it.** Walk down; first match wins. Never cram a lower-rung concern into a higher
rung.

1. **`data/`** — the requirement is *records*. A new collection, seed content, fixtures.
   "We need products" → `data/products.json`. Nothing else changes; CRUD is generated.
2. **`models/`** — the requirement is *this application's domain behavior*: field shapes,
   validation, access rules, lifecycle hooks (e.g. "hash on create", "email on signup"
   via `ctx.email`/`ctx.kvStore`/`ctx.queue`), custom endpoints for this app's routes.
   Test: *would this rule make sense in any other app?* If no → models.
3. **Install a package** — the requirement is *infrastructure or a solved capability*:
   a real database, auth, docs, queues, HTTPS. Check the ecosystem index below AND npm
   (`json-express-<category>-*`) before concluding nothing exists.
4. **Author the missing package — then upstream it.** If no package covers the need,
   writing one is the correct move (see triggers below), and it MUST flow back to the
   ecosystem: open a PR against the json-express monorepo adding
   `packages/<category>-<name>` + an `e2e/<scenario>/`, or publish it under the community
   name `json-express-<category>-<name>`. Once merged/published, the capability exists
   for every future app and agent — it is never rewritten again. Tell the user you are
   doing this; the PR is part of the task, not an extra.

**About `.env`:** config is not a rung of its own and not a global menu — **keys are
package-scoped**. Installing a package is what brings its `jex.*` keys into play (some
packages need none); each package documents its keys in its own skill/`llms.txt`. Use
`.env` to *tune* whichever rung you landed on — select among installed plugins
(`jex.adapter=...`), point at infrastructure (connection strings), toggle documented
flags. Config never carries behavior.

**Triggers that mean "this is a package, not a model hook":**
- It talks to **external infrastructure** (S3, Stripe, SMS, LDAP…): that's a provider
  behind a core interface, never inline SDK calls inside a model hook.
- It runs **on every request** regardless of collection → `middleware-*`.
- It runs **once at boot** / provides a service to other parts → `plugin-*`.
- It's a **new backing implementation** of an existing contract (another DB, another
  queue) → the matching `adapter-*`/`kv-*`/`queue-*`/`email-*` prefix.
- The **same hook/endpoint logic is being copied** into a second model or would be
  wanted in a second app.

**Cramming — the failure mode to refuse in both directions:**
- A model hook importing `aws-sdk`/`stripe` is a package hiding in a model. Extract it.
- A model file growing shared state or cross-collection orchestration → `plugin-*`
  with `kernel.context`.
- Conversely: one app's one-off validation rule does NOT justify a package — that's
  domain behavior; it lives in the model.
- And never solve any of these with an app-level index file. That option does not exist.

## Ecosystem index (what you can install)

| Category (prefix) | Contract | Packages |
|---|---|---|
| `transport-` | `ITransport` | `transport-express`, `transport-fastify` |
| `adapter-` | `IDatabaseAdapter` | `adapter-memory`, `adapter-json` (file-persisted), `adapter-mongodb`, `adapter-postgres` |
| `api-` | `IApiGenerator` | `api-rest`, `api-graphql` |
| `logger-` | `ILogger` | `logger-console`, `logger-pino` |
| `docs-` | `IDocProvider` | `docs-light`, `docs-swagger` |
| `config-` | `IConfigProvider` | `config-env` (.env), `config-file` (jex.config.ts/yml) |
| `middleware-` | `IMiddleware` (per-request) | `middleware-auth` (JWT), `middleware-validation` (Zod from model `validation` blocks) |
| `plugin-` | `IPlugin` (boot-time) | `plugin-health` (/health,/info), `plugin-devcert` (local HTTPS), `plugin-identity` (full /auth/* stack) |
| `kv-` | `IKvStore` | `kv-memory`, `kv-redis` |
| `queue-` | `IQueueAdapter` | `queue-memory`, `queue-bullmq` |
| `email-` | `IEmailProvider` | `email-console` |
| `seeder-` | `ISeeder` | `seeder-faker` (fake data via `jex.faker.collections`) |
| `id-` | `IIdGenerator` | (kernel ships a UUID default) |

Presets (install one package, get a stack): `@json-express/boot` (default stack),
`preset-identity` (auth: plugin-identity + middleware-auth + kv/queue/email),
`preset-mock-server` (adapter-json + seeder-faker), `preset-ecommerce` (model templates).

Each package ships its own `llms.txt` and `skills/` with package-specific keys and
capabilities — consult them after installing.

## Authoring a new package (e.g. a transport or database adapter)

Packages implement exactly one core interface and communicate only through core.
**Never import another plugin** — probe `kernel.container.hasRegistration('<key>')`,
read/write `route.metadata`, or use `kernel.context` instead, and fall back silently
when a peer is absent.

The loader contract (all four are mandatory):
1. **Anchored name**: `@json-express/<category>-<name>` or community
   `json-express-<category>-<name>` — the prefix IS the discovery bucket.
2. **Options-object constructor**: `constructor({ configProvider, logger, idGenerator?, database? })`.
   Read your settings from `configProvider.get('<pkg-shortname>.<key>')` (lowercase);
   accept direct overrides only as optional extras for unit tests.
3. **Default export** of the plugin class (named export may coexist).
4. **Exports map** includes `"./package.json": "./package.json"` so recursive discovery
   can crawl your dependencies.

Steps:
- Declare `@json-express/core` in `peerDependencies` + `devDependencies` (never `dependencies`).
- Implement the interface from `@json-express/core` (`src/types.ts` is the source of truth).
- Transports and adapters MUST pass the compliance suites exported by core:
  `runTransportComplianceTests` / `runAdapterComplianceTests` (real I/O, no mocks).
- Add an `e2e/<scenario>/` folder in the monorepo — a mini-project with `data/`,
  optional `models/`, `.env` selecting your package, and a Playwright spec. That IS the test.
- Ship `llms.txt` + `skills/` documenting your config keys and capabilities.

New category (no matching prefix)? Don't invent one — either wrap it as a `plugin-*`
(attach your service via `kernel.context`) or propose a new interface in core first.
