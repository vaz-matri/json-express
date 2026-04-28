---
title: Zero-Config JSON Mode
description: Learn how JSON Express infers strict schemas and generates APIs directly from raw JSON files in zero seconds.
---

# Zero-Config JSON Mode

JSON Express earned its name because of its most powerful prototyping feature: **Zero-Config JSON Inference**.

When building a new application, you often don't know exactly what your schema looks like yet. Writing TypeScript interfaces and database migrations upfront slows you down. With JSON Express, you can bypass all of that and start immediately.

## The Magic of `/data`

To generate a full REST and GraphQL API, you do not need to write a single line of code. Simply create a JSON file inside your project's `/data` directory.

Let's say you drop a file called `posts.json` into `/data/posts.json` with the following content:

```json
[
  {
    "id": "1",
    "title": "Welcome to JSON Express",
    "published": true,
    "views": 150
  }
]
```

### What happens next?
When you start the JSON Express server, the Kernel's **Schema Loader** detects `posts.json`. Because no corresponding TypeScript model exists, the Kernel automatically:
1.  **Infers the Schema:** It inspects the first object in the array and dynamically generates a strict `ModelSchema` in memory. It sees that `"title"` is a `string`, `"published"` is a `boolean`, and `"views"` is a `number`.
2.  **Assigns the ID:** It identifies `"id"` and automatically configures it as the primary key.
3.  **Generates the API:** It passes this inferred schema to the API Generators.

Instantly, without writing any configuration, the following endpoints are live and fully functional:
*   `GET /posts`
*   `GET /posts/:id`
*   `POST /posts`
*   `PATCH /posts/:id`
*   `DELETE /posts/:id`

If you are using the `@json-express/adapter-json` (the default local adapter), any `POST` or `PATCH` requests made to your API will be safely and atomically written back to your `data/posts.json` file on disk!

---

## Ejecting to TypeScript (Progressive Disclosure)

Zero-Config JSON Mode is perfect for your first few days of development. But eventually, your application will grow. You might need:
*   **Field-Level Security:** Hiding a password field from the API.
*   **Database Constraints:** Enforcing that a username is `unique`.
*   **Lifecycle Hooks:** Triggering an email when a user registers.
*   **Relational Data:** Linking a `post` to an `author`.

Raw JSON files cannot define these enterprise concepts. This is where **Ejecting to TypeScript** comes in.

### How to Eject
You do not need to migrate your database or change your API endpoints. 

Simply create a TypeScript file in the `/models` directory with the *exact same name* as your JSON file (e.g., `models/posts.ts`).

```typescript
// models/posts.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
    name: 'posts', // This must match the JSON filename!
    fields: {
        id: types.id(),
        title: types.string({ unique: true }), // Adding a strict constraint!
        published: types.boolean({ default: false }),
        views: types.number()
    },
    hooks: {
        afterCreate: async (record, ctx) => {
            ctx.logger.info(`New post created: ${record.title}`);
        }
    }
});
```

### The Override Rule
When the Schema Loader boots, it processes TypeScript models *last*. 

If it finds `models/posts.ts`, it will securely override the inferred schema from `data/posts.json`. Your API remains perfectly intact, your data is untouched, but your endpoints are now backed by strict enterprise constraints and security rules!

This progressive disclosure architecture allows you to prototype with the speed of JSON, and scale with the safety of Enterprise TypeScript.
