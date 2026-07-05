---
name: docs-light
description: Serve zero-dependency API documentation for a JSON Express app at /docs. Use to inspect the generated API surface or point agents at the machine-readable manifest.
---

# @json-express/docs-light

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Default docs (in boot). Agents: fetch /docs/json to learn the running API.

## How
1. Included via boot; mount path via `jex.docs.path` (default `/docs`).
2. Behind a proxy set `jex.docs.baseUrl` for correct link generation.

## Verify
`GET /docs` renders; `GET /docs/json` returns the route manifest.
