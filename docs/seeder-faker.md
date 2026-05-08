---
title: "@json-express/seeder-faker"
description: "Auto-discovered Faker.js seeder for JSONExpress — derives a generator from your model fields, resolves relations topologically, and runs on --seed."
---

# @json-express/seeder-faker

> Schema-driven mock data generator for JSONExpress, powered by Faker.js.

`@json-express/seeder-faker` implements `ISeeder` and is auto-discovered by the `json-express` runtime. It synthesises a generator from each model's `fields`, walks the relation graph to seed parents before children, and runs only when you invoke the server with `--seed` (or `--seed-append`). At any other time it is dormant.

## Installation

```bash
npm install @json-express/seeder-faker @faker-js/faker -D
```

Install as a `devDependency` — you should not be seeding fake data in production.

## Usage

The seeder is an auto-discovered plugin, not a library you instantiate. The runtime registers it during `--seed`:

```bash
# Refresh: clear collections, then seed
npx json-express --seed

# Append: keep existing rows, add seeded ones on top
npx json-express --seed-append
```

Without a flag, the seeder loads but does nothing — you can leave it in `dependencies` permanently.

## Configuration

All seeder configuration lives under the `jex.faker.*` namespace in your config provider (typically `.env`).

```bash
# .env

# Default: every model with fields gets seeded automatically. Set to false
# to opt-in only the collections explicitly listed below.
jex.faker.auto=true

# Default record count per collection when no per-collection number is given.
jex.faker.count=10
```

For per-collection overrides, switch to `jex.config.ts` (or whichever config provider supports object values):

```typescript
// jex.config.ts
export default {
    faker: {
        auto: true,
        count: 10,
        collections: {
            users: 50,           // seed 50 users
            posts: 200,          // seed 200 posts
            comments: 500,       // seed 500 comments
            invoices: () => ({   // full generator override
                amount: faker.commerce.price(),
                status: faker.helpers.arrayElement(['paid', 'unpaid'])
            })
        }
    }
};
```

### Configuration keys

| Key | Type | Default | Effect |
|---|---|---|---|
| `jex.faker.auto` | boolean | `true` | When `true`, every model with `fields` is seeded automatically. Set `false` to opt-in only via `collections`. |
| `jex.faker.count` | number | `10` | Default rows per collection when no per-collection number is given. |
| `jex.faker.collections.<name>` | number \| `() => any` | – | Per-collection override. A number changes the count; a function replaces the generator entirely. |

## How it works

### 1. Schema-derived generators

The seeder reads each `ModelSchema` you registered (via `defineModel` or auto-loaded from `data/*.json`) and synthesises a generator from the field types:

| Field type | Generated value |
|---|---|
| `types.id()` | Skipped — assigned by the adapter |
| `types.string({ minLength, maxLength })` | `faker.lorem.words(2..4)` clamped to bounds |
| `types.number({ min, max })` | `faker.number.int({ min, max })` |
| `types.boolean()` | `faker.datatype.boolean()` (or the field's `default` if set) |
| `types.date()` | `faker.date.recent().toISOString()` |
| `types.relation({ ... })` | Random id from the parent collection's seeded set |

You can override the entire generator for any one collection by passing a function under `jex.faker.collections.<name>`.

### 2. Topological relation resolution

When a `posts` schema declares a `many-to-one` relation to `users` with foreign key `authorId`, the seeder topologically sorts the requested collections so `users` is seeded before `posts`. When generating a post, it picks a random already-inserted user id for `authorId` — making `?_expand=author` and equivalent GraphQL queries work out of the box.

If a cycle exists in the relation graph, the seeder logs a warning, falls back to declaration order, and FKs on the lagging side resolve to `null`. To break the cycle, provide an explicit generator function for one side.

### 3. Refresh vs append

- `--seed` is **idempotent**. The seeder calls `IDatabaseAdapter.deleteMany({})` on each target collection before inserting — running it twice produces the same final state.
- `--seed-append` skips the delete and inserts on top of whatever is already there. Useful for repeatedly populating a long-running adapter (e.g. `adapter-json` against a real file).

## Custom seeders

`seeder-faker` is one of many possible seeders. Anything that implements `ISeeder` is picked up by the runtime:

```typescript
import type { ISeeder, IDatabaseAdapter, ModelSchema, IConfigProvider, ILogger } from '@json-express/core';

export class MyCsvSeeder implements ISeeder {
    public readonly name = 'csv';
    constructor(private deps: { configProvider: IConfigProvider; logger: ILogger }) {}
    setSchemas(schemas: ModelSchema[]) { /* … */ }
    async seed(database: IDatabaseAdapter, isAppend: boolean) { /* … */ }
}
```

Publish it as `@your-scope/seeder-csv` (or any package name containing `seeder-` after the `@json-express/` namespace, or a third-party name containing `json-express-`) and it gets auto-discovered.

## Related

- [@json-express/adapter-memory](/adapter-memory) — pair with the memory adapter for a fully populated, pristine backend in a single boot
- [@json-express/adapter-json](/adapter-json) — combine with `--seed-append` to incrementally fill a file-backed dataset
- [Schemas & Models](/schemas) — what `fields` shapes are available to the synthesizer
