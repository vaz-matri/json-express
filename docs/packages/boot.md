---
title: "@json-express/boot"
description: "Batteries-included preset that bundles the recommended JSONExpress stack so you can start a working server with a single install."
---

# @json-express/boot

> The fastest way to start a JSONExpress server.

`@json-express/boot` is a **dependency-only preset** — it ships zero application code. Installing it pulls in the recommended default stack as transitive dependencies, and the `json-express` binary (shipped by `@json-express/core`) auto-discovers them all.

If you have never used JSONExpress before, install this. You can swap any layer later by adding a different `@json-express/*` package to your `package.json`.

## Installation

```bash
npm init -y
npm install @json-express/boot
```

## Run

Drop a JSON file into `./data/` (or define a TypeScript model in `./models/`):

```bash
mkdir -p data
echo '[{"id":1,"title":"Hello"}]' > data/posts.json
npx json-express
```

You now have a fully working server at `http://localhost:3000` with `GET/POST/PATCH/DELETE /posts`, plus `/docs`.

## What's in the box

`@json-express/boot` declares these packages as `dependencies`:

| Package | Role |
|---|---|
| [`@json-express/core`](/core) | Microkernel + IoC container, ships the `json-express` binary |
| [`@json-express/config-env`](/config-env) | `.env`-based configuration provider |
| [`@json-express/transport-express`](/transport-express) | Express-based HTTP transport |
| [`@json-express/adapter-memory`](/adapter-memory) | In-memory database adapter |
| [`@json-express/api-rest`](/api-rest) | REST API generator |
| [`@json-express/logger-console`](/logger-console) | Console logger |
| [`@json-express/docs-light`](/docs-light) | Lightweight `/docs` provider |

That's it — no `boot.js`, no `bootstrap()` call, no plugin wiring. The `json-express` binary discovers each package from your `package.json` and assembles the stack at boot.

## Swapping a layer

Each layer is an independent npm package. To replace one, install the new package and remove the old one. There is **no code change** — the runtime auto-discovers whichever package is installed.

```bash
# Switch from Express to Fastify
npm uninstall @json-express/transport-express
npm install @json-express/transport-fastify

# Switch from in-memory to file-based persistence
npm uninstall @json-express/adapter-memory
npm install @json-express/adapter-json
```

If two packages of the same category are installed (e.g. both `transport-express` and `transport-fastify`), the runtime aborts with an error. Pick one in `.env`:

```bash
jex.transport=@json-express/transport-fastify
```

## When to skip @json-express/boot

Install `@json-express/core` directly and pick only the packages you want. The boot preset is a convenience; the runtime works the same way without it.

```bash
npm install @json-express/core @json-express/config-env @json-express/adapter-json @json-express/transport-fastify @json-express/api-rest @json-express/logger-pino
npx json-express
```

## Related

- [Getting Started](/getting-started) — the full quickstart that uses this preset
- [Presets](/presets) — what presets are and how to author one
- [@json-express/core](/core) — the microkernel and `json-express` binary
