# @json-express/adapter-memory

The default Database Adapter for [JSON Express](https://github.com/vaz-matri/json-express).

This plugin scans the local directory for `.json` files, parses them into memory, and provides blazing-fast CRUD operations (`getAll`, `getById`, `search`, `create`, `update`, `delete`). It also automatically resolves relational data using `id` and `ref` fields!

## 📦 Installation

This package is included by default via the `@json-express/cli`. If you are building a custom programmatic setup:

```bash
npm install @json-express/adapter-memory
```

## 🚀 Usage

### Programmatic Usage
```typescript
import { JsonExpressKernel } from '@json-express/core';
import { MemoryDatabaseAdapter } from '@json-express/adapter-memory';

const kernel = new JsonExpressKernel();
const memoryDb = new MemoryDatabaseAdapter();

// Load initial data
memoryDb.loadData({
  users:[{ id: '1', name: 'John Doe' }]
});

kernel.registerDatabase(memoryDb);
```

## ⚙️ Configuration
By default, this adapter expects `.json` files in the current working directory.
*(Future configuration options for strict-typing and custom file paths will be documented here).*
