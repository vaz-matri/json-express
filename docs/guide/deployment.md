---
title: Deploying to Production
description: Learn how to scale your JSONExpress mock server into a production backend using Docker, Postgres, and BullMQ.
---

# Deploying to Production

The superpower of JSONExpress is its swappable microkernel architecture. 

During development, you likely used `@json-express/preset-mock-server` to rapidly prototype using local JSON files and RAM. When it's time to deploy to production, you do not need to rewrite your models, custom endpoints, or hooks. 

You simply swap your dependencies and configure your `.env` file.

## 1. Install Production Adapters

First, install the robust infrastructure adapters:

```bash
npm install @json-express/adapter-postgres @json-express/queue-bullmq @json-express/kv-redis
```

## 2. Configure Environment Variables

Create a `.env.production` file (or set these directly in your hosting provider's dashboard, like Railway or Render).

```bash
# Tell JSONExpress we are in production
NODE_ENV=production

# 1. Swap the Database Adapter
jex.adapter=@json-express/adapter-postgres
jex.adapter-postgres.connectionString=postgres://prod_user:secure_pass@db.my-hosting.com:5432/my_db

# 2. Swap the Queue Adapter (Powered by Redis)
jex.queue=@json-express/queue-bullmq
jex.queue-bullmq.connectionString=redis://redis.my-hosting.com:6379

# 3. Swap the KV Store Adapter (Powered by Redis)
jex.kv=@json-express/kv-redis
jex.kv-redis.connectionString=redis://redis.my-hosting.com:6379
```

When JSONExpress boots, it will read these variables and completely bypass the local JSON adapters, seamlessly wiring your business logic into the distributed databases.

## 3. Run Database Migrations

Because Postgres is a strict relational database, it requires `CREATE TABLE` statements. JSONExpress handles this automatically based on your TypeScript `models/` files.

Before starting your server, run the migration command:

```bash
npx json-express migrate
```

This will safely synchronize your Postgres schema.

## 4. Deploy via Docker

JSONExpress runs beautifully in a containerized environment. Here is a production-ready `Dockerfile`:

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Copy your source code (models, hooks, etc.)
COPY . .

# Expose the default JSONExpress port
EXPOSE 3000

# Start the server
CMD ["npx", "json-express"]
```

Build and run your container:

```bash
docker build -t my-json-express-api .
docker run -p 3000:3000 --env-file .env.production my-json-express-api
```

### Summary
With a single `.env` swap, your API went from a local JSON mock server to a horizontally scalable Postgres/Redis cluster. Because your `hooks` and custom `endpoints` rely on the abstract `ctx.db` and `ctx.queue` interfaces, **zero business logic had to change.**
