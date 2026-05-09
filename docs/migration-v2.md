---
title: Migrating to JSONExpress v2
description: JSONExpress v2 is a complete rewrite. The single v1 package has been replaced by a modular ecosystem of 23 focused packages. This guide walks you through the migration.
---

# Migrating to v2

JSONExpress v2 is a full rewrite. The single `json-express` package from v1 has been replaced by a **modular ecosystem** — a headless microkernel and a set of focused, independently installable packages. Every layer (transport, database, API style, logger, auth, docs) is now a swappable plugin.

## What changed

| | v1 | v2 |
|---|---|---|
| Install | `npm install json-express` | `npm install @json-express/boot` + plugins |
| Transport | Express (hardcoded) | `@json-express/transport-express` or `transport-fastify` |
| Database | File-based JSON (hardcoded) | `adapter-memory`, `adapter-json`, or any custom adapter |
| API style | REST only | `api-rest` or `api-graphql` |
| Auth | Built-in, opinionated | `middleware-auth` + `plugin-identity` (opt-in) |
| Extensibility | Limited hooks | Full plugin lifecycle (`onRegister`, `onBoot`, `onReady`, `onShutdown`) |

## Installing v2

The quickest path is `@json-express/boot`, a meta-package that bundles the recommended default stack (Express + in-memory adapter + REST + console logger + docs):

```bash
npm install @json-express/boot
```

From there, swap in individual packages as you need them:

```bash
# Use Fastify instead of Express
npm install @json-express/transport-fastify

# Persist data to JSON files on disk
npm install @json-express/adapter-json

# Add GraphQL alongside REST
npm install @json-express/api-graphql

# Add user identity and JWT auth
npm install @json-express/plugin-identity @json-express/middleware-auth

# Add Swagger / OpenAPI docs
npm install @json-express/docs-swagger

# Add Pino structured logging
npm install @json-express/logger-pino

# Add Faker-powered database seeding
npm install @json-express/seeder-faker
```

JSONExpress auto-discovers any `@json-express/*` package listed in your `package.json` and activates it — no manual wiring required.

## Full package reference

| Package | Purpose |
|---|---|
| `@json-express/boot` | Quickstart preset (bundles the default stack) |
| `@json-express/core` | Microkernel and IoC container (peer dep) |
| `@json-express/config-env` | `.env`-based configuration |
| `@json-express/transport-express` | Express HTTP transport |
| `@json-express/transport-fastify` | Fastify HTTP transport |
| `@json-express/adapter-memory` | In-memory database adapter |
| `@json-express/adapter-json` | JSON file database adapter |
| `@json-express/api-rest` | REST API generator |
| `@json-express/api-graphql` | GraphQL API generator |
| `@json-express/middleware-auth` | JWT authentication middleware |
| `@json-express/middleware-validation` | Zod request validation middleware |
| `@json-express/plugin-identity` | User identity and session management |
| `@json-express/plugin-health` | `/health` endpoint |
| `@json-express/plugin-devcert` | Local HTTPS via `devcert` |
| `@json-express/docs-swagger` | Swagger / OpenAPI UI |
| `@json-express/docs-light` | Lightweight built-in docs |
| `@json-express/logger-console` | Console logger (default) |
| `@json-express/logger-pino` | Pino structured logger |
| `@json-express/seeder-faker` | Faker-powered database seeding |
| `@json-express/kv-memory` | In-memory key-value store |
| `@json-express/queue-memory` | In-memory job queue |
| `@json-express/email-console` | Console email driver (dev) |

## Configuration

v2 uses a `.env`-based config system. The `jex.*` namespace controls all framework settings:

```bash
jex.port=3000
jex.adapter=adapter-json
jex.transport=transport-fastify
```

See the [config-env](/config-env) docs for the full reference.
