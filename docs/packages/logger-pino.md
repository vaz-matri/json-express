---
title: "@json-express/logger-pino"
description: "Enterprise-grade structured JSON logging for JSONExpress using Pino, with file rotation and request tracing."
---

# @json-express/logger-pino

> Enterprise-grade structured logger for JSONExpress using Pino.

The `@json-express/logger-pino` package implements `ILogger` using **Pino**, the fastest Node.js JSON logger. It supports both **Twelve-Factor** stdout streaming (for Docker/Kubernetes) and **Spring Boot-style** file-based logging (for traditional VM deployments).

## Installation

```bash
npm install @json-express/logger-pino pino-pretty
```
*(Note: `pino-pretty` is optional but recommended for local development).*

## Configuration

```bash
# .env

# Log level: trace | debug | info | warn | error | fatal
JEX.LOG.LEVEL=info

# Output destination: "stdout", "stderr", or a file path
JEX.LOG.PATH=stdout

# Human-readable formatting (auto-enabled in development)
JEX.LOG.PRETTY=true
```

### Logging Modes

**1. Twelve-Factor Mode (Stdout)**
When `JEX.LOG.PATH=stdout`, all logs are streamed to standard output as raw JSON. This is the recommended mode for Docker containers and Kubernetes Pods, where a centralized log aggregator (like Datadog, Fluentd, or CloudWatch) scrapes stdout.

```json
{"level":30,"time":1714300800000,"traceId":"a1b2-c3d4","component":"API-REST","msg":"GET /albums 200 (12ms)"}
```

**2. Enterprise File Mode**
When `JEX.LOG.PATH=./logs`, Pino writes structured JSON logs to `./logs/app.log`. The directory is automatically created if it doesn't exist (`mkdir: true`).

**3. Pretty Mode (Development)**
When `JEX.LOG.PRETTY=true`, the logger uses `pino-pretty` to render colorized, human-readable output with timestamps stripped of noise.

## Core Features

### 1. Automatic Request Tracing
Every log entry automatically includes the `traceId` from `RequestContext.getTraceId()`. This means you can search your log aggregator for a single UUID and instantly see every database query, middleware decision, and hook execution that occurred during that specific HTTP request.

### 2. Child Loggers
The `.child()` method creates scoped logger instances. Every JSONExpress plugin receives a child logger with the component name pre-injected:

```typescript
const dbLogger = logger.child({ component: 'Adapter-Postgres' });
dbLogger.info('Connected to database'); 
// → { component: "Adapter-Postgres", traceId: "...", msg: "Connected to database" }
```

### 3. Zero-Overhead in Production
Pino is designed to add virtually zero overhead to your application. Unlike Winston or Bunyan, Pino uses worker threads for serialization and avoids synchronous I/O entirely.

## Related Ecosystem Packages
*   **[@json-express/logger-console](/packages/logger-console):** The zero-dependency fallback logger for when you don't need structured JSON output.
*   **[@json-express/core](/packages/core):** Provides the `RequestContext` that automatically stamps `traceId` on every log entry.
