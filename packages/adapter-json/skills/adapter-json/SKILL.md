---
name: adapter-json
description: Persist a JSON Express app to disk with zero infrastructure — every mutation written back to data/*.json atomically. Use for mock servers, demos that must survive restarts, and file-backed prototypes.
---

# @json-express/adapter-json

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
You need persistence but not a database: mock servers, local tools, seed-once demos.

## How
1. `npm i @json-express/adapter-json`, select with `jex.adapter=@json-express/adapter-json` if multiple adapters installed.
2. Collections live in `data/<collection>.json`; new collections created at runtime get their own file.
3. Writes are debounced + atomic (tmp file + rename) — safe to kill the process.

## Verify
POST a record, restart the server, GET it again — it must still be there.
