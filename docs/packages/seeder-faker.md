---
title: "@json-express/seeder-faker"
description: "A developer utility for JSONExpress that automatically generates thousands of realistic mock records based on your schema definitions."
---

# @json-express/seeder-faker

> Official mock data generator for JSONExpress using Faker.js.

The `@json-express/seeder-faker` package is a high-speed development utility. It reads your JSONExpress `ModelSchema` objects and uses **Faker.js** to automatically populate your database adapter with realistic, relational mock data.

This completely eliminates the need to manually write hundreds of insert statements when prototyping a frontend application or testing database performance.

## Installation

```bash
npm install @json-express/seeder-faker @faker-js/faker -D
```
*(Note: We recommend installing this as a `devDependency` since you should not be seeding fake data in production environments).*

## Configuration

To use the seeder, invoke it immediately after initializing your `IDatabaseAdapter`, but before calling `app.start()`.

```typescript
import { JSONExpress } from '@json-express/core';
import { MemoryAdapter } from '@json-express/adapter-memory';
import { FakerSeeder } from '@json-express/seeder-faker';

async function bootstrap() {
    const db = new MemoryAdapter();
    await db.connect();

    // Instantiate the seeder and pass it your database
    const seeder = new FakerSeeder(db);

    // Generate 50 Users, 200 Posts, and 500 Comments!
    await seeder.seed({
        users: 50,
        posts: 200,
        comments: 500
    });

    const app = new JSONExpress({ database: db });
    await app.start(3000);
}
```

## Core Features

### 1. Smart Schema Inference
You do not need to configure how the seeder generates data. It natively understands the JSONExpress `types` builder. 
*   If your schema defines an `email: types.string()`, it will automatically generate a valid email address via `faker.internet.email()`.
*   If your schema defines an `avatarUrl: types.string()`, it will generate a valid image URL.
*   If your schema defines a `published: types.boolean()`, it will randomly flip between true and false.

### 2. Automatic Relational Resolution
If you have a `posts` schema with a `authorId` foreign key that points to the `users` collection, the seeder is smart enough to handle the relationships. 

When you ask the seeder to generate 200 Posts, it will automatically query the database for existing Users, pick a random User ID, and assign it to the `authorId` field. This guarantees that your relational queries (`?_expand=author`) will actually work out of the box!

### 3. Load Testing Preparation
Because the JSONExpress routing engine uses an abstracted `IDatabaseAdapter`, you can easily point the `FakerSeeder` at a real MySQL or PostgreSQL database in a staging environment. You can command it to generate **500,000 records**, allowing your infrastructure team to instantly run realistic load tests and tune SQL indexes before going to production.

## Related Ecosystem Packages
*   **[@json-express/adapter-memory](/packages/adapter-memory):** The most common pairing. Use the seeder alongside the RAM adapter to spin up a fully populated, pristine backend in less than 50ms before running Playwright E2E tests!
