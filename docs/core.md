---
title: "@json-express/core"
description: "The foundational kernel, type system, schema engine, and interface contracts that power every JSONExpress package."
---

# @json-express/core

> The foundational kernel of the entire JSONExpress ecosystem.

The `@json-express/core` package is the beating heart of the framework. It does not contain any database drivers, HTTP servers, or third-party integrations. Instead, it defines the **strict TypeScript interfaces** that every other package must implement, and provides the **Kernel** that orchestrates the 5-stage boot pipeline.

If you are building a custom adapter, transport, or plugin for JSONExpress, this is the only dependency you need.

## Installation

```bash
npm install @json-express/core
```

## What It Exports

The core package exports the following critical subsystems:

### 1. The Interface Contracts
These are the TypeScript interfaces that define the rules of the ecosystem:
*   `IDatabaseAdapter` — Every database (Memory, JSON, Postgres) must implement this.
*   `IApiGenerator` — Every API layer (REST, GraphQL) must implement this.
*   `ITransport` — Every HTTP server (Express, Fastify) must implement this.
*   `IMiddleware` — Every middleware (Auth, Validation) must implement this.
*   `IKvStore` — Every key-value store (Memory, Redis) must implement this.
*   `IQueueAdapter` — Every task queue (Memory, BullMQ) must implement this.
*   `IEmailProvider` — Every email provider (Console, SMTP) must implement this.
*   `ILogger` — Every logger (Console, Pino) must implement this.
*   `IConfigProvider` — Every configuration engine (Env, File) must implement this.

### 2. The Schema Engine (`defineModel` & `types`)
The declarative API for defining your data models:

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'products',
    fields: {
        id: types.id(),
        title: types.string({ unique: true }),
        price: types.number(),
        inStock: types.boolean({ default: true })
    }
});
```

### 3. The Access Control Engine
A complete set of utilities for evaluating security rules at runtime:
*   `evaluateAccess(rule, userPayload)` — Determines if a request is allowed, denied, or requires an ownership check.
*   `needsOwnerCheck(rule)` — Returns `true` if the access rule is `'owner'`.
*   `ownsRecord(record, ownerField, user)` — Compares the record's owner field against the JWT payload.
*   `stripDeniedReadFields()` / `stripDeniedWriteFields()` — Aggressively removes forbidden fields from API payloads.

### 4. The Adapter Compliance Suite
A testing utility that lets custom adapter authors verify their implementation:

```typescript
import { runAdapterComplianceTests } from '@json-express/core';

await runAdapterComplianceTests(
    async () => new MyCustomAdapter(),
    async (db) => await db.disconnect()
);
```

### 5. The Request Context (`AsyncLocalStorage`)
A Node.js `AsyncLocalStorage` wrapper that provides per-request tracing:

```typescript
import { RequestContext } from '@json-express/core';

// Inside any function called during request handling:
const traceId = RequestContext.getTraceId(); // Auto-injected UUID
```

## Related Ecosystem Packages
*   **[@json-express/cli](/packages/cli):** The CLI that automatically boots the Kernel and orchestrates the entire plugin discovery pipeline.
*   **[@json-express/config](/packages/config):** The advanced file-based configuration provider that feeds settings into the Kernel.
