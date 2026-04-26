# `@json-express/middleware-auth`

> **JWT authentication middleware for JSON Express v2.**
> Verifies Bearer tokens on incoming requests, rejects unauthenticated traffic, and publishes the decoded JWT payload so downstream generators (REST, GraphQL) can authorize.

---

## What It Does

This plugin implements the `IMiddleware` interface under the name `'auth'`. When a route includes `'auth'` in its `middlewares[]`, every request to that route must carry a valid JWT `Authorization: Bearer <token>` header. Otherwise the middleware short-circuits with `401 Unauthorized` (missing/malformed header) or `403 Forbidden` (invalid/expired token).

On success, the decoded payload is serialized and attached to the request as:

```
req.headers['x-user-payload'] = JSON.stringify(decoded)
```

The `api-rest` and `api-graphql` generators read this header to evaluate per-collection access rules (see **Schema-Driven Access Control** below).

---

## Configuration

All options are set via `.env` using the `JEX` namespace (double underscore creates nested blocks). Pick **exactly one** of `auth.secret` or `auth.jwksUri` — the middleware throws at boot if both are set.

### Symmetric (HMAC, e.g. tokens you mint yourself)

```env
# HMAC secret used by jsonwebtoken to verify every token.
JEX__AUTH__SECRET=your-hmac-secret

# Optional — comma-separated or array of path prefixes the middleware should skip.
# Useful for health checks, docs, login endpoints, or making /graphql public.
JEX__AUTH__EXCLUDE=/docs,/health,/login
```

### Asymmetric (JWKS, e.g. Auth0 / Firebase / Supabase / any OIDC provider)

```env
# Public JWKS endpoint of your identity provider. The middleware fetches and
# caches the signing keys, then verifies RS256 tokens against them — no secret
# is shared with your app.
JEX__AUTH__JWKS_URI=https://dev-xxx.us.auth0.com/.well-known/jwks.json

# Optional — strictly validated by jsonwebtoken when set.
JEX__AUTH__AUDIENCE=my-json-express-api
JEX__AUTH__ISSUER=https://dev-xxx.us.auth0.com/
```

### Full key reference

| Key | Type | Default | Description |
|---|---|---|---|
| `auth.secret` | `string` | — | Shared HMAC secret. Mutually exclusive with `auth.jwksUri`. |
| `auth.jwksUri` | `string` | — | Public JWKS endpoint URL for asymmetric verification. Mutually exclusive with `auth.secret`. |
| `auth.audience` | `string \| string[]` | — | Optional. When set, every token's `aud` claim must match. |
| `auth.issuer` | `string` | — | Optional. When set, every token's `iss` claim must match. |
| `auth.algorithms` | `string[]` | `['HS256']` for secret, `['RS256']` for jwksUri | Pinned allow-list of accepted algorithms. Prevents the `alg: none` attack and guards against JWKS providers that mix algorithms. |
| `auth.exclude` | `string \| string[]` | `[]` | Path prefixes that bypass the Bearer-token check. Matched via `path.startsWith(prefix)`. |

If neither `auth.secret` nor `auth.jwksUri` is set, the middleware logs a warning and calls `next()` without authentication. The REST API generator attaches the `'auth'` middleware automatically to every route it produces when **either** key is set — except for routes whose collection declares `access.{op}: 'public'` (see below).

---

## Expected Token Shape

This middleware is transport-neutral about claims — any valid JWT verifies. For RBAC integration, downstream generators look at `payload.role` (string or string[]). A typical payload:

```json
{
  "sub": "user-123",
  "role": "admin",
  "iat": 1700000000,
  "exp": 1700003600
}
```

Mint tokens with any standard library, e.g.:

```typescript
import jwt from 'jsonwebtoken';
const token = jwt.sign(
    { sub: 'user-1', role: 'admin' },
    process.env.JEX__AUTH__SECRET!,
    { expiresIn: '1h' }
);
```

Then send it as `Authorization: Bearer <token>`.

---

## Schema-Driven Access Control

`middleware-auth` handles **authentication** only ("who are you?"). Authorization ("can you perform this operation?") is declared on each `ModelSchema` and enforced by the API generators:

```typescript
// models/posts.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        id: types.id(),
        title: types.string({ required: true }),
        body: types.string(),
    },
    access: {
        read: 'public',                  // anonymous allowed; auth middleware is stripped from this route
        create: 'admin',                 // requires a valid JWT with role === 'admin'
        update: ['admin', 'editor'],     // any listed role is sufficient
        delete: 'admin',
    },
});
```

| Rule value | Behavior |
|---|---|
| `undefined` | No authorization check. Auth middleware still runs if `auth.secret` is set. |
| `'public'` | Anonymous traffic allowed. REST routes have the `'auth'` middleware stripped entirely. |
| `string` / `string[]` | Requires a verified JWT whose `role` claim matches (intersection for arrays). |
| `'owner'` | Reserved for row-level security. Not implemented — throws at runtime. |

On denial, generators return:

- REST — `401` (missing/invalid payload) or `403` (role mismatch).
- GraphQL — `GraphQLError` with `extensions.code = 'UNAUTHENTICATED' | 'FORBIDDEN'`.

---

## GraphQL Caveat

`/graphql` is a single endpoint, so `middleware-auth` cannot selectively protect individual operations. In practice:

- If any of your GraphQL collections are truly public, add `/graphql` to `JEX__AUTH__EXCLUDE`. Resolver-level rules still enforce `role` checks on protected operations.
- Otherwise the middleware gates the endpoint as today; resolvers layer role checks on top.

---

## Installation

This plugin is auto-discovered by the JSON Express CLI when listed in your `package.json` dependencies:

```bash
npm install @json-express/middleware-auth
```

Set `JEX__AUTH__SECRET` and it is applied to every route generated by `api-rest` / `api-graphql` unless explicitly excluded.

---

## Architecture Note

```
Request → [auth middleware] → 401 / 403 (short-circuit)
                        ↓ on success
       sets req.headers['x-user-payload']
                        ↓
            [validation middleware]
                        ↓
          [api-rest / api-graphql handler]
              └─ evaluateAccess(schema.access[op], x-user-payload)
                    ├─ allowed → db call
                    └─ denied  → 401 / 403 (or GraphQLError)
```

The middleware is deliberately narrow — it only authenticates. All authorization logic lives in `@json-express/core`'s `evaluateAccess` helper and is invoked by the API generators, keeping this package free of business rules.
