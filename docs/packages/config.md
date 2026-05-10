---
title: "@json-express/config"
description: "Advanced multi-format configuration provider for JSONExpress. Supports JSON, YAML, TypeScript, and environment-specific overrides."
---

# @json-express/config

> Advanced file-based configuration provider for JSONExpress.

The `@json-express/config` package implements `IConfigProvider` and provides a powerful, multi-format configuration engine. It supports JSON, YAML, JavaScript, and TypeScript configuration files with environment-specific overrides.

If you need more flexibility than simple `.env` variables, this is the configuration engine you want.

## Installation

```bash
npm install @json-express/config
```

## Configuration File Discovery

The provider searches your project root for configuration files in the following formats (in order of priority):

```
jex.config.json
jex.config.yml / jex.config.yaml
jex.config.js / jex.config.cjs / jex.config.mjs
jex.config.ts
```

### Environment-Specific Overrides
You can create environment-specific configuration files that are deeply merged on top of your base configuration:

```
jex.config.ts          ← Base (always loaded)
jex.config.production.ts  ← Merged on top when NODE_ENV=production
jex.config.staging.ts     ← Merged on top when NODE_ENV=staging
```

This follows the exact same cascading pattern used by frameworks like Vite and Next.js.

## Usage

### TypeScript Configuration (Recommended)

```typescript
// jex.config.ts
export default ({ env }: { env: string }) => ({
    port: env === 'production' ? 8080 : 3000,
    auth: {
        secret: process.env.JWT_SECRET,
        exclude: ['/auth/login', '/health']
    },
    swagger: {
        title: 'My Enterprise API',
        version: '2.0.0'
    }
});
```

### YAML Configuration

```yaml
# jex.config.yml
port: 3000
auth:
  secret: ${JWT_SECRET}
  exclude:
    - /auth/login
    - /health
```

## Core Features

### 1. Deep Merge Strategy
If you have a base `jex.config.ts` and a `jex.config.production.ts`, the provider performs a recursive deep merge. Nested objects are merged key-by-key, and arrays are replaced (not concatenated). This ensures production overrides are precise and predictable.

### 2. Runtime TypeScript Transpilation
The provider uses **Jiti** to natively import `.ts` configuration files at runtime without requiring a separate build step. This means you get full TypeScript autocompletion and type safety in your configuration files.

### 3. Async Factory Pattern
Because loading configuration files may involve asynchronous operations, the provider uses a static `init()` factory method instead of a constructor:

```typescript
const config = await AdvancedConfigProvider.init(process.cwd(), 'production');
const port = config.get<number>('port', 3000);
```

## Related Ecosystem Packages
*   **[@json-express/config-env](/packages/config-env):** The simpler, `.env`-only alternative. Use this if you don't need file-based configuration.
*   **[@json-express/core](/packages/core):** The runtime that resolves the active config provider and hands it to every plugin during boot.
