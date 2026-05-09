---
title: "JSONExpress vs json-server — The Modern Alternative (2026)"
description: "json-server is perfect for 30 seconds of prototyping. JSONExpress is what you reach for when you need persistence, TypeScript, auth, and a real database — without starting over."
---

# JSONExpress vs json-server

json-server has ~75,000 GitHub stars and is referenced in hundreds of tutorials on freeCodeCamp, DEV.to, and YouTube. It earns that position — its tagline is "Get a full fake REST API with zero coding in less than 30 seconds," and it delivers exactly that. For a huge category of use cases, it is the right tool and nothing here is meant to change that.

This page is about what happens when you hit the wall json-server was never designed to handle: persistent data, TypeScript schemas, authentication, GraphQL, or a real database. At that point you have two options — throw away your work and start over with Express from scratch, or reach for something that was built to grow with you. JSONExpress is the json-server alternative for that moment.

---

## When json-server is the right choice

json-server is genuinely excellent in these situations — use it:

- **You need something running in 30 seconds.** json-server is still the fastest path from zero to a CRUD API.
- **Your team already knows it.** There are hundreds of tutorials, Stack Overflow answers, and freeCodeCamp guides. Onboarding is instant.
- **You need no persistence.** Testing, demos, and throwaway prototypes where data can reset on every restart.
- **You're teaching a class.** json-server's simplicity makes it ideal for workshops where the goal is frontend development, not backend architecture.

---

## When you outgrow json-server

json-server hits a hard ceiling the moment any of these become true:

**Data disappears on restart.** json-server's `db.json` file writes are not atomic — there is no debouncing, no write safety, and no guarantee of consistency under concurrent writes. For anything beyond a local demo, this is a reliability problem.

**You need authentication.** There is a community plugin (`json-server-auth`) with ~2,000 weekly downloads, but it is not maintained by the json-server team and does not support JWT standards like JWKS, RS256, or refresh token rotation.

**You need TypeScript schemas.** json-server has no concept of field types, required fields, unique constraints, default values, or access control. You cannot define that `email` is unique, that `published` defaults to `false`, or that only admins can delete records.

**You need GraphQL.** json-server is REST-only. There is no GraphQL support and no path to add it.

**You need a real database.** json-server runs entirely in memory (with optional `db.json` file writes). There is no adapter for Postgres, MongoDB, SQLite, or any other database.

**You need transport flexibility.** json-server is built on Express and cannot be swapped to Fastify or any other server.

---

## Side-by-side comparison

| Feature | json-server | JSONExpress |
|---|---|---|
| REST API from JSON file | ✅ | ✅ |
| Zero-config start | ✅ | ✅ |
| Data persists across restarts | ⚠️ db.json (no atomicity) | ✅ adapter-json (atomic writes) |
| Real database (Postgres, Mongo) | ❌ | ✅ (roadmap) |
| TypeScript schema definitions | ❌ | ✅ |
| GraphQL API | ❌ | ✅ api-graphql |
| Authentication / JWT | ❌ (community plugin only) | ✅ plugin-identity |
| Zod validation | ❌ | ✅ middleware-validation |
| Swap HTTP server | ❌ Express only | ✅ Express or Fastify |
| Swagger / OpenAPI docs | ❌ | ✅ docs-swagger |
| Active development | ⚠️ v1 beta 3+ years | ✅ |
| License | MIT | MIT |
| GitHub stars | ~75,000 | Early stage |
| npm weekly downloads | ~328,000 | Early stage |

---

## Migrating from json-server

A `db.json` file from json-server is already valid input for JSONExpress. The only difference is that json-server uses a single object with collection keys, while JSONExpress reads one file per collection.

**Your existing json-server `db.json`:**

```json
{
  "posts": [
    { "id": 1, "title": "Hello", "published": true },
    { "id": 2, "title": "World", "published": false }
  ],
  "users": [
    { "id": 1, "name": "Alice" }
  ]
}
```

**Split into individual files:**

```bash
# posts.json — just the array, no wrapper object
[
  { "id": "1", "title": "Hello", "published": true },
  { "id": "2", "title": "World", "published": false }
]

# users.json — same pattern
[
  { "id": "1", "name": "Alice" }
]
```

**Install and run:**

```bash
npm install @json-express/cli

npx json-express
# Server started on http://localhost:3000
# Collections: posts (2 records), users (1 record)
```

All endpoints are available immediately at the same URL structure (`GET /posts`, `GET /posts/1`, `POST /posts`, etc.). Your frontend code does not change.

---

## The upgrade path after migration

Once you are running on JSONExpress, each upgrade is a single install — no code changes:

**Add file persistence** so data survives restarts:

```bash
npm install @json-express/adapter-json
```

```bash
# .env
JEX.ADAPTER=@json-express/adapter-json
```

**Add full authentication** — register, login, JWT, refresh tokens:

```bash
npm install @json-express/plugin-identity @json-express/middleware-auth
```

```bash
# .env
JEX__AUTH__SECRET=your-secret-key-min-32-chars
```

**Add a GraphQL endpoint** alongside your existing REST routes:

```bash
npm install @json-express/api-graphql
# Auto-discovered. REST still works. GraphQL available at /graphql.
```

Each of these installs wires itself up automatically. Your schemas, hooks, and existing routes do not change.

---

## Summary

json-server solves the problem it was designed for brilliantly. If you need a fake REST API in 30 seconds with no other requirements, it remains the best tool for that job.

JSONExpress is the json-server alternative for when that stops being enough — when you need data that persists, a real authentication system, TypeScript types, or a path to a production database. You get the same zero-config start on day one, and the upgrade path json-server does not have on day one hundred.

---

**Ready to try it?** [Get started in 60 seconds →](/getting-started)
