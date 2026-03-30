# @json-express/api-rest

The default API Generator for [JSON Express](https://github.com/vaz-matri/json-express).

This plugin analyzes your active database collections and generates standardized, framework-agnostic RESTful routes:
- `GET /[collection]` (Supports search via query params)
- `GET /[collection]/:id`
- `POST /[collection]`
- `PATCH /[collection]/:id`
- `DELETE /[collection]/:id`

## 📦 Installation

Included by default via the `@json-express/cli`. For custom programmatic setups:

```bash
npm install @json-express/api-rest
```

## 🚀 Usage

### Programmatic Usage
```typescript
import { JsonExpressKernel } from '@json-express/core';
import { RestApiGenerator } from '@json-express/api-rest';
import { MemoryDatabaseAdapter } from '@json-express/adapter-memory';

const kernel = new JsonExpressKernel();
const db = new MemoryDatabaseAdapter();
const restApi = new RestApiGenerator({ database: db });

kernel.registerApiGenerator(restApi);
```
