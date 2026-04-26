# @json-express/logger-console

The default, zero-dependency console logger for the JSON Express meta-framework.

## 📦 Overview

`@json-express/logger-console` provides the "Batteries Included" logging experience for JSON Express. It is designed to be lightweight, fast, and completely free of external dependencies.

It implements the `ILogger` interface using standard `console.log`, `console.warn`, and `console.error` methods, making it perfect for development, local testing, and simple deployments.

## 🚀 Key Features

- **Zero Dependencies**: Keeps your node_modules lean.
- **Contract Compliant**: Implements the standardized JSON Express `ILogger` interface.
- **Child Logger Support**: Allows components to create scoped loggers with context.
- **Framework Fallback**: Automatically used by the CLI if no other logger is installed.

## 🛠️ Configuration

While this logger is basic, it respects the following framework-level configurations:

- `NODE_ENV`: In `production`, debug logs are suppressed.

## 💻 Manual Usage

If you are building a custom instance of JSON Express without the CLI:

```typescript
import { JsonExpressKernel } from '@json-express/core';
import { ConsoleLogger } from '@json-express/logger-console';

const kernel = new JsonExpressKernel();
const logger = new ConsoleLogger();

kernel.registerLogger(logger);
logger.info('Logger initialized manually');
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
