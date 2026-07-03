---
name: api-graphql
description: Serve GraphQL instead of REST from a JSON Express app. Use when the consumer wants queries/mutations over generated collections, GraphiQL, or model-driven GraphQL extensions.
---

# @json-express/api-graphql

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
GraphQL consumers. Replaces api-rest (choose with `jex.api=` when both installed).

## How
1. `npm i @json-express/api-graphql`; `jex.api=@json-express/api-graphql` if api-rest is also present.
2. Endpoint: POST `/graphql` (change with `jex.api.graphql.endpoint`); GraphiQL IDE on GET in development (`jex.api.graphql.graphiql=false` to disable).
3. Queries/mutations are generated per collection from model fields; model `access` blocks are enforced in resolvers.
4. Auth: same shared `jex.auth.*` namespace — bearer tokens verified and exposed to access rules.

## Verify
POST a query for a collection to /graphql returns data; introspection shows generated types.
