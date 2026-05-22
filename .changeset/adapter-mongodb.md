---
"@json-express/adapter-mongodb": minor
---

Introduced `@json-express/adapter-mongodb`, a production-ready NoSQL database adapter utilizing the official Node.js `mongodb` driver. This package implements transparent `_id` mapping to support MongoDB native `ObjectId` types while maintaining strict `id` string backwards compatibility with the broader JSONExpress ecosystem. Includes auto-migration support for indexes and unique constraints.
