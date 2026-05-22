# @json-express/adapter-mongodb

A production-ready NoSQL database adapter for JSONExpress powered by the official Node.js `mongodb` driver.

## Installation

```bash
npm install @json-express/adapter-mongodb mongodb
```

## Setup

```typescript
// src/boot.ts
import { Kernel } from '@json-express/core';
import { AdapterMongo } from '@json-express/adapter-mongodb';

export const kernel = new Kernel();

kernel.registerDatabaseAdapter(new AdapterMongo({
    connectionString: process.env.MONGO_URI || 'mongodb://localhost:27017',
    dbName: 'jsonexpress_db',
    logger: kernel.logger
}));
```

## Running Migrations

While MongoDB is schemaless, JSONExpress handles unique constraints and index creation for you. 

To create indexes based on your JSON/TS definitions, run:
```bash
npx jex migrate
```

## ID Strategy

JSONExpress models inherently expect an `id` string field, but MongoDB natively relies on an `_id` field. **You do not need to configure anything**. 

This adapter safely manages the translation automatically:
- When creating a record, MongoDB generates a native `ObjectId` for `_id`.
- When JSONExpress reads that record, the adapter automatically translates it to `id` (as a string) so it works seamlessly with your API and GraphQL outputs.
- If you migrated from Postgres or Memory adapters and have existing `uuidv7` string IDs, the adapter safely accepts them as well.
