---
title: Hooks & Security
description: Learn how to intercept database operations and trigger asynchronous background tasks using schema lifecycle hooks.
---

# Hooks & Security

While the API Generator handles all standard CRUD operations automatically, enterprise applications inevitably require custom business logic. You might need to hash a password before it saves to the database, or send a welcome email immediately after a user registers.

JSONExpress handles this cleanly using **Schema Lifecycle Hooks**.

## The Lifecycle

Hooks are functions you define directly inside your `defineModel` configuration. The Database Adapter guarantees they will execute at precisely the right moment.

There are four available hooks:
1. `beforeCreate(payload, context)`
2. `afterCreate(record, context)`
3. `beforeUpdate(patch, context)`
4. `afterUpdate(record, patch, context)`

---

## Mutating Payloads (`before` hooks)

The `beforeCreate` and `beforeUpdate` hooks receive the incoming payload *before* it touches the database. 
You can inspect the payload, modify it, and return the modified version. If you return a value, the adapter will use your returned object for the database operation.

### Example: Argon2 Password Hashing
This is how the `@json-express/plugin-identity` secures your passwords. It intercepts the raw payload, hashes the password, and strips the plain-text string.

```typescript
import { defineModel, types } from '@json-express/core';
import * as argon2 from 'argon2';

export default defineModel({
    name: 'users',
    fields: {
        id: types.id(),
        email: types.string(),
        passwordHash: types.string()
    },
    hooks: {
        beforeCreate: async (payload, ctx) => {
            if (payload.password) {
                // Hash the password securely
                payload.passwordHash = await argon2.hash(payload.password);
                
                // CRITICAL: Strip the plain-text password so it never hits the DB
                delete payload.password;
            }
            return payload; // Return the mutated payload
        }
    }
});
```

### Aborting Operations
If a payload violates a strict security requirement, you can simply `throw new Error()` inside a `before` hook. The Database Adapter will instantly abort the operation and the REST API will return a `500` (or `400` if you throw a specific known error type).

---

## Triggering Side-Effects (`after` hooks)

The `afterCreate` and `afterUpdate` hooks are executed *after* the database has successfully committed the data. The `record` argument contains the final, committed object (including the auto-generated `id`).

### The Hook Context (`ctx`)
Every hook receives a `HookContext` object. This is your gateway to the rest of the framework. It contains:
*   `ctx.db`: The active `IDatabaseAdapter` (allowing you to fetch related records).
*   `ctx.logger`: The system logger.
*   `ctx.kvStore`: Access to the ephemeral Key-Value store.
*   `ctx.queue`: Access to the distributed task queue.

### Example: Sending Asynchronous Emails
Sending an email is a slow, blocking operation. You should **never** await an email provider directly inside a hook, because it will force the end-user to wait for the HTTP response.

Instead, use `ctx.queue` to instantly offload the task to a background worker:

```typescript
export default defineModel({
    name: 'users',
    fields: { /* ... */ },
    hooks: {
        afterCreate: async (record, ctx) => {
            // Log the creation
            ctx.logger.info(`New user registered: ${record.email}`);

            // Enqueue a welcome email to the background worker
            // This returns instantly, allowing the HTTP response to finish!
            if (ctx.queue) {
                await ctx.queue.enqueue('emails', 'sendWelcomeEmail', { 
                    userId: record.id, 
                    email: record.email 
                });
            }
        }
    }
});
```

## Security Best Practices
1. **Never trust the client:** Use `before` hooks to forcefully sanitize incoming data if the standard Field-Level access controls (`access: { create: 'admin' }`) are not granular enough.
2. **Never block the event loop:** Always offload CPU-intensive operations (like PDF generation) or slow network calls (like webhooks and emails) to `ctx.queue` during an `after` hook.
