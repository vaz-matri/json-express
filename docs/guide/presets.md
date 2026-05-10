---
title: "Presets"
description: "How to bundle a JSONExpress stack as a single npm package — dependency presets and template presets."
---

# Presets

A **preset** is an ordinary npm package whose only job is to bundle other JSONExpress packages — and optionally a `templates/` directory with starter `models/` and `data/`. Presets exist so that a beginner does not need to learn the package taxonomy before booting a working server.

There are two flavours:

| Flavour | Contains | Activated by |
|---|---|---|
| **Dependency preset** | Only `dependencies` in `package.json` | `npm install` then `npx json-express` |
| **Template preset** | `dependencies` **and** a `templates/` directory | `npx json-express --preset-init` |

Both flavours work because the `json-express` binary (shipped by `@json-express/core`) recursively walks every `@json-express/*` dependency in `package.json` and auto-discovers what's installed.

## Officially shipped presets

| Preset | Flavour | What it gives you |
|---|---|---|
| [`@json-express/boot`](/boot) | Dependency | The recommended default stack: memory adapter, Express transport, REST, console logger, light docs |
| `@json-express/preset-identity` | Dependency | `plugin-identity` + `middleware-auth` + `email-console` + `kv-memory` + `queue-memory` |
| `@json-express/preset-ecommerce` | Template | Boot stack + sample `models/` and `data/` for a small e-commerce schema |

## Dependency presets

Install and run. Nothing is copied into your project — every package lives under `node_modules`, and the runtime auto-discovers it.

```bash
npm install @json-express/boot
npx json-express
```

Stack additively by installing more presets:

```bash
npm install @json-express/boot @json-express/preset-identity
# .env
jex.auth.secret=a-strong-32-byte-secret
jex.auth.exclude=/auth
```

```bash
npx json-express
# /auth/register, /auth/login, /auth/refresh, /auth/logout etc. are now mounted
```

## Template presets

Template presets ship a `templates/` directory next to their `package.json`. The flag `--preset-init` copies that directory into your current working directory.

```bash
npm install @json-express/preset-ecommerce
npx json-express --preset-init
```

If only one preset with templates is installed, the bare `--preset-init` works. If you have multiple, name the one you want:

```bash
npx json-express --preset-init=@json-express/preset-ecommerce
```

The contents of `templates/` are copied with `errorOnExist: false`, so existing files in your working directory are preserved. After extraction, run `npx json-express` to start the server against the freshly written files.

## Authoring a preset

A preset is the smallest possible npm package. There is no SDK, no API, no special export.

### Dependency-only preset

```json
// package.json
{
  "name": "@your-scope/preset-saas",
  "version": "0.1.0",
  "main": "README.md",
  "dependencies": {
    "@json-express/boot": "^2.0.0",
    "@json-express/plugin-identity": "^2.0.0",
    "@json-express/middleware-auth": "^2.0.0"
  },
  "files": ["README.md"]
}
```

That is the entire package. Publish it. Users `npm install @your-scope/preset-saas` and the listed packages install transitively.

### Template preset

Add a `templates/` directory and include it in `files`. Anything under `templates/` is copied verbatim into the user's project.

```
@your-scope/preset-blog/
  package.json
  README.md
  templates/
    models/
      posts.ts
      authors.ts
    data/
      categories.json
```

```json
// package.json
{
  "name": "@your-scope/preset-blog",
  "version": "0.1.0",
  "main": "package.json",
  "dependencies": {
    "@json-express/boot": "^2.0.0"
  },
  "files": ["templates"]
}
```

Users run:

```bash
npm install @your-scope/preset-blog
npx json-express --preset-init=@your-scope/preset-blog
npx json-express
```

The runtime detects packages by the `@json-express/` namespace **or** any name containing `json-express-`, so a third-party preset can also be named `your-scope-json-express-blog` if you prefer to publish without a scope.

## Related

- [@json-express/boot](/boot) — the default stack preset
- [Getting Started](/getting-started) — quickstart that uses `@json-express/boot`
- [@json-express/core](/core) — the runtime that discovers and boots everything
