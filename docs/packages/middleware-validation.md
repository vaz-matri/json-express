---
title: "@json-express/middleware-validation"
description: "Zod-powered request body and query string validation middleware for JSONExpress APIs."
---

# @json-express/middleware-validation

> Official Zod validation middleware for JSONExpress.

The `@json-express/middleware-validation` package implements `IMiddleware` and provides automatic request body and query string validation using **Zod** schemas. It sits in the middleware pipeline between the Auth gate and the API Generator, rejecting malformed requests before they ever reach your database.

## Installation

```bash
npm install @json-express/middleware-validation zod
```

## Configuration

Define your validation rules inside the JSONExpress configuration object. Each rule targets a specific HTTP method and path, and provides a Zod schema for the request body and/or query string.

```typescript
import { z } from 'zod';

// jex.config.ts
export default {
    validation: {
        rules: [
            {
                method: 'POST',
                path: '/users',
                body: z.object({
                    email: z.string().email(),
                    role: z.enum(['user', 'admin']).default('user')
                })
            },
            {
                method: 'PATCH',
                path: '/users',
                body: z.object({
                    email: z.string().email().optional(),
                    role: z.enum(['user', 'admin']).optional()
                })
            },
            {
                method: 'GET',
                path: '/products',
                query: z.object({
                    category: z.string().optional(),
                    minPrice: z.coerce.number().optional()
                })
            }
        ]
    }
};
```

## Core Features

### 1. Path Matching (Exact & Prefix)
Rules support both exact path matching (`/users`) and prefix matching. If a rule targets `/users`, it will also match `/users/123`.

You can also use **RegExp** patterns for complex matching:

```typescript
{
    method: '*',
    path: /^\/api\/v[0-9]+\/orders/,
    body: orderSchema
}
```

### 2. Payload Sanitization
When validation succeeds, the middleware replaces the raw `req.body` with Zod's parsed output (`bodyResult.data`). This means Zod transformations like `.trim()`, `.default()`, and `.transform()` are automatically applied before the data reaches the database adapter.

### 3. Structured Error Responses
When validation fails, the middleware immediately returns a `400 Bad Request` with Zod's formatted error output:

```json
{
    "error": "Validation failed",
    "details": {
        "body": {
            "email": { "_errors": ["Invalid email"] }
        }
    }
}
```

This structured format allows frontend clients to map individual error messages directly to form fields.

### 4. GraphQL Compatibility
The validation rules are also consumed by the `@json-express/api-graphql` generator. When a GraphQL mutation is executed, the generator checks for matching validation rules and runs them against the mutation input, throwing a `GraphQLError` with `BAD_USER_INPUT` extensions on failure.

## Related Ecosystem Packages
*   **[@json-express/middleware-auth](/packages/middleware-auth):** Auth runs *before* validation in the middleware pipeline, ensuring unauthenticated users are rejected before validation is even attempted.
*   **[@json-express/api-rest](/packages/api-rest):** The REST generator automatically injects this middleware into routes that have matching validation rules.
