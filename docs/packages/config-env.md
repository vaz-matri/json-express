---
title: "@json-express/config-env"
description: "Twelve-Factor compliant environment variable configuration provider for JSONExpress."
---

# @json-express/config-env

> The default environment variable configuration provider for JSONExpress.

The `@json-express/config-env` package implements `IConfigProvider` using the **Twelve-Factor App** methodology. It reads configuration exclusively from `.env` files and system environment variables, making it the simplest and most Docker/Kubernetes-friendly configuration strategy.

This is the default configuration provider used by the `@json-express/cli`.

## Installation

```bash
npm install @json-express/config-env
```

## Configuration

All JSONExpress environment variables use the `JEX.` prefix (or `JEX__` for nested keys). The provider automatically strips this prefix and builds a nested configuration object.

### Example `.env` File

```bash
# Server
JEX.PORT=3000

# Authentication
JEX.AUTH.SECRET=my-super-secret-key
JEX.AUTH.EXCLUDE=/auth/login,/health

# Logging
JEX.LOG.LEVEL=debug
JEX.LOG.PRETTY=true

# Plugin Overrides (set by --configure wizard)
JEX.TRANSPORT=@json-express/transport-fastify
JEX.ADAPTER=@json-express/adapter-json
```

### Cascading Precedence (Lowest → Highest)
The provider loads `.env` files in a strict order. Later files overwrite earlier ones:

1. `.env` — Base defaults
2. `.env.development` — Environment-specific
3. `.env.local` — Machine-specific (gitignored)
4. `.env.development.local` — Machine + Environment specific
5. **System environment variables** — Highest priority (Docker, Kubernetes)

This cascading order means you can safely commit `.env` to your repository with sane defaults, and override them per-machine using `.env.local` (which should be in `.gitignore`).

## Core Features

### 1. Automatic Nested Object Construction
The provider uses `buildNestedConfigFromEnv()` from `@json-express/core` to automatically convert flat environment variables into deeply nested configuration objects:

```bash
JEX.AUTH.SECRET=abc123
```
Becomes:
```typescript
config.get('auth.secret') // → 'abc123'
```

### 2. Zero External Dependencies
Unlike the advanced `@json-express/config` package (which requires `js-yaml` and `jiti`), this provider depends only on `dotenv`. It is extremely lightweight and boots in less than 1 millisecond.

## Related Ecosystem Packages
*   **[@json-express/config](/packages/config):** The advanced alternative that supports YAML, TypeScript, and environment-specific file overrides.
*   **[@json-express/cli](/packages/cli):** The CLI's `--configure` wizard writes its selections directly into `.env` using the `JEX.*` namespace.
