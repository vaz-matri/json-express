---
title: Identity & Auth Plugin
description: Secure your JSONExpress APIs with enterprise-grade identity management, Argon2 password hashing, and asymmetric JWT validation.
---

# Identity & Auth

The `@json-express/plugin-identity` package transforms JSONExpress from an open API into a highly secure, zero-trust backend. It provides automated user provisioning, state-of-the-art password hashing, and highly configurable JWT workflows out of the box.

## Core Features

When you register the Identity plugin in your `json-express` config, it automatically:
1. **Injects a Secure `users` Model:** It registers a strict `users` schema that explicitly blocks `passwordHash` and `tokenVersion` from ever leaving the server in API responses.
2. **Registers Cryptographic Hooks:** It attaches `beforeCreate` and `beforeUpdate` hooks to intercept any incoming passwords, strips them from the raw database payload, and heavily hashes them using **Argon2** before storage.
3. **Generates Authentication Endpoints:** It mounts `/auth/login`, `/auth/refresh`, and `/auth/reset-password` endpoints.

---

## The Zero-Knowledge Provisioning Flow

We built the Identity plugin with enterprise security in mind. Therefore, **plain-text passwords are never accepted via generic REST `POST` or `PATCH` requests.**

Instead, we use a Zero-Knowledge Provisioning flow:
1. An admin creates a new user via `POST /users`, providing only their `email` and `role`. 
2. The user is created with a `requirePasswordReset: true` flag.
3. A unique, TTL-bound reset token is generated and stored in the high-performance Key-Value store (`IKvStore`).
4. An email is dispatched asynchronously via the Task Queue (`IQueueAdapter`).
5. The user clicks the link and submits their password directly to the specialized `/auth/reset-password` endpoint, which performs the Argon2 hashing.

This guarantees that administrators and API logs are never exposed to user passwords.

---

## JWT Verification & Security

The Identity plugin partners seamlessly with `@json-express/middleware-auth` to protect your generated APIs. 

### Symmetric vs Asymmetric Keys
You can configure the authentication middleware to use standard HMAC secrets for local development, or enterprise-grade asymmetric keys (JWKS) for production.

```typescript
// Example json-express configuration
export default {
    auth: {
        // Local Development (HMAC)
        secret: process.env.JWT_SECRET,
        
        // Production (Asymmetric JWKS - e.g. AWS Cognito, Auth0)
        // jwksUri: 'https://your-tenant.us.auth0.com/.well-known/jwks.json',

        // Exclude specific public paths from the Auth Gate
        exclude: ['/auth/login', '/public/products']
    }
}
```

### The `tokenVersion` Pattern (Instant Revocation)
Traditional JWTs cannot be revoked without a centralized blacklist, defeating the purpose of stateless authentication. 

JSONExpress solves this using the `tokenVersion` pattern. Every user record has an integer `tokenVersion` (which is excluded from REST responses). When a JWT is issued, this integer is stamped inside the payload. 

If a user's account is compromised, an admin simply increments their `tokenVersion` in the database. The `middleware-auth` instantly rejects all previously issued JWTs because their stamped version no longer matches the database version.

---

## Root Admin Auto-Seeding

To prevent the "chicken and egg" problem of provisioning the first user on a fresh database deployment, the Identity plugin automatically checks if the `users` collection is empty on boot. 

If it is, it automatically seeds a Root Admin user utilizing credentials provided via environment variables:

```bash
ROOT_ADMIN_EMAIL="admin@json-express.dev"
ROOT_ADMIN_PASSWORD="super-secure-initial-password"
```

> [!WARNING]
> Do not leave `ROOT_ADMIN_PASSWORD` in your production environment variables after the initial deployment. It is only required for the first boot sequence.

---

## Common Questions

### Where are Refresh Tokens stored?
Refresh tokens, email verification tokens, and password reset tokens are **not** stored in your primary database (MySQL, Postgres, etc.). They are highly ephemeral and are stored exclusively in the `IKvStore` (e.g., `@json-express/kv-redis`). This prevents your primary database from filling up with expired garbage data and offloads TTL-expiration to native Redis commands.

### Can I use Auth0 or Firebase instead?
Yes. If you provide a `jwksUri` in the configuration, JSONExpress will bypass the local `/auth/login` strategy entirely and act as a pure Resource Server, trusting the JWTs issued by your external Identity Provider.
