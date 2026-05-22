# @json-express/queue-redis

A distributed task queue adapter for JSONExpress powered by Redis and BullMQ.

## Overview

Unlike `queue-memory`, the Redis queue adapter is designed for robust, scalable production environments. It guarantees reliable execution across multiple instances and seamlessly supports retries, delayed jobs, and distributed cron schedules using BullMQ under the hood.

## Installation

```bash
npm install @json-express/queue-redis bullmq ioredis
```

## Setup

Register the adapter during kernel boot:

```typescript
// src/boot.ts
import { Kernel } from '@json-express/core';
import { QueueRedis } from '@json-express/queue-redis';

export const kernel = new Kernel();

kernel.registerQueueAdapter(new QueueRedis({
    connectionString: process.env.REDIS_URL || 'redis://localhost:6379',
    logger: kernel.logger
}));
```

## Usage

This adapter implements the `IQueueAdapter` interface. This means you do not need to configure BullMQ directly. Simply enqueue jobs on the kernel, and `queue-redis` translates the generic constraints (`delay`, `cron`) into BullMQ instructions.

```typescript
// Fire and forget
await kernel.queue.enqueue('emails', 'sendWelcome', { to: 'user@example.com' });

// Run 10 seconds from now
await kernel.queue.enqueue('cleanup', 'deleteTemp', { id: 123 }, { delay: 10000 });

// Run daily
await kernel.queue.enqueue('reports', 'daily', {}, { cron: '0 0 * * *' });
```

Workers process the queues transparently across all connected JSONExpress instances:

```typescript
kernel.queue.registerWorker('emails', async (job) => {
    console.log(`Sending email to ${job.payload.to}`);
});
```
