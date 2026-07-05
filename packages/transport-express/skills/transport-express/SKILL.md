---
name: transport-express
description: Understand the default HTTP layer of a JSON Express app (Express 5): ports, SSL, error shapes, trace logging. You never write Express code — this skill is about configuring the layer.
---

# @json-express/transport-express

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Default transport (in boot). Port/SSL/error-contract questions land here.

## How
1. `jex.port=3000` in `.env`.
2. Errors are always JSON: 404 `{ statusCode, error }` for unknown routes, JSON 500 for handler failures.
3. Per-request logic does NOT go here — that is a `middleware-*` package; endpoints are models.
4. HTTPS in dev: install `plugin-devcert` (never wire certificates manually).

## Verify
Unknown route returns the JSON 404 shape; EADDRINUSE at boot fails loudly instead of switching ports.
