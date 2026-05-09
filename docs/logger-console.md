---
title: "@json-express/logger-console"
description: "Zero-dependency default logger for JSONExpress — auto-discovered, native console methods, with trace-id correlation and context-loss diagnostics."
---

# @json-express/logger-console

> The default `ILogger` shipped with `@json-express/boot`.

`@json-express/logger-console` implements `ILogger` using native `console.log`, `console.warn`, and `console.error`. It is auto-discovered by the `json-express` runtime and registered first, before any other plugin — every other plugin's constructor receives this logger via its option bag.

If you want structured JSON output for production, swap to [`@json-express/logger-pino`](/logger-pino).

## Installation

Most users get this through `@json-express/boot`. Install directly only when picking the runtime piece-by-piece:

```bash
npm install @json-express/logger-console
```

## How the runtime uses it

The runtime instantiates the logger with the config provider and then hands the instance to every other plugin:

```typescript
// internal — for reference only
const logger = new ConsoleLogger({ configProvider });
kernel.registerLogger(logger);

// every subsequent plugin receives it
new SomePlugin({ configProvider, logger });
```

Because the logger is registered before any other plugin, **every plugin constructor in the JSONExpress ecosystem requires a `logger` parameter** (since commit `8aad8ce`, `@json-express/core` no longer ships a built-in fallback). When authoring a custom plugin, expect the runtime to pass:

```typescript
constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
    this.logger = logger.child({ component: 'MyPlugin' });
}
```

You generally do not instantiate `ConsoleLogger` yourself.

## Output format

```
[INFO] GET /albums 200 (12ms) {"traceId":"a1b2-c3d4","component":"Express"}
```

- Level prefix (`[INFO]`, `[WARN]`, `[ERROR]`)
- Message
- JSON-serialised context, including any auto-injected `traceId` from `RequestContext`

## Core features

### 1. Automatic trace correlation

Every log line reads the current `traceId` from `RequestContext` (an `AsyncLocalStorage` wrapper in core) and merges it into the structured context. A single request's logs share the same `traceId` across plugin boundaries — even when the work hops through queues, hooks, or nested adapters.

### 2. Child loggers

`logger.child(extraContext)` returns a new logger that inherits the parent's context and adds its own. This is how plugins tag their lines without coordinating on a global format:

```typescript
const dbLogger = logger.child({ component: 'Adapter-Memory' });
dbLogger.info('Data loaded');
// [INFO] Data loaded {"component":"Adapter-Memory"}
```

### 3. Context-loss diagnostics

In complex async code it's easy to accidentally drop the `AsyncLocalStorage` context (for example by wrapping a callback in an untracked `Promise`). Set `JEX_DEBUG_CONTEXT=true` and the logger flags any log line that originates inside a known component but without a `traceId`:

```bash
JEX_DEBUG_CONTEXT=true npx json-express
# [⚠️ CONTEXT LOST] [INFO] some message {"component":"Adapter-Memory"}
```

This makes context leaks trivial to spot during development. Leave the flag off in production.

### 4. Silent `debug` level

The `debug()` method is a deliberate no-op so verbose plugin internals do not clutter terminal output. If you need debug-level logs, install `@json-express/logger-pino` instead — it honours the `jex.log.level` config.

## Related

- [@json-express/logger-pino](/logger-pino) — structured JSON logs with full level support
- [@json-express/core](/core) — exposes `RequestContext` and the `ILogger` contract
- [@json-express/boot](/boot) — bundles this logger in the default stack
