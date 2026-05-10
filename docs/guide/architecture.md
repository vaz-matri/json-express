---
title: Enterprise Architecture
description: Understand the mental model, execution pipeline, and plugin architecture of the JSONExpress meta-framework.
---

# Enterprise Architecture

To truly master JSONExpress, you must first understand what it is. **JSONExpress is not just an HTTP server.** It is a declarative, schema-driven meta-framework designed to eliminate boilerplate backend code while maintaining enterprise-grade extensibility.

Instead of writing hundreds of repetitive routes, controllers, and services, you simply define **Models**. The framework's kernel then passes these models through a highly optimized pipeline to auto-generate secure, production-ready APIs.

## The Execution Pipeline

When you run `json-express start`, the kernel executes a strict, 5-stage pipeline. Understanding this pipeline is the key to extending the framework.

### 1. The Schema Loader
The boot process begins by scanning your workspace. The CLI looks for TypeScript files inside your `/models` directory and `.json` files inside your `/data` directory. It transpiles and merges these into a single array of `ModelSchema` definitions. 

### 2. Database Adapters (`IDatabaseAdapter`)
Next, the Kernel connects to your active Database Adapter (e.g., `@json-express/adapter-memory` or `@json-express/adapter-json`). It feeds the schemas to the adapter. The adapter is responsible for:
*   Enforcing `unique` field constraints.
*   Resolving relational queries (`_expand` and `_embed`).
*   Executing lifecycle hooks (`beforeCreate`, `afterUpdate`).

### 3. API Generators (`IApiGenerator`)
Once the database layer is initialized, the Kernel passes the schemas to the API Generators (like `@json-express/api-rest` or `@json-express/api-graphql`). 
The API Generator reads the `access` control rules defined in your schemas (e.g., `read: false`) and dynamically constructs HTTP route definitions, stripping out fields the client is not allowed to see.

### 4. Background Services (KV & Queues)
Before starting the web server, the Kernel connects your ephemeral services:
*   **Key-Value Store (`IKvStore`):** Used for high-speed, auto-expiring data like JWT refresh tokens and password reset codes.
*   **Task Queues (`IQueueAdapter`):** Used to offload heavy background tasks (like sending emails) so the main HTTP thread is never blocked.

### 5. The Transport Layer (`ITransport`)
Finally, the Kernel hands all the generated routes to the Transport layer. By default, this is `@json-express/transport-express`. The Transport binds the routes to an actual HTTP server and begins listening for incoming traffic.

## Why this Architecture?

This strict separation of concerns provides massive benefits for enterprise teams:
1.  **Zero Vendor Lock-in:** You can swap `@json-express/adapter-memory` for a MySQL adapter without rewriting a single line of your application code.
2.  **Transport Agnostic:** Prefer Fastify over Express? Swap the transport plugin. Your API endpoints remain completely untouched.
3.  **Security by Default:** Because Access Control rules are evaluated at the API Generator level, you can never accidentally write a route that leaks a user's password.

## Common Questions

### Can I write custom routes?
Yes! While the API Generator handles 90% of standard CRUD operations, you can bind completely custom, Express-like endpoints directly onto your models using the `endpoints` property.

### How does it handle relations?
Relations are handled by the Database Adapter. If a client requests `GET /albums?_expand=artist`, the API generator passes that request to the adapter, which performs the foreign-key lookup and returns the deeply nested data.
