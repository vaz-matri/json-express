# @json-express/kv-redis

A production-ready Key-Value store adapter for JSONExpress backed by Redis.

## Overview

Unlike `@json-express/kv-memory`, this adapter connects to a centralized Redis database. This ensures that ephemeral data (like rate limits, OTPs, short-lived tokens, and cached responses) is shared across all your running JSONExpress servers.

## Installation

```bash
npm install @json-express/kv-redis ioredis
```

## Setup

```typescript
// src/boot.ts
import { Kernel } from '@json-express/core';
import { KvRedis } from '@json-express/kv-redis';

export const kernel = new Kernel();

kernel.registerKvStore(new KvRedis({
    connectionString: process.env.REDIS_URL || 'redis://localhost:6379',
    logger: kernel.logger
}));
```

## Usage

This adapter implements the `IKvStore` interface.

```typescript
// Set a key with a 5-minute Time-To-Live (TTL)
await kernel.kv.set('rate-limit:user_123', { count: 5 }, { ttlMs: 300000 });

// Retrieve the data
const data = await kernel.kv.get<{ count: number }>('rate-limit:user_123');

// Delete the key manually
await kernel.kv.delete('rate-limit:user_123');
```
