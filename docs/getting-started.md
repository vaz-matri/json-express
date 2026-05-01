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

### 1. Install the CLI

```bash
npm install -g @json-express/cli
```

### 2. Create a data file

```bash
mkdir my-api && cd my-api
```

Create `posts.json`:

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

JSONExpress auto-discovers every `.json` file in the directory and creates a collection for each one.

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

### 1. Install core and CLI

```bash
npm install @json-express/core @json-express/cli
```

### 2. Define your first model

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

### 3. Start and test

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

*Full user accounts, JWT tokens, protected routes — from two package installs.*

### 1. Add the identity plugin

```bash
npm install @json-express/plugin-identity @json-express/middleware-auth
```

### 2. Set your secret

Create a `.env` file:

```bash
JEX__AUTH__SECRET=your-secret-key-min-32-chars
```

The double-underscore (`__`) is the Docker-safe nested key separator. `JEX__AUTH__SECRET` maps to `{ auth: { secret: "..." } }` in the config.

### 3. Start the server

```bash
npx json-express
# Server started on http://localhost:3000
# Auth routes: POST /auth/register, /auth/login, /auth/refresh, /auth/logout
```

`plugin-identity` automatically registers five schemas (users, roles, refreshTokens, emailVerificationTokens, passwordResetTokens) and mounts the `/auth/*` route group. No manual route writing.

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

- [Schemas & Models](/schemas) — field types, relations, hooks, and access control in depth
- [Database Adapters](/adapters) — swap to `adapter-json` for file persistence, or wait for Postgres
- [Architecture](/architecture) — understand the kernel, IoC container, and plugin lifecycle
- [Identity & Auth](/identity) — refresh token rotation, JWKS, email verification, and more
