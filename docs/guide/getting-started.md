---
title: Getting Started with JSONExpress — API in 30 Seconds
description: Build a complex E-Commerce backend from scratch. Start with local JSON files, then scale to Postgres and Redis without rewriting any code.
---

# Getting Started

JSONExpress is built around a single, powerful philosophy: **Zero-Code Prototyping, Enterprise Scaling.**

In this tutorial, we are going to build a functional **E-Commerce API** from scratch. We will start with a simple mock server running on JSON files, and progressively evolve it into a robust production backend running on Postgres and BullMQ—*without rewriting a single line of business logic*.

## Prerequisites

- Node.js 18+
- npm or pnpm

---

## Stage 1: The Local Mock Server

*When starting a new project, you don't want to mess with databases or migrations. You just need an API and some fake data.*

### 1. Install the Mock Server Preset

```bash
mkdir ecommerce-api && cd ecommerce-api
npm init -y
npm install @json-express/preset-mock-server
```

`@json-express/preset-mock-server` bundles everything you need to prototype instantly: local JSON persistence, a REST API generator, and the Faker seeder plugin.

### 2. Create your E-Commerce Data

Create a `data/` directory and drop in a `products.json` file.

```bash
mkdir data
```

```json
// data/products.json
[
  {
    "id": "prod_1",
    "name": "Mechanical Keyboard",
    "price": 120,
    "stock": 50
  }
]
```

### 3. Start the Server

```bash
npx json-express
# Server started on http://localhost:3000
# Collections: products (1 record)
```

**JSONExpress just inferred your schema.** Without any configuration, you now have a full CRUD API.

Try fetching your products:
```bash
curl http://localhost:3000/products
```

### 4. Seed 100 Fake Products

Because you installed the `preset-mock-server`, the seeder is automatically active. Let's ask it to generate 100 realistic products matching the exact schema it inferred from your `prod_1` object!

```bash
curl -X POST "http://localhost:3000/products/_seed?count=100"
```
Instantly, your `data/products.json` file on disk is populated with 100 randomized products.

---

## Stage 2: Ejecting to TypeScript

*Your prototype is a success. Now, you need to add a Shopping Cart and enforce strict validation constraints.*

Raw JSON files are great for speed, but they can't define relational links or complex validations. Let's **eject** our `products` to a TypeScript model.

### 1. Define the Schema

Create a `models/` directory, and create `models/products.ts`:

```typescript
// models/products.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
  fields: {
    id: types.id(),
    name: types.string({ required: true, minLength: 3 }),
    price: types.number({ min: 0 }),
    stock: types.number({ default: 0 })
  }
});
```

Create a new model for user carts, `models/carts.ts`:

```typescript
// models/carts.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
  fields: {
    id: types.id(),
    userId: types.string({ required: true }),
    productId: types.string({ required: true }),
    quantity: types.number({ min: 1, default: 1 }),
    
    // Add a relational link to the products collection!
    product: types.relation({ target: 'products', type: 'many-to-one', foreignKey: 'productId' })
  }
});
```

Restart `npx json-express`. The framework prioritizes the `models/` folder over the `data/` folder. Your API is now strictly validated. If you try to `POST /products` with a negative price, it will be rejected!

---

## Stage 3: Advanced Business Logic

*You want to add an endpoint to let users purchase a product. This requires deducting stock (Database), sending an email receipt (Queue), and rate-limiting the purchases (KV Cache).*

JSONExpress provides native `ctx.queue` and `ctx.kvStore` interfaces right inside your models. 

Update `models/products.ts` to include a custom endpoint:

```typescript
// models/products.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
  fields: {
    id: types.id(),
    name: types.string(),
    price: types.number(),
    stock: types.number()
  },
  endpoints: {
    // Add a custom 'Buy' endpoint
    'POST /:id/buy': async (req, res, ctx) => {
        const id = req.params.id;

        // 1. Rate Limit using the KV Store
        const attempts = (await ctx.kvStore?.get(`rate:${id}`)) || 0;
        if (attempts >= 5) return res.status(429).json({ error: 'Too many attempts' });
        await ctx.kvStore?.set(`rate:${id}`, attempts + 1, { ttlMs: 60000 });

        // 2. Update Database
        const product = await ctx.db.getById('products', id);
        await ctx.db.update('products', id, { stock: product.stock - 1 });

        // 3. Enqueue Background Task
        await ctx.queue?.enqueue('emails', 'send-receipt', { product: product.name });

        res.status(200).json({ success: true });
    }
  }
});
```

Because you are using `preset-mock-server`, the KV Store and Queue are automatically backed by Node's local RAM. It "just works" locally!

---

## Stage 4: Deploying to Production

*Your E-Commerce API is feature-complete. It's time to go live.*

You cannot run a high-traffic API on local JSON files and RAM queues. You need Postgres and Redis.

In traditional frameworks, this means rewriting your data access layer. In JSONExpress, you simply swap dependencies.

1. **Install the Production Adapters**
```bash
npm install @json-express/adapter-postgres @json-express/queue-bullmq @json-express/kv-redis
```

2. **Configure your `.env` File**
```bash
# Tell JSONExpress to use Postgres instead of JSON files
jex.adapter=@json-express/adapter-postgres
jex.adapter-postgres.connectionString=postgres://user:pass@remote-host/db

# Tell JSONExpress to use Redis for background tasks and rate limits
jex.queue=@json-express/queue-bullmq
jex.kv=@json-express/kv-redis
jex.kv-redis.connectionString=redis://remote-host:6379
```

3. **Migrate and Run**
```bash
npx json-express migrate
npx json-express
```

**That's it.** JSONExpress automatically scanned your `products.ts` and `carts.ts` models, generated the SQL `CREATE TABLE` statements, and mapped your `ctx.kvStore` and `ctx.queue` commands to your Redis cluster. 

You built a production E-Commerce backend in minutes.

---

## What's Next

- [Zero-Config JSON Mode](/guide/json-mode) — Deep dive into how inference works.
- [Database Adapters](/guide/adapters) — Learn how to configure robust database connections.
- [Identity & Auth](/guide/identity) — Add user registration and JWT authentication in one command.
- [Deploying to Production](/guide/deployment) — Step-by-step guides for Docker and Railway.
