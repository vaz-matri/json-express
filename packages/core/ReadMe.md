# @json-express/core

The headless Microkernel and Inversion of Control (IoC) container for [JSON Express](https://github.com/vaz-matri/json-express).

This is the beating heart of the Meta-Framework. It contains **zero** HTTP logic, **zero** database logic, and **zero** CLI prompts. Its sole purpose is to orchestrate the lifecycle of the framework, manage dependency injection, and enforce strict TypeScript contracts between plugins.

## 📦 Installation

This package is the core dependency of the entire ecosystem. It is usually installed automatically by the CLI, but can be installed manually for programmatic setups:

```bash
npm install @json-express/core
```

## 🧠 Core Architecture

JSON Express uses **Awilix** as its IoC container. Plugins do not import each other directly; instead, they register themselves into the Kernel, and request their dependencies from the Kernel.

### The Standardized Contracts
Any official or community plugin must implement one of these core interfaces exported by `@json-express/core`:

- `IDatabaseAdapter` (Storage Layer)
- `IApiGenerator` (Paradigm Layer)
- `ITransport` (Server Layer)
- `IRealtimeAdapter` (Event/WebSocket Layer)
- `IMiddleware` (Interceptor Layer)
- `IConfigProvider` (Configuration Layer)

### Core Utilities
The `core` package also exposes vital Twelve-Factor configuration utilities used by other plugins:
- `normalizeKey()`: Safely strips prefixes and converts `.` to nested objects.
- `deepMerge()`: Deeply merges objects with strict right-to-left precedence.

## 🚀 Programmatic Usage

If you are building a custom Node.js script and bypassing the CLI's auto-discovery entirely, you can instantiate the Kernel and register your plugins manually:

```typescript
import { JsonExpressKernel } from '@json-express/core';

// 1. Instantiate the headless kernel
const kernel = new JsonExpressKernel();

// 2. Register your plugins (Assuming they are imported)
kernel.registerConfigProvider(myConfigPlugin);
kernel.registerDatabase(myDatabasePlugin);
kernel.registerApiGenerator(myRestPlugin);
kernel.registerTransport(myExpressPlugin);

// 3. Boot the framework!
await kernel.boot(['users', 'posts']);
```

## 📄 License[MIT License](../../LICENSE)
