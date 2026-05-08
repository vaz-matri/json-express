---
title: "@json-express/api-rest"
description: "Automatically generate a production-ready REST API from your JSON Express schemas, complete with pagination, relations, and custom endpoints."
---

# @json-express/api-rest

> Official package for REST API auto-generation in JSONExpress.

The `@json-express/api-rest` package is an `IApiGenerator` that reads your declarative `ModelSchema` definitions and dynamically constructs strict, standard-compliant REST HTTP routes.

## Installation

```bash
npm install @json-express/api-rest
```

## Configuration

The REST generator is auto-discovered by the `json-express` runtime — installing the package is enough. It is the default API generator shipped with [`@json-express/boot`](/boot).

```bash
npm install @json-express/api-rest
npx json-express
```

If you have multiple API generators installed (e.g. REST alongside [GraphQL](/api-graphql)), pick one in `.env`:

```bash
jex.api=@json-express/api-rest
```

## Core Features

### 1. Auto-Generated CRUD Routes
For every model defined in your project (e.g., `albums`), the generator creates the following RESTful routes:
*   `GET /albums` (Fetch a list of albums)
*   `GET /albums/:id` (Fetch a specific album)
*   `POST /albums` (Create an album)
*   `PATCH /albums/:id` (Perform a partial update on an album)
*   `DELETE /albums/:id` (Delete an album)

### 2. Built-in Query Parameters
The REST generator automatically parses URL query strings to provide robust filtering, pagination, and relational capabilities without writing custom database queries.

**Relational Joining (`_expand` and `_embed`)**
*   `GET /albums/1?_expand=artist` (Resolves the `artistId` foreign key and attaches the Artist object).
*   `GET /artists/1?_embed=albums` (Finds all Albums belonging to the Artist and attaches them as an array).

**Pagination & Filtering**
*   `GET /albums?genre=Rock&_page=2&_limit=10`
*   `GET /albums?_sort=views&_order=desc`

### 3. Native Security & Middleware Integration
The REST generator tightly integrates with the JSONExpress security pipeline:
*   **Field Stripping:** It actively intercepts `PATCH` bodies and `GET` responses, aggressively deleting fields based on the schema's `access` rules (e.g., stripping `passwordHash`).
*   **Middleware Autowiring:** If an endpoint requires authentication (e.g., `access: { create: 'admin' }`), the generator automatically injects `@json-express/middleware-auth` directly into the route definition before it reaches the Transport layer.

### 4. Custom Endpoints
If you need highly specific business logic that falls outside of standard CRUD, you can define custom, Express-like endpoints directly in your schema. The REST generator will automatically mount them!

```typescript
// models/stats.ts
export default defineModel({
    name: 'stats',
    exposeApi: false, // Disables standard CRUD generation
    endpoints: {
        'GET /metrics': async (req, res, ctx) => {
            const users = await ctx.db.getAll('users');
            return res.status(200).json({ totalUsers: users.length });
        }
    },
    fields: {}
});
```

## Related Ecosystem Plugins
*   **[@json-express/api-graphql](/api-graphql):** You can run the GraphQL generator side-by-side with REST! Both will respect the exact same schemas.
*   **[@json-express/transport-express](/transport-express):** The engine that actually binds these generated routes to an underlying Node.js server.
