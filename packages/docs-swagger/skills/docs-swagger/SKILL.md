---
name: docs-swagger
description: Serve Swagger UI / OpenAPI 3 docs for a JSON Express app. Use when consumers expect OpenAPI, or to export the generated spec (enriched by model validation blocks).
---

# @json-express/docs-swagger

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
OpenAPI/Swagger consumers; spec export for client generation.

## How
1. `npm i @json-express/docs-swagger`; `jex.docs=@json-express/docs-swagger` if docs-light is also installed.
2. Swagger UI at `jex.docs.path` (default `/docs`); spec at `<path>/json`.
3. With middleware-validation installed, request-body schemas in the spec come from model `validation` blocks.
4. Note: UI assets load from unpkg CDN — needs internet access.

## Verify
`GET /docs` renders Swagger UI listing every generated route.
