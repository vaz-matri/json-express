# @json-express/queue-bullmq

A distributed task queue adapter for JSONExpress powered by BullMQ.

## Installation

```bash
npm install @json-express/queue-bullmq bullmq ioredis
```

## Setup

```typescript
// src/boot.ts
import { Kernel } from '@json-express/core';
import { QueueBullmq } from '@json-express/queue-bullmq';

export const kernel = new Kernel();

kernel.registerQueueAdapter(new QueueBullmq({
    connectionString: process.env.REDIS_URL || 'redis://localhost:6379',
    logger: kernel.logger
}));
```

## Usage

This adapter implements the `IQueueAdapter` interface, providing a simple API for background jobs. It connects to Redis via BullMQ under the hood.

```typescript
// Enqueue a job
await kernel.queue.enqueue('emails', 'sendWelcome', { to: 'user@example.com' });

// Enqueue with delay
await kernel.queue.enqueue('cleanup', 'deleteTemp', { id: 123 }, { delay: 5000 });

// Enqueue distributed cron job
await kernel.queue.enqueue('reports', 'daily', {}, { cron: '0 0 * * *' });
```

Workers process the queues seamlessly:

```typescript
kernel.queue.registerWorker('emails', async (job) => {
    console.log(`Sending email to ${job.payload.to}`);
});
```
