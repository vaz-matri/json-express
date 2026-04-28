---
title: "@json-express/queue-memory"
description: "An in-memory task queue for JSONExpress using setTimeout. Perfect for local development and testing."
---

# @json-express/queue-memory

> The default in-memory task queue for JSONExpress.

The `@json-express/queue-memory` package implements `IQueueAdapter` using Node.js `setTimeout`. It simulates asynchronous background job processing without requiring Redis or any external infrastructure.

## Installation

```bash
npm install @json-express/queue-memory
```

## Configuration

```typescript
import { MemoryQueueAdapter } from '@json-express/queue-memory';

const queue = new MemoryQueueAdapter();
```

## Core Features

### 1. Fire-and-Forget Dispatch
When you call `enqueue()`, the job is scheduled via `setTimeout` and the method returns immediately with a unique `jobId`. This ensures your HTTP response is never blocked by slow background operations.

```typescript
const jobId = await queue.enqueue('emails', 'sendWelcome', { email: 'user@example.com' });
// jobId = "a1b2c3d4-..."  (returned instantly)
```

### 2. Delayed Execution
You can schedule a job to execute after a specified delay:

```typescript
await queue.enqueue('notifications', 'sendReminder', payload, { delay: 60000 }); // 1 minute
```

### 3. Worker Registration
Register a handler function for a specific queue name. When a job arrives on that queue, your handler is invoked:

```typescript
queue.registerWorker('emails', async (job) => {
    if (job.name === 'sendWelcome') {
        await myEmailService.send(job.payload.email, 'Welcome!');
    }
});
```

### 4. Graceful Error Isolation
If a job handler throws an error, it is caught internally and logged. The error will **never** crash the Node.js server or interrupt other queued jobs. This is critical for maintaining server stability during development.

### 5. Cron Limitation Warning
If you attempt to use the `cron` option, the adapter will log a warning explaining that cron schedules are not supported in the memory adapter. The job will execute once instead. For recurring jobs, use `@json-express/queue-bullmq`.

## Related Ecosystem Packages
*   **[@json-express/queue-bullmq](/packages/queue-bullmq):** The production-grade alternative with automatic retries, dead-letter queues, and Redis-backed distributed processing.
*   **[@json-express/plugin-identity](/packages/plugin-identity):** Uses the queue to dispatch password reset emails asynchronously.
