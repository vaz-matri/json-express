---
title: "@json-express/plugin-identity"
description: "Auto-discovered Identity plugin for JSONExpress — argon2 password hashing, JWT issuance, refresh token rotation, and email-based verification flows."
---

# @json-express/plugin-identity

> Official Identity & Auth plugin for JSONExpress.

`@json-express/plugin-identity` implements `IPlugin` and is **auto-discovered** by the `json-express` runtime. It contributes the `users` and `roles` schemas, mounts the `/auth/*` route group, hashes passwords with **argon2id**, issues JWTs, and rotates refresh tokens through the configured `IKvStore`. Verification, password-reset, and admin-flow emails are dispatched through the configured `IQueueAdapter` and `IEmailProvider` when both are present.

For the high-level architecture and the `tokenVersion` revocation pattern, see [Identity & Auth](/guide/identity).

## Installation

```bash
npm install @json-express/plugin-identity \
            @json-express/middleware-auth \
            @json-express/kv-memory \
            @json-express/queue-memory \
            @json-express/email-console
```

`middleware-auth` and an `IKvStore` are **required peers** — the plugin throws on boot without them. The queue and email provider are optional but needed for the verification and reset flows.

For a one-line install of the full identity stack, use the [`@json-express/preset-identity`](/guide/presets) preset, which depends on all five.

## Configuration

The plugin is constructed by the runtime as `new IdentityPlugin({ configProvider, logger })`. **You do not instantiate it manually.** All configuration comes from the config provider — typically `.env` parsed by [`@json-express/config-env`](/packages/config-env).

### Minimum `.env`

```bash
jex.auth.secret=a-strong-32-byte-secret
jex.auth.exclude=/auth
```

`jex.auth.exclude=/auth` tells [`middleware-auth`](/packages/middleware-auth) not to require a JWT on the auth endpoints themselves — registration and login would otherwise be unreachable.

### Full configuration reference

All keys live under `jex.auth.*`. Boolean and number values are parsed by the config provider; durations accept `ms`, `s`, `m`, `h`, `d` suffixes.

| Key | Type | Default | Effect |
|---|---|---|---|
| `jex.auth.secret` | string | – (**required**) | HMAC secret for signing access tokens. |
| `jex.auth.jwksUri` | string | – | JWKS endpoint URL — when set, `middleware-auth` validates with asymmetric keys. |
| `jex.auth.algorithms` | string[] | – | Restrict accepted JWT algorithms (e.g. `RS256`). |
| `jex.auth.tokenTtl` | duration | `1h` | Access token lifetime. |
| `jex.auth.refreshTtl` | duration | `30d` | Refresh token lifetime in the KV store. |
| `jex.auth.verifyTtl` | duration | `24h` | Lifetime of email verification tokens. |
| `jex.auth.resetTtl` | duration | `30m` | Lifetime of password-reset tokens. |
| `jex.auth.issuer` | string | – | JWT `iss` claim. |
| `jex.auth.audience` | string \| string[] | – | JWT `aud` claim. |
| `jex.auth.allowRegistration` | boolean | `true` | When `false`, `POST /auth/register` returns 403. |
| `jex.auth.defaultRole` | string | `user` | Role assigned to self-registered users. |
| `jex.auth.requireVerifiedEmail` | boolean | `false` | When `true`, login is rejected until email is verified. |
| `jex.auth.minPasswordLength` | number | `8` | Minimum password length enforced on register / change / reset. |
| `jex.auth.email.appName` | string | `JSON Express` | Used in email templates. |
| `jex.auth.email.verifyUrl` | string | `http://localhost:3000/auth/verify` | Link target placed in verification emails. |
| `jex.auth.email.resetUrl` | string | `http://localhost:3000/auth/password/reset` | Link target placed in password-reset emails. |
| `jex.auth.email.from` | string | – | `From:` header for outbound emails. |

## Mounted routes

The plugin registers the following routes on `kernel.boot()`:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/register` | Self-registration (gated by `allowRegistration`) |
| `POST` | `/auth/login` | Issue access + refresh tokens |
| `POST` | `/auth/refresh` | Rotate refresh token, issue new access token |
| `POST` | `/auth/logout` | Revoke the active refresh token |
| `POST` | `/auth/password/change` | Change password while authenticated |
| `POST` | `/auth/verify` | Confirm email via verification token (mounted only when an `IEmailProvider` is installed) |
| `POST` | `/auth/verify/resend` | Resend verification email |
| `POST` | `/auth/password/forgot` | Trigger password reset email |
| `POST` | `/auth/password/reset` | Set a new password using a reset token |

All `/auth/*` routes are public — gating `/login` behind the JWT verifier would be a chicken-and-egg problem. Add `/auth` to `jex.auth.exclude` in your env so the verifier skips them.

## The injected `users` schema

The plugin's `provideSchemas()` contributes a strict `users` schema. If a user-defined `models/users.ts` or `data/users.json` exists, the plugin's schema overrides it — this guarantees `passwordHash` and `tokenVersion` cannot leak through generated API responses.

```typescript
// internal — for reference only
defineModel({
    name: 'users',
    access: {
        read: 'public',
        create: 'admin',     // only admins can provision new users
        update: 'owner',
        delete: 'admin'
    },
    fields: {
        id: types.id(),
        email: types.string({ unique: true }),
        role: types.string({ default: 'user' }),
        emailVerified: types.boolean({ default: false }),
        // never exposed in API responses
        passwordHash: types.string({ access: { read: false } }),
        tokenVersion: types.number({ default: 0, access: { read: false } })
    }
});
```

## Admin auto-seeding

When the plugin boots and finds an empty `users` collection, it automatically creates an `admin@local` account with role `admin` and a randomly generated password. The password is logged once to the configured logger so you can copy it on first run. **Change it immediately via `POST /auth/password/change`.**

## Asynchronous email dispatching

When a queue **and** an email provider are both registered, password-reset and verification emails are enqueued on the `emails` topic and processed by a worker the plugin registers internally. Without a queue, the admin-flow falls back to a synchronous send. Without an email provider, the email-dependent endpoints simply do not mount.

```typescript
// internal — how the plugin enqueues
await queue.enqueue('emails', 'sendPasswordReset', {
    userId: record.id,
    email: record.email,
    token: rawToken
});
```

## Related

- [Identity & Auth](/guide/identity) — high-level architecture, `tokenVersion`, JWKS
- [@json-express/middleware-auth](/packages/middleware-auth) — required peer; verifies the tokens this plugin issues
- [@json-express/kv-memory](/packages/kv-memory) — required peer for refresh token storage in development
- [@json-express/queue-memory](/packages/queue-memory) — optional peer for async email dispatch
- [@json-express/email-console](/packages/email-console) — optional peer; prints emails to stdout (swap for SMTP / SES / SendGrid in production)
