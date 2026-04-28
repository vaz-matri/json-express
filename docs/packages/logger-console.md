---
title: "@json-express/logger-console"
description: "A zero-dependency default logger for JSONExpress using native console methods with optional context diagnostics."
---

# @json-express/logger-console

> The default zero-dependency logger for JSONExpress.

The `@json-express/logger-console` package implements `ILogger` using native `console.log`, `console.warn`, and `console.error` methods. It is the **framework default** — if you don't install `@json-express/logger-pino`, this logger is used automatically.

## Installation

```bash
npm install @json-express/logger-console
```

## Configuration

No configuration is required. The logger works out of the box.

```typescript
import { ConsoleLogger } from '@json-express/logger-console';

const logger = new ConsoleLogger();
logger.info('Server started');
// Output: [INFO] Server started
```

## Core Features

### 1. Automatic Trace Correlation
Just like the Pino logger, the Console logger reads the `traceId` from `RequestContext.getTraceId()` and injects it into every log entry. This ensures that even with the simplest logger, you can trace a single request across multiple plugin boundaries.

```
[INFO] GET /albums 200 (12ms) {"traceId":"a1b2-c3d4","component":"Express"}
```

### 2. Child Logger Support
The `.child()` method creates scoped instances that inherit all parent context:

```typescript
const dbLogger = logger.child({ component: 'Adapter-Memory' });
dbLogger.info('Data loaded');
// Output: [INFO] Data loaded {"component":"Adapter-Memory"}
```

### 3. Context Loss Diagnostics
In complex async architectures, it's possible to accidentally lose the `AsyncLocalStorage` context (e.g., by wrapping code in an untracked `Promise`). 

The Console logger includes a unique diagnostic mode. If you set `JEX_DEBUG_CONTEXT=true`, the logger will emit a `[⚠️ CONTEXT LOST]` warning whenever a log is written inside a known component but without a valid `traceId`. This makes it trivially easy to find and fix context leaks during development.

### 4. Silent Debug Level
The `debug()` method is intentionally a no-op in the Console logger. This prevents verbose debug output from cluttering your terminal. If you need `debug`-level logs, upgrade to `@json-express/logger-pino`.

## Related Ecosystem Packages
*   **[@json-express/logger-pino](/packages/logger-pino):** The structured JSON alternative for production deployments.
*   **[@json-express/cli](/packages/cli):** The CLI defaults to this logger when no other logger is installed.
