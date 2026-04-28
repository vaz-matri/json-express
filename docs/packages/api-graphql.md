---
title: "@json-express/api-graphql"
description: "Automatically generate a production-ready GraphQL API from your JSON Express schemas, complete with N+1 optimization and field-level security."
---

# @json-express/api-graphql

> Official package for GraphQL auto-generation in JSONExpress.

The `@json-express/api-graphql` package is an `IApiGenerator` that intercepts your declarative `ModelSchema` definitions and dynamically compiles a unified GraphQL Schema Definition Language (SDL) graph.

Instead of writing thousands of lines of GraphQL type definitions, inputs, queries, mutations, and resolvers by hand, you simply provide your database schema. This package handles the rest.

## Installation

```bash
npm install @json-express/api-graphql
```

## Configuration

To activate the GraphQL engine, register it in your core JSONExpress configuration pipeline:

```typescript
import { JSONExpress } from '@json-express/core';
import { GraphQLApiGenerator } from '@json-express/api-graphql';
import { MemoryAdapter } from '@json-express/adapter-memory';

const db = new MemoryAdapter();

const app = new JSONExpress({
    database: db,
    apiGenerators: [
        new GraphQLApiGenerator({ database: db })
    ]
});
```

By default, the API will be mounted at `POST /graphql` and includes a built-in GraphiQL playground at `GET /graphql` for rapid prototyping.

## Core Features

### 1. Auto-Generated AST Mapping
For every model defined in your project (e.g., `users`), the generator automatically maps the fields to GraphQL scalars and creates:
*   **Queries:** `user(id: ID!)`, `users(limit: Int, offset: Int, where: UsersWhereInput)`
*   **Mutations:** `createUser`, `updateUser`, `deleteUser`
*   **Inputs:** `UsersInput`, `UsersWhereInput`

### 2. The N+1 Query Optimization
A notorious issue in hand-written GraphQL servers is the **N+1 Problem**, where fetching 50 posts and their associated authors results in 51 database round-trips.

Because this generator is deeply integrated with the `IDatabaseAdapter`, it intercepts the GraphQL AST during relation traversal. It dynamically converts nested GraphQL queries into optimized `search()` filters, vastly reducing database strain and completely eliminating N+1 bottlenecks.

### 3. Bulletproof Access Enforcement
Security is enforced at the graph layer. If your schema dictates `access: { read: false }` on a `passwordHash` field:
*   The field will be physically absent from the generated `Users` GraphQL type.
*   If a client tries to query it, the GraphQL engine will throw a strict validation error before the database is ever touched.

This is fundamentally safer than traditional REST or GraphQL servers, where developers must remember to scrub data out of the response payload in every single resolver.

### 4. Customizing the Graph
If the auto-generated CRUD operations aren't enough, you can attach custom GraphQL fields directly to your schema using the `graphql` block:

```typescript
export default defineModel({
    name: 'stats',
    fields: {},
    graphql: {
        queryFields: {
            serverTime: {
                type: GraphQLString,
                resolve: () => new Date().toISOString()
            }
        }
    }
});
```

## Related Ecosystem Plugins
*   **[@json-express/api-rest](/packages/api-rest):** You can run the REST generator side-by-side with GraphQL! Both will respect the exact same schemas and database adapters.
*   **[@json-express/middleware-auth](/packages/middleware-auth):** Use the authentication middleware to secure your GraphQL endpoint with JWTs and Argon2 hashed passwords.
