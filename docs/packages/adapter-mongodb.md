# @json-express/adapter-mongodb

A production-ready NoSQL database adapter for JSONExpress powered by the official Node.js `mongodb` driver.

## Overview

Unlike SQL adapters, MongoDB is schemaless. However, JSONExpress uses your `ModelSchema` definitions to automatically build indexes (such as unique constraints and primary keys) ensuring optimal query performance.

## Installation

```bash
npm install @json-express/adapter-mongodb mongodb
```

## Setup

Register the adapter during kernel boot:

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

To apply your unique constraints and composite primary keys to MongoDB, run the standard JSONExpress migration CLI:

```bash
npx jex migrate
```

## ID Strategy

JSONExpress models inherently expect an `id` string field, but MongoDB natively relies on an `_id` field of type `ObjectId`. 

**You do not need to configure anything**. 

This adapter safely manages the translation automatically:
- When creating a record without an ID, MongoDB generates a native `ObjectId` for `_id`.
- When JSONExpress reads that record, the adapter translates `_id` back to `id` (as a string) so it works seamlessly with your API outputs.
- If you migrated from Postgres or Memory adapters and have existing `uuidv7` string IDs, the adapter safely accepts them natively as strings.
