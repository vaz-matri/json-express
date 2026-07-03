---
name: transport-fastify
description: Swap a JSON Express app onto Fastify for higher throughput — same routes, same JSON error contract, zero code changes. Covers selection and fastify-specific keys.
---

# @json-express/transport-fastify

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Throughput-sensitive deployments; container environments (binds 0.0.0.0).

## How
1. `npm i @json-express/transport-fastify`; `jex.transport=@json-express/transport-fastify` if transport-express also installed.
2. Optional: `jex.transport.fastify.logger=true`; TLS via `jex.transport.fastify.ssl.key`/`.cert` (PEM strings) or install `plugin-devcert`.
3. Nothing else changes — routes, models, middlewares all behave identically.

## Verify
The app serves identically after the swap; 404/500 shapes match transport-express.
