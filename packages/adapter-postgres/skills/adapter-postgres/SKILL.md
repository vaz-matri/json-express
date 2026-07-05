---
name: adapter-postgres
description: Run a JSON Express app on PostgreSQL (drizzle-orm, UUIDv7 ids). Use when graduating to a relational database. Covers connection config and table creation via jex migrate.
---

# @json-express/adapter-postgres

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Production/staging on Postgres.

## How
1. `npm i @json-express/adapter-postgres`.
2. `.env`: `jex.adapter-postgres.connectionString=postgres://...` (required — boot fails loudly without it).
3. `npx jex migrate` creates tables from model fields (PK/unique/NOT NULL/defaults).
4. IDs are UUIDv7 strings generated on create — do not generate ids in models.

## Verify
`npx jex migrate` logs each table; CRUD round-trips; unique violations return HTTP 400 naming the field.
