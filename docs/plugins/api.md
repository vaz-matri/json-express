---
title: API Generation (REST & GraphQL)
description: Learn how JSON Express automatically generates secure REST and GraphQL endpoints directly from your database schemas.
---

# API Generation

In a traditional Node.js application, developers waste countless hours writing repetitive routing controllers, serialization logic, and validation schemas. 

JSON Express eliminates this completely. The framework uses specialized **API Generators** (`IApiGenerator`) to read your declarative `defineModel` schemas and dynamically compile production-ready network endpoints.

JSON Express ships with two official generators:
1. **`@json-express/api-rest`**
2. **`@json-express/api-graphql`**

You can use either one, or both simultaneously!

---

## 1. The REST API Generator

When you register `@json-express/api-rest`, the framework automatically generates a standard RESTful URL structure for every model in your application.

If you have an `albums` model, the following routes are instantly available:
*   `GET /albums` (Fetch all, with optional filtering/pagination)
*   `GET /albums/:id` (Fetch single)
*   `POST /albums` (Create)
*   `PATCH /albums/:id` (Partial update)
*   `DELETE /albums/:id` (Delete)

### Relational Queries (`_expand` & `_embed`)
The REST generator supports powerful relational querying right out of the box via query parameters.

**Expanding Foreign Keys (`many-to-one`)**
If an `album` contains an `artistId`, you can instruct the API to resolve the related artist object:
```http
GET /albums/1?_expand=artist
```
The generator instructs the Database Adapter to fetch the Album, perform the join, and return the deeply populated JSON.

**Embedding Children (`one-to-many`)**
If an `artist` has many `albums`, you can embed the child array:
```http
GET /artists/1?_embed=albums
```

---

## 2. The GraphQL API Generator

If your frontend team prefers GraphQL, simply swap in `@json-express/api-graphql`. 

This generator completely bypasses traditional REST routing. Instead, it parses your JSON Express schemas and compiles them into a strict, unified GraphQL Schema Definition Language (SDL) graph.

### Auto-Generated Queries & Mutations
For an `albums` model, the generator automatically creates:
*   **Queries:** `album(id: ID!)`, `albums(filter: AlbumFilter)`
*   **Mutations:** `createAlbum`, `updateAlbum`, `deleteAlbum`

### Resolving the N+1 Problem
A common pitfall in GraphQL is the N+1 query problem, where fetching a list of 50 albums and their associated artists results in 51 separate database queries.

The JSON Express GraphQL generator automatically intercepts deeply nested GraphQL AST queries and translates them into `QueryOptions.expand` arrays. This means the Database Adapter performs a highly optimized, single-pass resolution, completely eliminating the N+1 problem.

---

## Strict Access Enforcement

The most critical responsibility of an API Generator is security. Because they sit between the client and the Database Adapter, the generators strictly enforce the `access` rules defined in your schemas.

1.  **Field Stripping (Read):** If a schema defines `access: { read: false }` on a `passwordHash` field, the API Generators will forcefully `delete` that key from the payload before sending the JSON response or GraphQL result to the client.
2.  **Field Stripping (Write):** If a field is `update: false`, the generator will silently drop that field from the incoming `PATCH` body before passing the payload to the database adapter.
3.  **Hiding Models:** If an entire schema is marked with `exposeApi: false` (such as internal configuration models), the generator will completely ignore it. No REST routes or GraphQL types will be created for that model.

## Common Questions

### Can I run REST and GraphQL at the same time?
Yes. You can mount the REST generator to `/api/v1/*` and the GraphQL generator to `/graphql`. They will both talk to the exact same Database Adapter and respect the exact same schema security rules.

### Can I add custom REST routes?
Yes. Use the `endpoints` block inside your schema to define custom express-like handlers (e.g., `'GET /metrics': async (req, res, ctx) => { ... }`). The REST generator will automatically bind these to the transport layer. 
*(Note: Custom endpoints are ignored by the GraphQL generator).*
