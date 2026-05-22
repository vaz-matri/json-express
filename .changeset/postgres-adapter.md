---
"@json-express/adapter-postgres": minor
"@json-express/core": minor
"@json-express/cli": minor
---

- **@json-express/adapter-postgres**: Introduced a completely new production-ready Postgres adapter powered by Drizzle ORM and UUIDv7.
- **@json-express/core**: Added support for `primaryKey` on field options and `primaryKeys` (composite keys) on `ModelConfig`.
- **@json-express/cli**: Added `jex migrate` command to synchronize the database tables with the dynamic JSONExpress schemas.
