---
title: Getting Started with JSONExpress — API in 30 Seconds
description: Install JSONExpress, drop a JSON file, and get a full CRUD REST API running in under 30 seconds. Then add TypeScript schemas, a real database, and auth — without rewriting anything.
---

# Getting Started

JSONExpress turns a JSON file into a running REST and GraphQL API with zero configuration. When you outgrow it, you add TypeScript schemas, swap in a real database, or wire up authentication — without rewriting anything you already built.

## Prerequisites

- Node.js 18+
- npm or pnpm

---

## Option A — Zero-Config JSON Mode

*The fastest path to a running API. No TypeScript, no config file, no setup.*

### 1. Create a project and install the boot preset

```bash
mkdir my-api && cd my-api
npm init -y
npm install @json-express/boot
```

`@json-express/boot` is a [dependency-only preset](/guide/presets) that bundles the recommended stack: in-memory adapter, Express transport, REST API, console logger, and `/docs`. It is the only package you need for the quickstart. The runtime entrypoint — `npx json-express` — is shipped by `@json-express/core` (which `boot` pulls in transitively).

### 2. Create a data file

```bash
mkdir data
```

Create `data/posts.json`:

```json
[
  {"id":"1","title":"Hello JSONExpress","published":true},
  {"id":"2","title":"Building APIs the easy way","published":true},
  {"id":"3","title":"Draft post","published":false}
]
```

### 3. Start the server

```bash
npx json-express
# Server started on http://localhost:3000
# Collections: posts (3 records)
```

JSONExpress scans `./data/` for JSON files and creates a collection from each one.

### 4. Use the API

**List all posts:**

```bash
curl http://localhost:3000/posts
# [{"id":"1","title":"Hello JSONExpress","published":true},{"id":"2",...},{"id":"3",...}]
```

**Get a single post:**

```bash
curl http://localhost:3000/posts/1
# {"id":"1","title":"Hello JSONExpress","published":true}
```

**Create a post:**

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Second post","published":false}'
# {"id":"2","title":"Second post","published":false}
```

**Update a post:**

```bash
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"published":true}'
# {"id":"1","title":"Hello JSONExpress","published":true}
```

**Delete a post:**

```bash
curl -X DELETE http://localhost:3000/posts/1
# 204 No Content
```

That's the full CRUD surface — all from a single JSON file.

---

## Option B — TypeScript Schema Mode

*For when you need types, validation, field-level access control, and auto-generated GraphQL.*

### 1. Define your first model

Create `models/posts.ts`:

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
  name: 'posts',
  fields: {
    id: types.id(),
    title: types.string({ required: true, unique: true }),
    published: types.boolean({ default: false }),
    views: types.number({ default: 0 })
  },
  access: {
    read: 'public',
    create: 'admin',
    update: 'owner',
    delete: 'admin'
  }
});
```

The `access` block is field-level security — it controls which roles can call each operation. `'public'` means no token required. `'admin'` and `'owner'` are enforced automatically by the auth middleware when installed.

If a TypeScript model and a JSON file share the same name, the model wins.

### 2. Start and test

```bash
npx json-express
# Server started on http://localhost:3000
# Collections: posts
```

```bash
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"My first typed post"}'
# {"id":"1","title":"My first typed post","published":false,"views":0}

curl http://localhost:3000/posts
# [{"id":"1","title":"My first typed post","published":false,"views":0}]
```

Default values (`published: false`, `views: 0`) are applied automatically. Sending a duplicate `title` will return a `409 Conflict` because of `unique: true`.

---

## Option C — With Authentication

*Full user accounts, JWT tokens, protected routes — from one preset install.*

### 1. Add the identity preset

```bash
npm install @json-express/preset-identity
```

This dependency-only preset installs `plugin-identity`, `middleware-auth`, `email-console`, `kv-memory`, and `queue-memory` in one step.

### 2. Set your secret

Create a `.env` file:

```bash
jex.auth.secret=your-secret-key-min-32-chars
jex.auth.exclude=/auth
```

`jex.auth.exclude` tells the auth middleware not to require a token for `/auth/*` itself (so registration and login work). Lowercase `jex.*` is preferred. `JEX__AUTH__SECRET` (uppercase, double-underscore) is the same key, accepted as a fallback for cloud platforms that forbid dots or lowercase env vars.

### 3. Start the server

```bash
npx json-express
# Server started on http://localhost:3000
# Auth routes: POST /auth/register, /auth/login, /auth/refresh, /auth/logout, …
```

`plugin-identity` registers five schemas (users, roles, refreshTokens, emailVerificationTokens, passwordResetTokens) and mounts the `/auth/*` route group automatically.

### 4. Register, login, and make an authenticated request

**Register:**

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"securepassword"}'
# {"accessToken":"eyJ...","refreshToken":"eyJ...","user":{"id":"1","email":"alice@example.com","role":"user"}}
```

**Login:**

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"securepassword"}'
# {"accessToken":"eyJ...","refreshToken":"eyJ...","user":{...}}
```

**Authenticated request:**

```bash
curl http://localhost:3000/posts \
  -H "Authorization: Bearer eyJ..."
```

Routes with `access: { read: 'public' }` work without a token. Routes with `create: 'admin'` or `update: 'owner'` require a valid JWT — `middleware-auth` validates it automatically.

---

## What's Next

- [Presets](/guide/presets) — bundle a stack into a single npm package
- [Schemas & Models](/guide/schemas) — field types, relations, hooks, and access control in depth
- [Database Adapters](/guide/adapters) — swap to `adapter-json` for file persistence
- [Architecture](/guide/architecture) — understand the kernel, IoC container, and plugin lifecycle
- [Identity & Auth](/guide/identity) — refresh token rotation, JWKS, email verification, and more
