---
title: Database Adapters & Compliance
description: Learn how JSON Express connects to different databases and how to build your own adapter using the Compliance Suite.
---

# Database Adapters

JSON Express is strictly **database agnostic**. 

The core framework never writes a single SQL query or direct database command. Instead, all database interactions are abstracted through the `IDatabaseAdapter` interface. This architectural decision means you can prototype your application using local memory, and swap to an enterprise MySQL or PostgreSQL database later without changing a single line of your application code.

## Available Adapters

JSON Express provides two lightweight adapters out of the box for rapid development:

1. **`@json-express/adapter-memory`**: A blazing fast, zero-dependency adapter that stores data in RAM. Perfect for automated testing and local scaffolding. Data is lost when the server restarts.
2. **`@json-express/adapter-json`**: A file-based adapter that reads and writes to `.json` files in your `/data` directory. It uses atomic, debounced file-system writes to ensure your data persists across server restarts without corrupting files.

To swap adapters, simply pass the new instance into your core framework initialization.

---

## Adapter Responsibilities

If you are looking to build a custom adapter (e.g., `@json-express/adapter-postgres`), your adapter must implement the `IDatabaseAdapter` interface and fulfill several strict architectural responsibilities:

### 1. Basic CRUD Guarantees
Your adapter must implement `create`, `update`, `delete`, `getById`, `getAll`, and `search`. 
* On `create`, if the payload does not contain an `id`, the adapter must generate one automatically.
* On `update`, the adapter must perform a partial merge (PATCH), leaving unspecified fields intact.

### 2. Constraint Enforcement
If a schema field is defined with `{ unique: true }`, it is the adapter's responsibility to check for duplicates during `create` and `update` operations. 
If a duplicate is found, the adapter **must** throw a `UniqueConstraintError` imported from `@json-express/core`. The REST API Generator will catch this specific error and automatically translate it into a structured HTTP `400 Bad Request` for the client.

### 3. Relational Resolution
When the core framework passes a `QueryOptions` object with `expand: ['artist']`, the adapter is responsible for evaluating the relational foreign keys and attaching the populated `artist` object to the response.

### 4. Hook Execution
The adapter must check the schema for `beforeCreate`, `afterCreate`, `beforeUpdate`, and `afterUpdate` hooks. It must pause execution, await the result of the hook, and allow the hook to mutate the payload before finally committing the data to the database.

---

## The Adapter Compliance Suite

Because the responsibilities of an adapter are so strict, JSON Express ships with a formal **Compliance Suite**. 

If you are writing a new adapter, you do not need to guess if you implemented it correctly. You simply import the compliance suite into your testing framework (e.g., Vitest or Jest) and pass it an instance of your adapter.

```typescript
// testing/my-postgres-adapter.test.ts
import { test } from 'vitest';
import { runAdapterComplianceTests } from '@json-express/core';
import { PostgresAdapter } from '../src/index';

test('Postgres Adapter complies with JSON Express core contracts', async () => {
    // The compliance suite handles its own assertions!
    await runAdapterComplianceTests(
        // Setup function
        async () => {
            const db = new PostgresAdapter('postgres://user:pass@localhost:5432/test_db');
            await db.connect();
            return db;
        },
        // Teardown function
        async (db) => {
            await db.dropTables();
            await db.disconnect();
        }
    );
});
```

### What does the Compliance Suite test?
When you run the test, the suite will automatically:
1. Generate temporary testing schemas.
2. Verify that your adapter generates IDs correctly.
3. Attempt to insert duplicate records to assert that your adapter correctly throws a `UniqueConstraintError`.
4. Ensure your adapter supports partial updates.

If your adapter passes the compliance suite, you can confidently publish it to NPM knowing it will work flawlessly inside any JSON Express application.
