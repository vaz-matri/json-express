# @json-express/seeder-faker

The official Faker plugin for JSONExpress. Drops realistic mock data into your database on boot — schema-aware out of the box, with foreign keys auto-wired across related collections. Zero configuration needed for the common case; full per-collection control available when you want it.

## Installation

```bash
pnpm add @json-express/seeder-faker
```

Installing the package is enough — the JSONExpress CLI auto-discovers it and registers it as a seeder during the boot sequence.

## CLI Execution Flags

Mock data should never silently appear in production. Generation is gated behind explicit flags. Pass them either via your `package.json` script (using `--` to forward args through npm), or by invoking the CLI directly:

```bash
npm run serve -- --seed         # via your package.json `serve` script
npx json-express --seed         # invoke the CLI directly
```

| Flag | Behavior when collection is empty | Behavior when collection already has data |
| --- | --- | --- |
| `--seed` | Inserts records (10 by default) | **No-op** — the collection is left untouched |
| `--seed-append` | Inserts records | Inserts another batch *on top of* whatever is already there |

`--seed` is **idempotent** — safe to leave in your `serve` script forever. The first boot populates an empty collection; every subsequent boot detects the existing rows and skips, so you can't accidentally double-seed across restarts.

`--seed-append` **bypasses the empty-check** and always injects a fresh batch. Use it when you want to grow the dataset over multiple boots, or when iterating on a generator and you want to see new output without manually wiping the database.

Without either flag, the framework loads existing data files as-is and does not invoke the seeder at all.

> Renamed from `--seeder`. The old flag is no longer recognized.

## Zero-config: schema-driven auto-seeding

By default (`auto: true`), the seeder reads every model schema the project has loaded — whether from `models/*.ts` (`defineModel`) or inferred from `data/*.json` files — and synthesizes a generator from each field's type. Drop a model in, run `--seed`, get 10 records.

Fieldless models (`defineRoutes(...)` or `defineModel({ ... })` without a `fields` block) are skipped — they declare behavior only, so there's nothing to seed.

Field-type → faker mapping:

| Field type | Output |
|---|---|
| `types.id()` | Skipped — the database adapter assigns the id |
| `types.string()` | `faker.lorem.words()` clamped to `minLength` / `maxLength` |
| `types.number()` | `faker.number.int({ min, max })` honoring options |
| `types.boolean()` | `field.options.default` if set, else `faker.datatype.boolean()` |
| `types.date()` | `faker.date.recent().toISOString()` |
| `types.relation()` | Foreign key auto-populated — see below |

### Relations

When a schema declares a `many-to-one` relation (or a `one-to-one` with a local `foreignKey`), the seeder:

1. Topologically sorts collections so parents seed first.
2. Tracks the ids it generated for each parent collection.
3. When seeding a child record, fills the FK column with a random id pulled from that buffer — so every child points at a real parent.

`one-to-many` and `many-to-many` are the inverse side of the same edge; the FK lives on the opposite record (or in a join table for m2m), so the seeder doesn't write anything for those fields.

If the relation graph contains a cycle, the seeder logs a warning and falls back to declaration order — the lagging side's FK lands as `null`. Provide an explicit generator function (see below) to break the tie.

## Configuration

Override anything via your `jex.config.ts` / `jex.config.js`, mapped to the `faker` key:

```typescript
import { faker } from '@faker-js/faker';

export default {
  faker: {
    // Default count for any auto-seeded collection.
    count: 10,

    // Set to false to disable auto-seeding entirely — only the
    // collections explicitly listed below will be populated.
    // auto: false,

    collections: {
      // Numeric shorthand — auto-schema, custom count.
      users: 25,

      // Function form — full control. Replaces auto-schema for this collection.
      artists: () => ({
        name: faker.person.fullName(),
        genre: faker.music.genre()
      })
    }
  }
};
```

Resolution order per collection:

1. Function in `collections` → manual generator wins.
2. Number in `collections` → auto-schema, count overridden.
3. Schema registered, `auto !== false` → auto-schema, count = `faker.count ?? 10`.
4. Nothing matches → falls back to a generic `{ title, createdAt }` record.

> If you start the server with `--seed` in an empty directory, JSONExpress normally exits because it has nothing to serve. Configure even one collection here and the framework recognizes the schema, boots cleanly, and serves a 100% mock API.
