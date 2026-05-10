---
title: "@json-express/config-env"
description: "Twelve-Factor environment variable configuration provider for JSONExpress — auto-discovered, zero-dependency, lowercase-preferred."
---

# @json-express/config-env

> The default `IConfigProvider` shipped with `@json-express/boot`.

`@json-express/config-env` implements `IConfigProvider` using the **Twelve-Factor App** methodology. It reads configuration exclusively from `.env` files and system environment variables, making it the simplest and most Docker / Kubernetes-friendly configuration strategy.

It is auto-discovered by the `json-express` runtime and ships as a dependency of [`@json-express/boot`](/packages/boot) — most users never install it directly.

## Installation

If you are not using `@json-express/boot` and want to install the runtime piece-by-piece:

```bash
npm install @json-express/config-env
```

## Naming convention

JSONExpress uses the `jex` namespace for every configuration key. **Lowercase is preferred**:

```bash
jex.port=3000
jex.auth.secret=a-strong-32-byte-secret
jex.transport=@json-express/transport-fastify
```

Cloud platforms that forbid lowercase env vars or dotted names (Heroku, some PaaS) are supported via the uppercase double-underscore form `JEX__KEY` — this is the same key, just spelled differently:

```bash
JEX__AUTH__SECRET=a-strong-32-byte-secret    # equivalent to jex.auth.secret
```

> [!IMPORTANT]
> The single-underscore form `JEX_AUTH_SECRET` is **not supported** — it would be ambiguous with single-word keys (`JEX_PORT`). The provider rejects it. Always use double underscore (`__`) when the dot is unavailable.

## Example `.env`

```bash
# Server
jex.port=3000

# Logging
jex.log.level=debug
jex.log.pretty=true

# Authentication
jex.auth.secret=a-strong-32-byte-secret
jex.auth.exclude=/auth,/health
jex.auth.tokenTtl=1h

# Plugin selection (only required when multiple of the same category are installed)
jex.transport=@json-express/transport-fastify
jex.adapter=@json-express/adapter-json
```

## Cascading precedence

The provider walks `.env` files in this order. Later wins, system env wins last:

1. `.env`
2. `.env.[NODE_ENV]` (e.g. `.env.development`)
3. `.env.local`
4. `.env.[NODE_ENV].local` (e.g. `.env.development.local`)
5. **`process.env`** — system environment variables (Docker, Kubernetes, CI)

When [`@json-express/config`](/packages/config) is also installed, the framework merges its own cascade on top of `.env`:

1. Plugin defaults
2. `jex.config.*` (TypeScript / YAML / JSON)
3. `jex.config.[NODE_ENV].*`
4. `.env` and friends (steps 1–4 above)
5. `jex.config.[NODE_ENV].local`
6. `process.env`

The general rule: **anything you can express in `.env` wins over anything in `jex.config.*`** unless the file is the `.local` variant. Commit `.env` and `jex.config.ts` to source control with safe defaults; keep `.env.local` and `jex.config.local.ts` gitignored.

## Automatic nested object construction

The provider uses `buildNestedConfigFromEnv()` from `@json-express/core` to convert flat keys into nested objects:

```bash
jex.auth.secret=abc123
jex.auth.email.from=noreply@example.com
```

Reads as:

```typescript
config.get('auth.secret')        // 'abc123'
config.get('auth.email.from')    // 'noreply@example.com'
config.get('auth.email')         // { from: 'noreply@example.com' }
```

Both `.` and `__` are nesting separators. Single `_` stays inside the segment — `jex.auth.token_ttl` is `{ auth: { token_ttl: '1h' } }`, not `{ auth: { token: { ttl: '1h' } } }`.

## Zero external dependencies

This provider depends only on `dotenv`. It boots in under 1 ms and adds no compile step. For richer configuration formats (YAML, TypeScript with imports, environment-specific files), install [`@json-express/config`](/packages/config) alongside it.

## Related

- [@json-express/config](/packages/config) — advanced alternative with YAML / TypeScript support
- [@json-express/boot](/packages/boot) — bundles this provider in the default stack
- [@json-express/core](/packages/core) — exposes `buildNestedConfigFromEnv` and the `IConfigProvider` contract
