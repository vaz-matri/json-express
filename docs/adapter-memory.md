---
title: "@json-express/adapter-memory"
description: "An ultra-fast, ephemeral RAM database adapter for JSONExpress. Perfect for automated testing and isolated local development."
---

# @json-express/adapter-memory

> Official ephemeral RAM database adapter for JSONExpress.

The `@json-express/adapter-memory` package is an implementation of `IDatabaseAdapter` that stores all application data purely in system RAM using JavaScript Maps. 

Because it never touches the disk or requires a network connection, it is blazingly fast. However, **all data is permanently lost when the Node.js server restarts.**

## Installation

```bash
npm install @json-express/adapter-memory
```

## Configuration

Register the adapter in your core JSONExpress configuration pipeline. Unlike the JSON adapter, it requires zero configuration arguments.

```typescript
import { JSONExpress } from '@json-express/core';
import { MemoryAdapter } from '@json-express/adapter-memory';

// Instantiates a blank slate in RAM
const db = new MemoryAdapter();

const app = new JSONExpress({
    database: db,
    apiGenerators: [ /* ... */ ]
});
```

## Core Features

### 1. Isolated E2E Testing Environment
The primary use case for `adapter-memory` is automated testing. 

If you are running a Playwright or Vitest E2E suite, you do not want your tests colliding with each other or polluting a real database. By spinning up JSONExpress with the `MemoryAdapter` before each test suite, you guarantee a pristine, isolated, and incredibly fast database environment for every single test run.

### 2. Rapid API Scaffolding
When you are first building a frontend application (like a React or Vue dashboard), you often just need a "fake" backend to build against. 

By running JSONExpress with the `MemoryAdapter` and the `@json-express/seeder-faker` utility, you can instantly spin up thousands of realistic mock records in RAM without worrying about database migrations or cleaning up junk data later.

### 3. Guaranteed Enterprise Parity
You might wonder: *"If I test my app using RAM, how do I know it will work in production with PostgreSQL?"*

This adapter is strictly verified against the internal **Adapter Compliance Suite**. It guarantees 100% feature parity with enterprise SQL adapters. If you issue a `GET /albums?_expand=artist`, the `MemoryAdapter` will perform the exact same foreign-key resolution logic as a real SQL join. If you insert a duplicate email, it will throw the exact same `UniqueConstraintError`.

## Related Ecosystem Plugins
*   **[@json-express/core](/packages/core):** Run the `runAdapterComplianceTests` from the core testing utilities to verify adapter behavior.
*   **[@json-express/adapter-json](/packages/adapter-json):** Swap to the JSON file adapter if you want your mock data to survive server restarts!
