---
"@json-express/kv-redis": minor
---

Introduced `@json-express/kv-redis`, a persistent and distributed key-value store adapter. It implements the JSONExpress `IKvStore` contract using `ioredis`, perfectly translating native generic TTL constraints into precise Redis eviction instructions. Ideal for distributed caching and rate-limiting across horizontally scaled environments.
