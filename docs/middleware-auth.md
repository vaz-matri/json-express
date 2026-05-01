---
title: "@json-express/middleware-auth"
description: "Protect your JSONExpress APIs using symmetric JWTs (HMAC) or enterprise Asymmetric Keys (JWKS) like Auth0 and AWS Cognito."
---

# @json-express/middleware-auth

> Official authentication middleware for JSONExpress.

The `@json-express/middleware-auth` package acts as the security gatekeeper for your entire API. Before a request is allowed to reach your REST or GraphQL endpoints, this middleware verifies the incoming JWT (JSON Web Token), decodes the user payload, and injects it securely into the request context.

## Installation

```bash
npm install @json-express/middleware-auth
```

## Configuration

Register the middleware inside the `middlewares` array of your core JSONExpress configuration. 

```typescript
import { JSONExpress } from '@json-express/core';
import { AuthMiddleware } from '@json-express/middleware-auth';

const app = new JSONExpress({
    database: myDb,
    middlewares: [
        new AuthMiddleware({ configProvider: myConfig, logger: myLogger })
    ]
});
```

The middleware behaves differently depending on the security variables you provide to the Configuration engine:

### 1. Symmetric Local Auth (HMAC)
If you are using the built-in `@json-express/plugin-identity`, the authentication is handled locally using a standard secret.

```typescript
// JSONExpress Configuration Object
{
    auth: {
        secret: process.env.JWT_SECRET || 'super-secret-key',
        exclude: ['/auth/login', '/public/products']
    }
}
```

### 2. Asymmetric Enterprise Auth (JWKS)
If your company uses a third-party Identity Provider like **Auth0**, **AWS Cognito**, or **Firebase**, you must use Asymmetric validation. 

Instead of a `secret`, you provide the URL to your provider's public JSON Web Key Set (JWKS). The middleware will dynamically fetch the public keys, cache them, and verify the tokens issued by your provider.

```typescript
// JSONExpress Configuration Object
{
    auth: {
        jwksUri: 'https://your-tenant.us.auth0.com/.well-known/jwks.json',
        audience: 'https://api.myapp.com', // Strongly recommended!
        issuer: 'https://your-tenant.us.auth0.com/',
        algorithms: ['RS256'],
        exclude: ['/public']
    }
}
```

## Core Features

### Anti-Spoofing Protection
A common vulnerability in Node.js architectures occurs when internal APIs trust client headers like `X-User-Id`. 

This middleware prevents spoofing by **always** aggressively deleting the `x-user-payload` header from the raw incoming HTTP request. Once it successfully cryptographically verifies the Bearer token, it re-injects the verified payload back into the header for downstream plugins (like the REST and GraphQL generators) to consume.

### Granular Exclusions
By default, if this middleware is mounted, it protects *everything*. You can use the `exclude` configuration array to carve out public routes.
*   The matching is prefix-based. If you exclude `/public`, then `/public/posts` and `/public/authors/1` are both allowed through without a Bearer token.

### Strict Status Codes
*   **`401 Unauthorized`:** Returned if the request is missing a token, or the header is not formatted as `Bearer <token>`.
*   **`403 Forbidden`:** Returned if the token exists, but fails cryptographic verification, is expired, or its `audience`/`issuer` claims do not match the configuration.

## Related Ecosystem Packages
*   **[@json-express/plugin-identity](/packages/plugin-identity):** If you aren't using Auth0, use this plugin to generate the JWTs locally!
*   **[@json-express/api-rest](/packages/api-rest):** The API generators consume the decoded JWT payload from this middleware to enforce field-level access control.
