# @json-express/adapter-postgres

A production-ready relational database adapter for JSONExpress powered by Postgres and Drizzle ORM.

## Installation

```bash
npm install @json-express/adapter-postgres pg drizzle-orm uuidv7
```

## Setup

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

## Migrations

Unlike the file-system adapter, Postgres requires explicit schema migration. JSONExpress auto-generates SQL based on your JSON/TS models.

To create or update your tables, simply run:
```bash
npx jex migrate
```

## Primary Keys

By default, the Postgres adapter generates time-sortable **UUIDv7** strings for primary keys. You can also explicitly declare primary keys in your models:

```typescript
import { defineModel, types } from '@json-express/core';

export default defineModel({
    fields: {
        tenantId: types.string().primaryKey(),
        id: types.string().primaryKey(),
    }
});
```

You can also use composite primary keys:
```typescript
export default defineModel({
    primaryKeys: ['tenantId', 'id'],
    fields: {
        tenantId: types.string(),
        id: types.string(),
    }
});
```
