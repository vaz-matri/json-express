# Fake data seeding example

Populates your collections with realistic fake data on boot using [`@faker-js/faker`](https://fakerjs.dev). Schema-aware out of the box — drop a model in `models/`, run `--seed`, and you get 10 records with foreign keys auto-resolved across relations.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/seeder-faker
```

Drop a model into `models/`. That's it.

```ts
// models/wizards.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
  fields: {
    id: types.id(),
    name: types.string({ required: true, unique: true }),
    school: types.string({ default: 'Unaffiliated' }),
    level: types.number({ min: 1, max: 100 }),
    active: types.boolean({ default: true }),
    ascendedAt: types.date(),
    potions: types.relation({ target: 'potions', type: 'one-to-many', foreignKey: 'wizardId' })
  }
});
```

```ts
// models/potions.ts
import { defineModel, types } from '@json-express/core';

export default defineModel({
  fields: {
    id: types.id(),
    name: types.string().required(),
    wizardId: types.string().required(),
    rarity: types.string({ default: 'common' }),
    potencyLevel: types.number().min(1).max(10),
    bottled: types.boolean().default(true),
    wizard: types.relation({ target: 'wizards', type: 'many-to-one', foreignKey: 'wizardId' })
  }
});
```

## Run it

Three equivalent ways to start the server with seeding enabled:

```bash
# 1. Via the package.json `serve` script (this folder ships with one).
npm run serve

# 2. Pass extra flags through npm — the `--` separator is important.
npm run serve -- --seed

# 3. Run the CLI directly, no script needed.
npx json-express --seed
```

The seeder topo-sorts the schemas (parents first), generates 10 wizards, then generates 10 potions whose `wizardId` is randomly drawn from the wizards just created. Visit:

```bash
curl http://localhost:3000/wizards
curl http://localhost:3000/potions
```

## `--seed` vs `--seed-append`

| Flag | Behavior when collection is empty | Behavior when collection already has data |
| --- | --- | --- |
| `--seed` | Inserts 10 fake records | **No-op** — the collection is left untouched |
| `--seed-append` | Inserts 10 fake records | Inserts another 10 records *on top of* whatever is already there |

`--seed` is **idempotent** — safe to leave in your `serve` script forever. The first boot populates an empty collection; every subsequent boot detects the existing rows and skips. You won't accidentally double-seed across restarts.

`--seed-append` **bypasses the empty-check** and always injects a fresh batch. Use it when you want to grow the dataset over multiple boots, or when iterating on a generator and you need to see new output without manually wiping the database.

```bash
# First boot: collection is empty → 10 records created.
npx json-express --seed

# Second boot: collection has 10 records → no records added.
npx json-express --seed

# Third boot: collection has 10 records → 10 more added (now 20 total).
npx json-express --seed-append
```

> Without either flag, the framework loads existing data files as-is and does not invoke the seeder at all. The seeder is gated behind an explicit flag because injecting fake records into a real database is a destructive default we'd rather you opt into.

## What's in this folder

- `package.json` — declares `@json-express/boot`, `@json-express/seeder-faker`, and `@json-express/adapter-json`. The `serve` script runs the CLI with `--seed`. A `pretest` hook wipes `data/` so each Playwright run starts from a clean slate (the JSON adapter persists to disk).
- `models/wizards.ts`, `models/potions.ts` — the two schemas. Their relation fields drive both the FK wiring and the seed order.
- `.env` — pins `jex.adapter=@json-express/adapter-json` so seeded records persist on disk.

## See also

- [`@json-express/seeder-faker`](../../packages/seeder-faker/README.md) — package README, including the `jex.config.ts` overrides for custom counts and per-collection generator functions.
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin.
