---
name: adapter-memory
description: Use the in-memory database for a JSON Express app — prototyping, tests, throwaway demos. Use when no persistence is needed or when resetting to data/ fixtures on each restart is desirable.
---

# @json-express/adapter-memory

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Prototyping, integration tests, demos. State resets to `data/*.json` on restart.

## How
1. `npm i @json-express/adapter-memory` (already included via `@json-express/boot`).
2. Nothing to configure. If another adapter is also installed: `jex.adapter=@json-express/adapter-memory` in `.env`.
3. Model relations (`types.relation(...)`) work with `?_expand=<field>` on GET requests.

## Verify
`npm run serve` → `GET /<collection>` returns the records from `data/<collection>.json`.
