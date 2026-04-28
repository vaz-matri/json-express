---
layout: home
title: JSON Express - Enterprise Headless CMS Meta-Framework
description: Go from a pure JSON file to an Enterprise GraphQL and REST API in 0 seconds. A blazingly fast, highly pluggable meta-framework for Node.js.

hero:
  name: "JSON Express"
  text: "The Next-Gen API Engine"
  tagline: "Go from a pure JSON file to an Enterprise GraphQL and REST API in 0 seconds. Scale to strict TypeScript models, native identity management, and pluggable databases when you need it."
  image:
    src: /logo.png # (Placeholder, we can add a real logo later)
    alt: JSON Express Logo
  actions:
    - theme: brand
      text: Get Started in 1 Minute
      link: /guide/getting-started
    - theme: alt
      text: Zero-Config JSON Mode
      link: /guide/json-mode

features:
  - icon: ⚡️
    title: Zero-Config JSON Inference
    details: Drop a pure JSON file into your data folder. The framework automatically infers a strict schema and instantly generates a production API.
  - icon: 🛠️
    title: Eject to TypeScript
    details: Prototype with JSON, then smoothly scale to strict TypeScript schemas when you need lifecycle hooks, relations, or field-level security.
  - icon: 🔌
    title: Pluggable Databases
    details: Swap between local Memory, JSON files, MySQL, or Postgres without rewriting a single line of your application logic.
  - icon: 🛡️
    title: Enterprise Security
    details: Built-in Identity management with field-level access control, Argon2 hashing, and instant JWT revocation.
  - icon: 🚀
    title: Dual API Generation
    details: Define your schema once and instantly get both REST and fully-typed GraphQL endpoints that automatically resolve N+1 query problems.
  - icon: 🚄
    title: Transport Agnostic
    details: Prefer Fastify over Express? Swap the transport plugin. Your API endpoints remain completely untouched.
---

<div class="custom-home-content">

## Show, Don't Tell

Building an enterprise-grade backend shouldn't require thousands of lines of boilerplate. With JSON Express, you declaratively define your data, and the kernel handles the routing, database joins, and security.

### 1. Define your Model
Create a simple TypeScript file to enforce strict validation and security rules.

```typescript
// models/users.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'users',
    access: {
        read: 'public',
        create: 'admin',
        update: 'owner'
    },
    fields: {
        id: types.id(),
        email: types.string({ unique: true }),
        passwordHash: types.string({ access: { read: false } }) // Never leaked!
    }
});
```

### 2. Instantly Get Production APIs
The moment you save, JSON Express generates a fully functional REST and GraphQL engine, strictly enforcing your access rules.

```http
# REST Example (Resolving Relations)
GET /api/v1/users/1?_expand=posts

# GraphQL Example
query {
  user(id: "1") {
    id
    email
    # passwordHash is physically impossible to query
  }
}
```

---

## The Pluggable Ecosystem

JSON Express is a **Meta-Framework**. Its true power lies in its modular architecture. You only install the pieces you need, keeping your deployment blazingly fast and perfectly tailored to your infrastructure.

*   **Transports:** `@json-express/transport-express`, `@json-express/transport-fastify`
*   **Databases:** `@json-express/adapter-memory`, `@json-express/adapter-json`, *(Postgres & MySQL coming soon)*
*   **Generators:** `@json-express/api-rest`, `@json-express/api-graphql`
*   **Background Services:** `@json-express/kv-redis`, `@json-express/queue-bullmq`
*   **Documentation:** `@json-express/docs-swagger`, `@json-express/docs-light`

---

## Frequently Asked Questions

**Is JSON Express a Database?**<br/>
No. It is a highly optimized execution engine that sits between your HTTP server and your database. It translates network requests into database commands using Adapters.

**Can I write custom Express/Fastify routes?**<br/>
Absolutely. You can define custom `endpoints` directly inside your schemas. You have full access to the underlying `req` and `res` objects.

**How does it handle Authentication?**<br/>
The `@json-express/plugin-identity` provides a complete Zero-Knowledge auth flow. It traps passwords, hashes them with Argon2, and issues highly secure, revocable JWTs.
</div>

<style>
.custom-home-content {
  max-width: 960px;
  margin: 0 auto;
  padding: 4rem 2rem;
}
.custom-home-content h2 {
  font-size: 2.2rem;
  font-weight: 700;
  margin-top: 4rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid var(--vp-c-divider);
  padding-bottom: 1rem;
}
.custom-home-content h3 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
.custom-home-content p, .custom-home-content li {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}
</style>
