---
title: "@json-express/adapter-json"
description: "A zero-config, file-system database adapter for JSONExpress. Perfect for rapid prototyping and Git-backed headless CMS data."
---

# @json-express/adapter-json

> Official file-system database adapter for JSONExpress.

The `@json-express/adapter-json` package is an implementation of `IDatabaseAdapter` that uses raw `.json` files as its storage engine. 

Instead of configuring a complex SQL database, you can use this adapter to instantly read and write data to a `/data` directory in your workspace. It uses highly optimized, atomic, and debounced file-system writes to ensure data integrity.

## Installation

```bash
npm install @json-express/adapter-json
```

## Configuration

Register the adapter in your core JSONExpress configuration. You must provide a path to the directory where you want the `.json` files to be stored.

```typescript
import { JSONExpress } from '@json-express/core';
import { JsonAdapter } from '@json-express/adapter-json';
import path from 'path';

// Point it to a local /data directory
const db = new JsonAdapter(path.join(process.cwd(), 'data'));

const app = new JSONExpress({
    database: db,
    apiGenerators: [ /* ... */ ]
});
```

## Core Features

### 1. Zero-Config File Inference
If you configure the `JsonAdapter` to watch the `/data` directory, the JSONExpress kernel will automatically scan that directory on boot. 

If it finds a file named `users.json`, it will dynamically infer a strict Model Schema, determine the field types, and instantly generate REST and GraphQL endpoints for it. You don't need to write a single line of TypeScript to start building!

### 2. Atomic & Debounced Writes
Writing to the file system on every single API request is historically dangerous and slow. The `JsonAdapter` solves this by holding the database state in memory, and syncing it to disk using a debounced, atomic write strategy. 
This guarantees that your `.json` files will never become corrupted, even under heavy concurrent `POST` traffic.

### 3. Git-Backed CMS Data
Because all data is stored as raw, formatted JSON text files, this adapter is incredibly popular for static, Git-backed data. If you are building a blog, documentation site, or portfolio, you can commit your `/data/posts.json` directly to your Git repository and deploy it alongside your code!

### 4. Strict Constraint Enforcement
Despite being a simple file-system adapter, it fully complies with the JSONExpress enterprise architecture. If a user attempts to `POST` a duplicate email to a field marked `unique: true`, the adapter will correctly halt the operation and throw a `UniqueConstraintError`.

## Related Ecosystem Plugins
*   **[@json-express/core](/packages/core):** Contains the `IDatabaseAdapter` interface that this package implements.
*   **[@json-express/adapter-memory](/packages/adapter-memory):** A RAM-based alternative for when you don't want data to persist across server restarts.
