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

The middleware is auto-discovered by the `json-express` runtime — installing the package is enough. Its behaviour is driven entirely by `jex.auth.*` keys in the config provider.

```bash
npm install @json-express/middleware-auth
```

### 1. Symmetric Local Auth (HMAC)

When paired with [`@json-express/plugin-identity`](/packages/plugin-identity), validation uses an HMAC secret:

```bash
# .env
jex.auth.secret=a-strong-32-byte-secret
jex.auth.exclude=/auth,/public/products
```

### 2. Asymmetric Enterprise Auth (JWKS)

For a third-party Identity Provider (Auth0, AWS Cognito, Firebase, Okta), point the middleware at the provider's JWKS endpoint instead of supplying a secret. The middleware fetches public keys on demand, caches them, and verifies every Bearer token against them.

```bash
# .env
jex.auth.jwksUri=https://your-tenant.us.auth0.com/.well-known/jwks.json
jex.auth.audience=https://api.myapp.com
jex.auth.issuer=https://your-tenant.us.auth0.com/
jex.auth.algorithms=RS256
jex.auth.exclude=/public
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
