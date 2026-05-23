<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# Default stack example

The fastest way to spin up a working API. Install one package, drop JSON files in `data/`, run the server. You're done.

## Setup

```bash
npm install @json-express/boot
```

That's the only dependency you need. [`@json-express/boot`](../../presets/boot/README.md) is the batteries-included preset and bundles everything required to run a server:

| Plugin | What it does |
| --- | --- |
| [`@json-express/core`](../../packages/core/README.md) | The microkernel and IoC container that wires everything together |
| [`@json-express/config-env`](../../packages/config-env/README.md) | Reads `.env` files (lowercase `jex.*` keys) so you can configure the server without touching code |
| [`@json-express/adapter-memory`](../../packages/adapter-memory/README.md) | In-memory storage. Fast, perfect for prototyping. Data resets when you restart |
| [`@json-express/api-rest`](../../packages/api-rest/README.md) | Generates REST endpoints (`GET` / `POST` / `PATCH` / `DELETE`) from your data |
| [`@json-express/transport-express`](../../packages/transport-express/README.md) | Express-based HTTP server |
| [`@json-express/logger-console`](../../packages/logger-console/README.md) | Pretty boot logs and request logs in your terminal |
| [`@json-express/docs-light`](../../packages/docs-light/README.md) | Built-in API documentation page at `/docs` |

Drop your data into `data/`:

```
data/
└── albums.json     # [{ "name": "Encore", "releaseDate": "12-11-2004" }]
```

The filename becomes the collection name. The schema is inferred from the first record.

## Run it

```bash
npm run serve
```

You now have a REST API on `http://localhost:3000`:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/albums` | List all albums |
| `GET` | `/albums/:id` | Get one album |
| `POST` | `/albums` | Create an album |
| `PATCH` | `/albums/:id` | Update fields on an album |
| `DELETE` | `/albums/:id` | Remove an album |

Visit `http://localhost:3000/docs` for the auto-generated documentation page, or `http://localhost:3000/docs/json` for the raw manifest.

Try it:

```bash
curl http://localhost:3000/albums
curl -X POST http://localhost:3000/albums \
  -H 'content-type: application/json' \
  -d '{"name":"The Marshall Mathers LP","releaseDate":"23-05-2000"}'
```

## Adding more collections

Drop another file into `data/`:

```
data/
├── albums.json
└── artists.json
```

You'll get `/artists` routes automatically on the next start.

## Want something different?

Every plugin in the default stack is swappable. Install the one you want — the framework picks it up automatically. If two plugins of the same kind end up installed (e.g. both `adapter-memory` and `adapter-json`), set `jex.<category>=...` in `.env` to choose one.

### Storage

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/adapter-memory`](../../packages/adapter-memory/README.md) | In-memory storage. Fast, perfect for prototyping. Data resets on restart | *default* |
| [`@json-express/adapter-json`](../../packages/adapter-json/README.md) | Persist collections to `.json` files on disk | [example](../adapter-json/README.md) |

### API paradigm

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/api-rest`](../../packages/api-rest/README.md) | Generates REST endpoints (`GET` / `POST` / `PATCH` / `DELETE`) from your data | *default* |
| [`@json-express/api-graphql`](../../packages/api-graphql/README.md) | Auto-generated GraphQL schema and resolvers | [example](../graphql/) |

### HTTP transport

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/transport-express`](../../packages/transport-express/README.md) | Express-based HTTP server | *default* |
| [`@json-express/transport-fastify`](../../packages/transport-fastify/README.md) | Swap Express for Fastify | [example](../transport-fastify/) |

### Documentation

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/docs-light`](../../packages/docs-light/README.md) | Built-in API documentation page at `/docs` | *default* |
| [`@json-express/docs-swagger`](../../packages/docs-swagger/README.md) | OpenAPI 3.0 spec + Swagger UI at `/docs` | [example](../docs-swagger/) |

### Logging

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/logger-console`](../../packages/logger-console/README.md) | Pretty boot logs and request logs in your terminal | *default* |
| [`@json-express/logger-pino`](../../packages/logger-pino/README.md) | Structured JSON logs via Pino (production-ready) | [example](../logger-pino/) |

### Middleware (per-request)

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/middleware-auth`](../../packages/middleware-auth/README.md) | JWT authentication and route protection | [example](../middleware-auth/) |
| [`@json-express/middleware-validation`](../../packages/middleware-validation/README.md) | Request body / query validation | [example](../middleware-validation/) |

### Plugins (boot-time)

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/plugin-health`](../../packages/plugin-health/README.md) | Adds `/health` and `/info` endpoints for liveness/readiness probes | [example](../plugin-health/) |
| [`@json-express/plugin-identity`](../../packages/plugin-identity/README.md) | Drop-in identity provider (signup, login, JWT issuance) | [example](../plugin-identity/) |
| `@json-express/plugin-devcert` | Self-signed HTTPS certificates for local development | [example](../plugin-devcert/) |

### Seeders

| Package | Description | Try it |
| --- | --- | --- |
| [`@json-express/seeder-faker`](../../packages/seeder-faker/README.md) | Generate fake data on boot using `@faker-js/faker` | [example](../seeder-faker/) |

### Tooling

| Package | Description |
| --- | --- |
| [`@json-express/cli`](../../packages/cli/README.md) | Developer CLI: `jex init`, `jex configure`, `jex export` |
| [`@json-express/config`](../../packages/config/README.md) | Advanced config provider (TS / JSON config files, deep merging) |

## What's in this folder

- `package.json` — declares the single `@json-express/boot` dependency and the `serve` script
- `data/` — your JSON collections
