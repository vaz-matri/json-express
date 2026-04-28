---
title: KV & Queues (Background Services)
description: Learn how to offload heavy tasks and manage ephemeral data using JSON Express's high-performance KV stores and Task Queues.
---

# KV & Queues (Background Services)

Enterprise applications cannot rely solely on a primary relational database. If you store short-lived JWT refresh tokens in MySQL, your tables will bloat with expired garbage. If you send emails synchronously during an HTTP request, your users will experience massive latency spikes.

To solve this, JSON Express introduces two dedicated background subsystems: the **Key-Value Store** and the **Task Queue**.

## 1. The Key-Value Store (`IKvStore`)

The KV Store is designed for high-speed, ephemeral data storage. It is the backbone of the `@json-express/plugin-identity` architecture.

### Available Adapters
*   **`@json-express/kv-memory`:** Stores data in local RAM using a JavaScript `Map`. Ideal for `npm run dev`.
*   **`@json-express/kv-redis`:** An enterprise adapter wrapping `ioredis`. Maps native TTL commands directly to a Redis cluster.

### Time-To-Live (TTL)
The primary feature of the KV Store is automatic data expiration. When you `.set()` a key, you can provide a `ttlMs` (Time-To-Live in milliseconds).

```typescript
// Inside a schema hook or custom endpoint
await ctx.kvStore.set(`reset-token:${tokenHash}`, { userId: user.id }, { 
    ttlMs: 15 * 60 * 1000 // Automatically deletes the key after 15 minutes!
});
```

Because JSON Express offloads password reset links and JWT refresh tokens to the KV store, your primary database remains incredibly clean and performant.

---

## 2. Distributed Task Queues (`IQueueAdapter`)

Task Queues allow you to offload slow, heavy, or unpredictable network operations (like sending emails, hitting third-party webhooks, or generating PDFs) to dedicated background workers.

### Available Adapters
*   **`@json-express/queue-memory`:** Simulates background jobs using Node.js `setTimeout`. Great for local development, but not safe for multi-instance production clusters.
*   **`@json-express/queue-bullmq`:** An enterprise adapter wrapping `BullMQ`. Provides robust dead-letter queues, automatic retries, and cluster-safe distributed processing backed by Redis.

### Enqueueing a Task
Never await a slow operation inside an `afterCreate` schema hook. Instead, immediately return the HTTP response to the user and drop a job onto the queue.

```typescript
// Inside an afterCreate hook
if (ctx.queue) {
    // This returns instantly!
    await ctx.queue.enqueue(
        'emails',               // The Queue Name
        'sendWelcomeEmail',     // The Job Name
        { email: user.email },  // The Payload
        { delay: 5000 }         // Optional: Wait 5 seconds before processing
    );
}
```

### Registering a Worker
To process the jobs, you register a worker. When a job is pushed to the `'emails'` queue, the adapter will wake up your worker and hand it the payload.

```typescript
import { IQueueAdapter } from '@json-express/core';

export function setupWorkers(queue: IQueueAdapter) {
    queue.registerWorker('emails', async (job) => {
        if (job.name === 'sendWelcomeEmail') {
            const { email } = job.payload;
            
            // Perform the slow network operation here!
            await myEmailProvider.send(email, "Welcome to JSON Express!");
        }
    });
}
```

## Common Questions

### Can I run the KV Store without Redis?
Yes! If you are prototyping, you can use `@json-express/kv-memory`. It uses an internal interval to purge dead keys, simulating Redis without requiring you to run a Docker container.

### What happens if a Queue job fails?
If you are using the memory adapter, the job is simply dropped. If you are using the enterprise `@json-express/queue-bullmq` adapter, the job will automatically retry according to your configuration. If it repeatedly fails, it will be safely moved to a Dead Letter Queue for manual inspection.
