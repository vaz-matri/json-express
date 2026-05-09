<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# @json-express/logger-pino

High-performance, industry-standard structured logging for JSONExpress.

## 📦 Overview

`@json-express/logger-pino` is the recommended logger for production. It produces high-speed, asynchronous, JSON-structured log output that drops straight into modern observability stacks — ELK, Splunk, Datadog, CloudWatch, Loki, and friends.

It wraps [Pino](https://github.com/pinojs/pino) and implements the JSONExpress `ILogger` interface.

## 🚀 Key Features

- **Structured by Default**: One JSON object per line with `level`, `time`, `pid`, `hostname`, `component`, and `msg` — ready to ship to any log aggregator.
- **Request Correlation**: Reads the framework-wide `traceId` from `RequestContext` and stamps it onto every log line — no manual propagation needed.
- **High Performance**: Asynchronous file/stream transports keep logging off the request path.
- **Two Output Modes**: enterprise file mode (default — writes to `./logs/app.log`) or 12-factor stream mode (`stdout`/`stderr`), with optional `pino-pretty` formatting in development.

## 🛠️ Configuration

All settings are JSONExpress environment variables. `.` and `__` are interchangeable nesting separators; case is insensitive.

| Key | Default | Description |
| :--- | :--- | :--- |
| `jex.logger` | _(unset — falls back to console)_ | Set to `@json-express/logger-pino` to activate. |
| `jex.log.level` | `info` | Logging severity (`info`, `debug`, `warn`, `error`). |
| `jex.log.path` | `./logs` | Destination directory or file path. Set to `stdout` or `stderr` for terminal output. |
| `jex.log.pretty` | `true` in `development`, otherwise `false` | Pretty terminal output via `pino-pretty`. Only applies to stream mode (`stdout`/`stderr`). |

### 🔄 Logging Modes

1. **File Mode (default)** — logs land in `./logs/app.log` as raw JSON. Override the directory with `jex.log.path=./var/server` (becomes `./var/server/app.log`) or pass a full file path with `jex.log.path=/var/log/my-app.log`. Missing directories are created on demand.
2. **Stream Mode** — set `jex.log.path=stdout` (or `stderr`) to pipe directly to the terminal. Combine with `jex.log.pretty=true` for a colorized, dev-friendly stream.

## 💻 Manual Usage

If you are wiring up a JSONExpress kernel without the CLI:

```typescript
import { JsonExpressKernel } from '@json-express/core';
import { EnvConfigProvider } from '@json-express/config-env';
import { PinoLogger } from '@json-express/logger-pino';

const config = new EnvConfigProvider();
const logger = new PinoLogger({ configProvider: config });

const kernel = new JsonExpressKernel();
kernel.registerLogger(logger);
```

## 📜 Standardized Interface

```typescript
export interface ILogger {
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    error(message: string, context?: any): void;
    debug(message: string, context?: any): void;
    child(context: any): ILogger;
}
```

## See also

- [`example/logger-pino`](../../example/logger-pino/README.md) — runnable example showing structured output and `traceId` correlation
- [`@json-express/logger-console`](../logger-console/README.md) — the zero-dependency default logger
