---
title: "@json-express/transport-fastify"
description: "The official Fastify transport layer for JSONExpress. Mounts auto-generated APIs to a blazingly fast Fastify application."
---

# @json-express/transport-fastify

> Official Fastify transport for JSONExpress.

The `@json-express/transport-fastify` package implements the `ITransport` interface to serve your JSONExpress application using **Fastify**. 

If your application requires extreme throughput and minimal overhead, you can swap out the default Express transport for Fastify. Because JSONExpress is completely framework-agnostic, your database adapters, schema validation, and custom endpoints remain 100% untouched.

## Installation

```bash
npm install @json-express/transport-fastify fastify @fastify/cors
```

## Configuration

Register the transport inside your core JSONExpress pipeline.

```typescript
import { JSONExpress } from '@json-express/core';
import { FastifyTransport } from '@json-express/transport-fastify';

const app = new JSONExpress({
    database: myDb,
    transport: new FastifyTransport({ configProvider: myConfig, logger: myLogger })
});

// Boots the Fastify server on port 3000
await app.start(3000);
```

## Core Features

### 1. Zero-Cost Abstraction
Fastify is famous for being one of the fastest Node.js web frameworks available. This transport is built to stay out of the way. It maps the internal `RouteDefinition` arrays directly to Fastify's native `fastify.route()` API, ensuring you retain the full performance benefits of the underlying framework.

### 2. Built-in CORS
Unlike Express, which requires manual external middleware for Cross-Origin Resource Sharing, the Fastify Transport integrates directly with `@fastify/cors`.

```typescript
// JSONExpress Configuration Object
{
    fastify: {
        cors: {
            origin: ['https://admin.myapp.com'],
            credentials: true
        }
    }
}
```
When the JSONExpress configuration engine detects this block, the transport automatically registers and configures the native Fastify CORS plugin for you.

### 3. Asynchronous Trace Context
Just like the Express transport, the Fastify transport ensures enterprise traceability. Every request is wrapped in Node.js `AsyncLocalStorage`, generating a unique `traceId`. If your schema hooks or background queue workers write to the system logger, those logs will be beautifully grouped by the HTTP request that triggered them.

### 4. Seamless Plugin Migration
One of the biggest headaches in Node.js is migrating an application from Express to Fastify, because you often have to rewrite hundreds of `req` and `res` method calls (e.g., changing `res.json()` to `reply.send()`). 

Because JSONExpress strictly types custom endpoint handlers using `JsonRequest` and `JsonResponse`, you can safely swap `@json-express/transport-express` for `@json-express/transport-fastify` in `package.json` and deploy immediately!

## Related Ecosystem Packages
*   **[@json-express/transport-express](/packages/transport-express):** The default, highly stable transport layer.
*   **[@json-express/api-graphql](/packages/api-graphql):** The Fastify transport seamlessly serves the generated GraphQL endpoints!
