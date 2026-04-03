# @json-express/middleware-validation

Zod-based validation middleware for JSON Express v2.

## ✨ Features

- **Decoupled Validation** - Enforce schemas at the middleware layer, independent of your Database or Transport.
- **Powered by Zod** - Use the industry-standard Zod library for robust, type-safe schema definitions.
- **Auto-Discovery** - Seamlessly integrates with the JSON Express CLI.

## 🚀 Installation

```bash
npm install @json-express/middleware-validation
```

## ⚙️ Usage

This middleware inspects incoming requests and validates their body, query, or params against pre-defined Zod schemas.

### Example Schema (jex.config.ts)

```typescript
import { z } from 'zod';

export default {
  validation: {
    albums: {
      post: z.object({
        name: z.string().min(1),
        artist: z.string()
      })
    }
  }
};
```

## 🛡️ Strict Mode Strategy

When using high-performance transports like [`@json-express/transport-fastify`](../transport-fastify), the server layer is intentionally kept permissive. Installing this validation middleware ensures that your API remains secure and strictly typed across all transports.

## 📄 License

MIT
