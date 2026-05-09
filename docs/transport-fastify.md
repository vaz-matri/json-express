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

The transport is auto-discovered by the `json-express` runtime — installing the package is enough. Most users start with [`@json-express/boot`](/boot) (which ships `transport-express`) and switch to Fastify by uninstalling Express:

```bash
npm uninstall @json-express/transport-express
npm install @json-express/transport-fastify fastify @fastify/cors
npx json-express
```

If both transports are installed, pick one in `.env`:

```bash
jex.transport=@json-express/transport-fastify
jex.port=8080
```

## Core Features

### 1. Zero-Cost Abstraction
Fastify is famous for being one of the fastest Node.js web frameworks available. This transport is built to stay out of the way. It maps the internal `RouteDefinition` arrays directly to Fastify's native `fastify.route()` API, ensuring you retain the full performance benefits of the underlying framework.

### 2. Built-in CORS
Unlike Express, which requires external middleware for Cross-Origin Resource Sharing, this transport integrates directly with `@fastify/cors`. Configure it under `fastify.cors` in your config provider — for object-shaped values use `jex.config.ts` rather than `.env`:

```typescript
// jex.config.ts
export default {
    fastify: {
        cors: {
            origin: ['https://admin.myapp.com'],
            credentials: true
        }
    }
};
```

When this block is present, the transport registers and configures `@fastify/cors` for you.

### 3. Asynchronous Trace Context
Just like the Express transport, the Fastify transport ensures enterprise traceability. Every request is wrapped in Node.js `AsyncLocalStorage`, generating a unique `traceId`. If your schema hooks or background queue workers write to the system logger, those logs will be beautifully grouped by the HTTP request that triggered them.

### 4. Seamless Plugin Migration
One of the biggest headaches in Node.js is migrating an application from Express to Fastify, because you often have to rewrite hundreds of `req` and `res` method calls (e.g., changing `res.json()` to `reply.send()`). 

Because JSONExpress strictly types custom endpoint handlers using `JsonRequest` and `JsonResponse`, you can safely swap `@json-express/transport-express` for `@json-express/transport-fastify` in `package.json` and deploy immediately!

## Related Ecosystem Packages
*   **[@json-express/transport-express](/transport-express):** The default, highly stable transport layer.
*   **[@json-express/api-graphql](/api-graphql):** The Fastify transport seamlessly serves the generated GraphQL endpoints!
