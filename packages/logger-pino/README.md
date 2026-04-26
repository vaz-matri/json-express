# @json-express/logger-pino

High-performance, industry-standard structured logging for JSON Express.

## 📦 Overview

`@json-express/logger-pino` is the recommended logger for production environments. It provides high-speed, asynchronous, and JSON-structured log output, making it compatible with modern observability stacks like the ELK stack, Splunk, Datadog, and CloudWatch.

It leverages [Pino](https://github.com/pinojs/pino) under the hood and implements the JSON Express `ILogger` interface.

## 🚀 Key Features

*   **12-Factor Ready**: Streams to Stdout/Stderr by default.
*   **Pretty Printing**: Uses `pino-pretty` in development for a premium developer experience.
*   **Enterprise Mode**: Supports direct-to-file logging with automatic path resolution.
*   **High Performance**: Asynchronous logging to minimize overhead on the framework.
*   **Request Correlation**: Automatically picks up the framework-wide `traceId` from `RequestContext` and injects it into every log line without manual propagation.

## 🛠️ Configuration

You can control the logger via standard JSON Express environment variables (`JEX.*`):

| Key | Default | Description |
| :--- | :--- | :--- |
| `JEX.LOG.LEVEL` | `info` | Logging severity (`info`, `debug`, `warn`, `error`). |
| `JEX.LOG.PRETTY` | `auto` | Set to `true` for pretty terminal output, `false` for raw JSON. |
| `JEX.LOG.PATH` | `./logs` | Destination for logs. Set to `stdout` or `stderr` for terminal output. |

### 🔄 Logging Modes

1.  **File Mode (Default)**: Logs are written to `./logs/app.log` by default. You can override this with a custom path (e.g., `JEX.LOG.PATH=/var/log/my-app`).
2.  **Stream Mode**: Set `JEX.LOG.PATH=stdout` or `stderr` to pipe logs directly to the terminal. Combined with `JEX.LOG.PRETTY=true`, this provides the best developer experience.

## 💻 Manual Usage

If you are building a custom instance of JSON Express without the CLI:

```typescript
import { JsonExpressKernel } from '@json-express/core';
import { EnvConfigProvider } from '@json-express/config-env';
import { PinoLogger } from '@json-express/logger-pino';

const config = new EnvConfigProvider();
const logger = new PinoLogger({ configProvider: config });

const kernel = new JsonExpressKernel();
kernel.registerLogger(logger);
```
