---
name: middleware-validation
description: Enforce input validation in a JSON Express app from model validation blocks (Zod). Use when requests must be validated before handlers — installing this package activates the blocks.
---

# @json-express/middleware-validation

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Any app accepting writes. Without it, model validation blocks are inert metadata.

## How
1. `npm i @json-express/middleware-validation` — no config.
2. In models: `validation: { create: {}, update: { body: (base) => base.partial() }, list: { query: v } }` (`{}` = auto-baseline from fields).
3. Custom endpoints: `{ handler, validation }` object form next to the handler.

## Verify
Invalid POST returns 400 with structured field errors before any handler runs; docs-swagger shows body schemas.
