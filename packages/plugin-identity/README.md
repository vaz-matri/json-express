# `@json-express/plugin-identity`

> **Local identity plugin for JSON Express v2.**
> Auto-injects `users` / `roles` / token schemas, mounts `/auth/*` endpoints, hashes passwords with argon2id, and ships a self-seeding admin account — so you can clone, install, set a secret, and have working auth in two minutes.

---

## What It Does

`middleware-auth` is the **Border Patrol** (verifies tokens). `plugin-identity` is the **Passport Office** (issues them). They communicate solely through the JWT payload shape — neither imports the other.

Installing this plugin:

1. Contributes three (or five, with email) schemas to your project before the API generators see collections — no boilerplate `users.json` to maintain.
2. Creates an `admin@local` user on first boot if `users` is empty, generates a secure random password, and prints it once to the logs.
3. Mounts `POST /auth/login`, `/register`, `/refresh`, `/logout`, and `/password/change` directly via the transport (these intentionally bypass the auth middleware — gating `/login` would be a chicken-and-egg problem).
4. When an `email-*` provider is also installed (e.g. [`@json-express/email-console`](../email-console)), additionally mounts `POST /auth/verify`, `/auth/verify/resend`, `/auth/password/forgot`, and `/auth/password/reset`.

---

## Installation

```bash
npm install @json-express/plugin-identity @json-express/middleware-auth
```

`middleware-auth` is a **peer dependency** — token issuance is useless without a verifier. The plugin throws at boot if it's missing:

```
@json-express/plugin-identity requires @json-express/middleware-auth to verify the tokens it issues.
```

For the email-dependent endpoints, also install an email provider:

```bash
npm install @json-express/email-console
```

---

## Configuration

Set in `.env` (`JEX` namespace; double underscore creates nested blocks):

```env
# Required — used to sign issued JWTs. Pair this with the same key in middleware-auth.
JEX__AUTH__SECRET=a-strong-32-byte-secret

# Optional — token lifetimes
JEX__AUTH__TOKEN_TTL=1h          # access-token TTL (jsonwebtoken duration syntax)
JEX__AUTH__REFRESH_TTL=30d       # refresh-token rotation window
JEX__AUTH__VERIFY_TTL=24h        # email verification link TTL
JEX__AUTH__RESET_TTL=30m         # password-reset link TTL

# Optional — registration policy
JEX__AUTH__ALLOW_REGISTRATION=true       # set to 'false' to disable /auth/register
JEX__AUTH__DEFAULT_ROLE=user             # role assigned to new accounts
JEX__AUTH__MIN_PASSWORD_LENGTH=8
JEX__AUTH__REQUIRE_VERIFIED_EMAIL=false  # strict mode (see below)

# Optional — email branding (only used when an email provider is registered)
JEX__AUTH__EMAIL__APP_NAME=My App
JEX__AUTH__EMAIL__VERIFY_URL=https://my-app.example/auth/verify
JEX__AUTH__EMAIL__RESET_URL=https://my-app.example/auth/password/reset
JEX__AUTH__EMAIL__FROM=no-reply@my-app.example
```

---

## Endpoints

| Method | Path | Auth | Behavior |
|---|---|---|---|
| `POST` | `/auth/register` | none | Create a user. Soft mode: returns `{ accessToken, refreshToken, user }`. Strict mode: returns `{ user, message }` only — sender must verify before logging in. |
| `POST` | `/auth/login` | none | Returns `{ accessToken, refreshToken, user }`. Generic 401 on any failure (no enumeration). 403 in strict mode if `emailVerified === false`. |
| `POST` | `/auth/refresh` | refresh token in body | Rotates: revokes the used token, issues a new pair. |
| `POST` | `/auth/logout` | refresh token in body | Revokes the refresh token. Idempotent — 200 even on unknown tokens. |
| `POST` | `/auth/password/change` | Bearer access token | Verifies `currentPassword`, sets `newPassword`, **revokes ALL refresh tokens** for the user. |
| `POST` | `/auth/verify` | none | Consumes a verification token, sets `users.emailVerified = true`. *(requires email provider)* |
| `POST` | `/auth/verify/resend` | none | Sends a new verification email. Anti-enumerating: 200 even for unknown emails. *(requires email provider)* |
| `POST` | `/auth/password/forgot` | none | Sends a password-reset email. Anti-enumerating: 200 whether the email exists or not. *(requires email provider)* |
| `POST` | `/auth/password/reset` | none | Consumes a reset token, updates the password, **revokes ALL refresh tokens** for the user. *(requires email provider)* |

---

## JWT payload shape

Issued tokens carry exactly the claims the schema-driven access engine reads:

```json
{
  "sub": "<user.id>",
  "role": "admin",
  "email": "alice@example.com",
  "emailVerified": true,
  "iat": 1700000000,
  "exp": 1700003600
}
```

`sub` is what `evaluateAccess` uses for `'owner'` checks. `role` is what role-based rules match. `emailVerified` lets your app gate features client-side.

---

## Schemas

| Collection | Purpose | Access defaults |
|---|---|---|
| `users` | One row per account; `passwordHash` field is admin-only via field-level access. | `read: 'admin'`, `update: 'owner'`, `create`/`delete: 'admin'` |
| `roles` | Placeholder for future role-permission expansion. Currently unused — `users.role` is a string. | All ops `'admin'` |
| `refreshTokens` | One row per active session; `tokenHash` stored, `revoked` flag soft-deletes. | All ops `'admin'` |
| `emailVerificationTokens` | Single-use, deleted on consumption. | All ops `'admin'` |
| `passwordResetTokens` | Single-use, deleted on consumption. 30-min default TTL. | All ops `'admin'` |

User-defined schemas with the same names take precedence — the plugin logs a warning and skips its own version.

---

## Modes

### Soft (default — `auth.requireVerifiedEmail=false`)

`/auth/register` returns tokens immediately. The JWT carries `emailVerified: false`. Apps gate features client-side. Verification emails are sent if a provider is configured but logging in does not require them.

### Strict (`auth.requireVerifiedEmail=true`)

`/auth/register` does **not** return tokens. `/auth/login` returns 403 until the user clicks the verification link. Use `/auth/verify/resend` to mail a fresh link.

---

## Security defaults

- **Argon2id** (memory=64MB, iterations=3) for password hashing. Modern OWASP recommendation; node-gyp prebuilds available for darwin/linux/win.
- **Refresh-token rotation** — every `/auth/refresh` revokes the used token and issues a new pair. Replay of the old token returns 401.
- **All sessions revoked on password change or reset** — defense against token theft preceding the change.
- **Anti-enumeration** — `/auth/login`, `/auth/password/forgot`, `/auth/verify/resend`, `/auth/logout` all return identical responses regardless of whether the email/token exists.
- **Algorithm-pinned tokens** — issuance uses `HS256` by default (or whatever you set on `auth.algorithms`). Prevents the `alg: none` attack at the verifier.

---

## Auto-seeded admin

On the first boot where `users` is empty, the plugin creates:

```
email:    admin@local
password: <random 16-char base64url>
role:     admin
```

The password is logged once during the `onReady` phase, framed in a hard-to-miss panel. **It is not stored anywhere recoverable** — copy it from the logs immediately, or delete the user and re-bootstrap. Subsequent boots skip seeding.

---

## Architecture notes

This plugin is registered as a **lifecycle plugin** (`IPlugin`). Its `provideSchemas()` contributes the five collections above; `onBoot` registers all routes directly against the resolved transport. Routes registered this way bypass the kernel's middleware-composition step, which is the desired behavior for `/auth/*` (they're either public or self-verify their Bearer token).

`/auth/password/change` is the one authenticated endpoint registered this way — it self-verifies the Bearer token via `createJwtVerifier(...)` (built from the same config `middleware-auth` uses), so JWKS-backed projects work transparently.
