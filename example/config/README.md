# Config — the reference example

Every JSON Express plugin reads its settings from a single, shared **config provider**. This example is the canonical reference for that provider: it shows the simplest form (a `.env` file) and documents every other supported file format, every key the framework reads, and which package owns each one.

> New to JSON Express? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## The example, end to end

This folder runs the default stack and overrides one key — the REST prefix — to demonstrate how a single setting flows from a file into a plugin.

`.env`:

```dotenv
jex.api.rest.prefix=/api/v1
```

`data/items.json`:

```json
[{ "id": "1", "name": "Widget", "price": 9.99 }]
```

Run it:

```bash
npm install
npm run serve
```

Routes are now mounted under the prefix instead of the root path:

```bash
# ❌ 404 — root path is no longer used
curl http://localhost:3000/items

# ✅ 200 — under the prefix from .env
curl http://localhost:3000/api/v1/items
```

That's it. The rest of this document is a reference: how config loading works, what files you can use, and every key you can set.

## How config loading works

The kernel resolves a single object — call it the **config tree** — once at boot. Every plugin receives a `configProvider` in its constructor and reads its keys from that tree via `configProvider.get('foo.bar', defaultValue)`.

Two providers ship with the framework, and **only one is active per app**:

| Provider | Package | Sources | When to use |
|---|---|---|---|
| `EnvConfigProvider` (default) | [`@json-express/config-env`](../../packages/config-env/README.md) | `.env*` files + `process.env` | Almost always. Cloud-native, twelve-factor, secret-friendly. |
| `AdvancedConfigProvider` | [`@json-express/config`](../../packages/config/README.md) | `jex.config.{json,yml,yaml,js,cjs,mjs,ts}` files | When you need runtime logic, branching, or imports in your config. |

The CLI auto-discovers whichever one is in your `package.json` deps. **Exactly one** must be installed — the CLI exits with a "no `@json-express/config-*` plugin installed" error otherwise. The default starter stack uses `config-env`; swap it for `@json-express/config` when you need files instead of env vars.

> The two providers are not currently composed — pick one. If you need to mix env-style overrides into TS config, do it inside the TS file itself by reading `process.env`.

## File formats

### `.env` (default — what this example uses)

Plain key=value, parsed by `dotenv`. Any key starting with `jex.` or `jex__` becomes part of the config tree; everything else is ignored by the parser (but stays available on `process.env`).

```dotenv
jex.api.rest.prefix=/api/v1
jex.port=4000
jex.log.level=debug
```

**Cascade order** (highest precedence last — later sources overwrite earlier ones):

1. `.env`
2. `.env.${NODE_ENV}` (e.g. `.env.production`)
3. `.env.local`
4. `.env.${NODE_ENV}.local`
5. `process.env` (real system env vars — always wins)

**Key syntax**:

- `.` and `__` both create nested blocks: `jex.database.url` and `jex__database__url` are equivalent.
- A single `_` is a **word separator inside one key**, not a nesting hint: `jex.max_connections` → `{ max_connections: ... }`, not `{ max: { connections: ... } }`.
- The prefix and key names are **case-insensitive** — the parser lowercases both. `JEX__API__REST__PREFIX` and `jex.api.rest.prefix` produce the same tree. Use uppercase + `__` on cloud platforms that forbid `.` or enforce uppercase env-var names.
- Values are parsed as: `true`/`false` → boolean, numeric strings → number, everything else → string. JSON literals (arrays, objects) are **not** parsed — wrap them in code or use the advanced provider for non-scalar values.

### `jex.config.json` — JSON file

Plain JSON object. No comments, no logic. Loaded by [`@json-express/config`](../../packages/config/README.md).

```json
{
  "api": { "rest": { "prefix": "/api/v1" } },
  "port": 4000
}
```

See the [`json-config` example](../json-config/) for a runnable variant.

### `jex.config.yml` / `jex.config.yaml` — YAML file

Same shape as JSON, with comments and multiline strings. Loaded by `@json-express/config`.

```yaml
api:
  rest:
    prefix: /api/v1
port: 4000
```

### `jex.config.ts` — TypeScript file

The most powerful form. Default-export an object — or a function `({ env }) => object` if you need to branch on the environment. Loaded by `@json-express/config` via [`jiti`](https://github.com/unjs/jiti), so TypeScript needs no build step.

```ts
import { defaultRules } from './validation-rules';

export default ({ env }) => ({
  api: {
    rest: { prefix: env.NODE_ENV === 'production' ? '/api/v1' : '/api' }
  },
  port: env.PORT ? Number(env.PORT) : 3000,
  validation: { rules: defaultRules },
  log: { level: env.LOG_LEVEL ?? 'info' }
});
```

What you get over JSON/YAML:

- Imports — pull in shared constants, validation rule sets, etc.
- Type checking against your editor's TS server (the file isn't compiled at runtime, but it is type-checked in your IDE).
- Computed values — read `process.env`, derive paths, conditionally enable plugins.
- Comments and inline documentation that survive in source control.

### `jex.config.js` / `.cjs` / `.mjs` — JavaScript file

Same shape and loader as `jex.config.ts` — same default-export contract, same `({ env }) => object` function form. Use these when you don't want a TypeScript file in the project but still need runtime logic.

### Cascade for `jex.config.*` files

The advanced provider loads in this order (later overrides earlier):

1. `jex.config.{ext}` — base
2. `jex.config.${NODE_ENV}.{ext}` — mode override (e.g. `jex.config.production.json`)
3. Anything passed in as `envConfigOverrides` (programmatic only — when embedding the kernel directly)

The first matching extension in `[json, yml, yaml, js, cjs, mjs, ts]` wins per layer — having both `jex.config.json` and `jex.config.ts` in the same folder will load the JSON and ignore the TS.

The merge between layers is a **deep merge**, not a replace. If your base file sets `api.rest.prefix` and your `jex.config.production.json` sets `api.rest.cors`, both keys survive in production. Only colliding leaf values are overwritten.

```jsonc
// jex.config.json
{ "api": { "rest": { "prefix": "/api" } }, "log": { "level": "info" } }

// jex.config.production.json
{ "api": { "rest": { "prefix": "/api/v1" } } }

// Effective config when NODE_ENV=production:
// { "api": { "rest": { "prefix": "/api/v1" } }, "log": { "level": "info" } }
```

### Bootstrap-only env vars

A handful of env vars are read by the runner *before* any config provider loads, so they only work in `process.env` (or the shell) — putting them in `.env` is too late.

| Env var | Purpose |
|---|---|
| `JEX.CONFIG` / `JEX_CONFIG` / `JEX__CONFIG` | Picks the config plugin when both `@json-express/config-env` and `@json-express/config` are installed. Value is the package short-name (e.g. `config-env`). |
| `JEX.<CATEGORY>` (e.g. `JEX.ADAPTER`, `JEX.TRANSPORT`) | Same `jex.<category>=...` selection keys documented below — useful when you can't write a `.env` file (CI, containerized runs). |
| `NODE_ENV` | Decides which `.env.${env}` and `jex.config.${env}.{ext}` files load. Read by both providers and by every plugin that branches on environment. |

## Full key inventory

Every key is **optional** — plugins fall back to the listed default. Keys are grouped by the package that reads them; a plugin only consumes keys when it's installed.

### Core (`@json-express/core`)

These are read by the kernel itself, regardless of which plugins you install.

| Key | Type | Default | Effect |
|---|---|---|---|
| `port` | number | `3000` | Port the transport binds to. |
| `docs.path` | string | `/docs` | Mount path for the doc provider's UI. |
| `faker.collections` | object | `{}` | Forwarded to `seeder-faker` when seeding. |

**Plugin-selection overrides** — when more than one plugin in a category is installed, the CLI auto-selects with a prompt unless you pin one here:

| Key | Picks | Example value |
|---|---|---|
| `transport` | active transport plugin | `transport-fastify` |
| `adapter` | active database adapter | `adapter-json` |
| `api` | active API generator | `api-graphql` |
| `logger` | active logger | `logger-pino` |
| `docs` | active doc provider | `docs-swagger` |
| `id` | active id generator | `id-uuid` |
| `email` | active email transport | `email-console` |
| `kv` | active KV store | `kv-memory` |
| `queue` | active queue backend | `queue-memory` |

The matching short name (without the `@json-express/` prefix) is what you write — see the CLI's `resolvePlugin` for the full rules.

### `@json-express/api-rest`

| Key | Type | Default | Effect |
|---|---|---|---|
| `api.rest.prefix` | string | `''` | Prefix prepended to every collection route. Leading `/` optional. |

### `@json-express/api-graphql`

| Key | Type | Default | Effect |
|---|---|---|---|
| `api.graphql.endpoint` | string | `/graphql` | Mount path for the GraphQL endpoint. |
| `api.graphql.graphiql` | boolean | `true` | Whether the GraphiQL playground is exposed. |

### `@json-express/transport-express`

| Key | Type | Default | Effect |
|---|---|---|---|
| `express.ssl` | `{ key, cert }` | unset | Enables HTTPS. Usually set automatically by `plugin-devcert`. |

### `@json-express/transport-fastify`

| Key | Type | Default | Effect |
|---|---|---|---|
| `transport.fastify.logger` | boolean | `false` | Enables Fastify's built-in pino logger. |
| `transport.fastify.ssl.key` | string | unset | Path or PEM string for the TLS key. |
| `transport.fastify.ssl.cert` | string | unset | Path or PEM string for the TLS cert. |

### `@json-express/logger-pino`

| Key | Type | Default | Effect |
|---|---|---|---|
| `log.level` | string | `'info'` | Pino log level. |
| `log.path` | string | `'./logs'` | Directory for log files. |
| `log.pretty` | boolean | `NODE_ENV === 'development'` | Pretty-print logs to the console. |

### `@json-express/docs-light` / `@json-express/docs-swagger`

| Key | Type | Default | Effect |
|---|---|---|---|
| `docs.baseUrl` | string | unset | Hard override for the "Try it" base URL in the docs UI. Wins over everything below. |
| `api.rest.prefix` | string | `''` | Picked up automatically — docs and `api-rest` share this key, so example URLs match the actual mount paths. |
| `api.prefix` | string | `''` | Backward-compatible fallback when `api.rest.prefix` is unset. New code should prefer `api.rest.prefix`. |

### `@json-express/middleware-auth` & `@json-express/plugin-identity`

Both packages read the same `auth.*` block. `middleware-auth` only verifies tokens; `plugin-identity` adds the issuer side.

| Key | Type | Default | Read by |
|---|---|---|---|
| `auth.secret` | string | unset | both — HMAC secret for HS256 etc. |
| `auth.jwksUri` | string | unset | both — remote JWKS endpoint for RSA / asymmetric verification. |
| `auth.audience` | string \| string[] | unset | both — `aud` claim allow-list. |
| `auth.issuer` | string | unset | both — `iss` claim allow-list. |
| `auth.algorithms` | string[] | unset | both — accepted JWT algorithms. |
| `auth.exclude` | string \| string[] | `[]` | `middleware-auth` — paths to skip auth on. |
| `auth.tokenTtl` | string | `15m` | `plugin-identity` — access-token lifetime. |
| `auth.refreshTtl` | string | unset | `plugin-identity` — refresh-token lifetime. |
| `auth.verifyTtl` | string | unset | `plugin-identity` — email-verify token lifetime. |
| `auth.resetTtl` | string | unset | `plugin-identity` — password-reset token lifetime. |
| `auth.allowRegistration` | boolean | `true` | `plugin-identity` — public sign-up endpoint. |
| `auth.defaultRole` | string | `user` | `plugin-identity` — role assigned to new accounts. |
| `auth.requireVerifiedEmail` | boolean | `false` | `plugin-identity` — block sign-in until verified. |
| `auth.minPasswordLength` | number | `8` | `plugin-identity`. |
| `auth.email.appName` | string | `App` | `plugin-identity` — used in email templates. |
| `auth.email.verifyUrl` | string | provider default | `plugin-identity` — verify-email link template. |
| `auth.email.resetUrl` | string | provider default | `plugin-identity` — password-reset link template. |
| `auth.email.from` | string | unset | `plugin-identity` — `From:` header on outgoing mail. |

### `@json-express/middleware-validation`

| Key | Type | Default | Effect |
|---|---|---|---|
| `validation.rules` | array | `[]` | Validation rules applied per-route. Also read by `api-rest` and `api-graphql` to publish schema metadata. |

### `@json-express/plugin-devcert`

| Key | Type | Default | Effect |
|---|---|---|---|
| `https` | boolean | `false` | When `true`, generates a dev cert and writes it to `express.ssl`. |

### `@json-express/email-console`

| Key | Type | Default | Effect |
|---|---|---|---|
| `email.from` | string | `noreply@example.com` | Default `From:` for outgoing mail. |

### `@json-express/kv-memory`

| Key | Type | Default | Effect |
|---|---|---|---|
| `kv.purgeIntervalMs` | number | `60000` | TTL purge interval for expired keys. |

### `@json-express/seeder-faker`

| Key | Type | Default | Effect |
|---|---|---|---|
| `faker` | `FakerConfig` | `{}` | Per-collection generator config. See the [`seeder-faker` example](../seeder-faker/) for the shape. |

## Where defaults come from

Every default in the tables above lives in the **plugin's own constructor**, not in a central defaults file. That means:

- A key the framework "knows about" only matters if the corresponding plugin is installed. Setting `transport.fastify.logger=true` does nothing unless `@json-express/transport-fastify` is in your deps.
- Plugins that aren't installed contribute zero defaults — they don't shadow other plugins or pre-allocate keys.
- The CLI's category-selection overrides (`adapter`, `transport`, …) are read by `core/runner.ts` before any plugin runs, so they work even when the chosen plugin isn't yet loaded.

## Inter-package coordination via config

A few keys are written by one plugin and read by another. This is the [defensive-decoupling pattern](../../context/INTER_PACKAGE_ARCHITECTURE.md): the producer mutates a known key during `onRegister`, and the consumer reads it at boot. Examples:

- `plugin-devcert` writes `express.ssl`; `transport-express` reads it.
- `middleware-validation` writes `validation.rules`; `api-rest` and `api-graphql` read it.
- `api-rest` reads `api.rest.prefix`; `docs-light` and `docs-swagger` read the same key so example URLs match the actual mount paths.

Neither side hard-imports the other — config is the contract.

## What's in this folder

- `.env` — the single override that drives this example
- `package.json` — explicitly installs `@json-express/config-env` alongside the default stack (no provider is bundled — exactly one config plugin must be in deps)
- `data/items.json` — the collection served by the default REST routes
- `tests/config.spec.ts` — Playwright specs verifying the prefix override

## See also

- [`@json-express/config-env`](../../packages/config-env/README.md) — the default env provider
- [`@json-express/config`](../../packages/config/README.md) — the advanced JSON / YAML / TS provider
- [`json-config` example](../json-config/) — same idea with a `jex.config.json`
- [`base-url` example](../base-url/) — the same prefix override, framed as a recipe instead of a reference
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
