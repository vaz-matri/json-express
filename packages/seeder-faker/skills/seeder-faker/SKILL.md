---
name: seeder-faker
description: Fill a JSON Express app with realistic fake data derived from model field types — relation-aware seeding for demos, load tests, and mock servers.
---

# @json-express/seeder-faker

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Demo data, mock servers, populating dev databases.

## How
1. `npm i @json-express/seeder-faker`.
2. Seed on boot: `npx json-express --seed` (fills empty collections) or `--seed-append` (adds another batch).
3. Tune per collection: `jex.faker.collections.<name>.*` — listed collections are created even without a data file.
4. Field names/types drive values (emails, names, dates); relations seed parents first and wire FKs.

## Verify
Boot with --seed: collections return realistic records with valid relation ids.
