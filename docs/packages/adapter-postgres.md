# @json-express/adapter-postgres

A production-ready relational database adapter for JSONExpress powered by Postgres and Drizzle ORM.

## Overview

Unlike `adapter-json` or `adapter-memory`, the Postgres adapter is designed for scalable, concurrent production workloads. It uses Drizzle ORM internally to safely execute SQL queries and leverages time-sortable `UUIDv7` for optimal primary key indexing.

## Installation

```bash
npm install @json-express/adapter-postgres pg drizzle-orm uuidv7
```

## Setup

Register the adapter during kernel boot:

```typescript
// src/boot.ts
import { Kernel } from '@json-express/core';
import { AdapterPostgres } from '@json-express/adapter-postgres';

export const kernel = new Kernel();

kernel.registerDatabaseAdapter(new AdapterPostgres({
    connectionString: process.env.DATABASE_URL,
    logger: kernel.logger
}));
```

## Running Migrations

Postgres requires explicit schema creation. Rather than making you write SQL manually, JSONExpress can auto-generate and apply `CREATE TABLE` commands based on your active JSON/TS `defineModel` definitions.

To migrate your database:
```bash
npx jex migrate
```

## Primary Keys

By default, the Postgres adapter generates time-sortable **UUIDv7** strings for primary keys. You can also explicitly declare primary keys in your models using the new `.primaryKey()` modifier:

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        tenantId: types.string().primaryKey(),
        id: types.string().primaryKey(),
    }
});
```

### Composite Primary Keys

For complex relational mapping, you can define composite primary keys at the table level:

```typescript
export default defineModel({
    primaryKeys: ['tenantId', 'id'],
    fields: {
        tenantId: types.string(),
        id: types.string(),
    }
});
```
