---
name: config-env
description: Configure a JSON Express app with .env files: key syntax, nesting, cascade order, mode files. Use when setting any jex.* key or debugging why a config value is not applied.
---

# @json-express/config-env

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Always (default provider). Debugging config = this skill.

## How
1. Keys: `jex.` prefix, `.` or `__` nests, case-insensitive: `jex.adapter-postgres.connectionString=...` ≡ `JEX__ADAPTER-POSTGRES__CONNECTIONSTRING`.
2. Cascade (highest wins): process env → `.env.<mode>.local`/`.env.local` → `.env.<mode>` → `.env`.
3. Keys are package-scoped — the llms.txt of each package lists what it reads. Shared: `jex.port`, `jex.auth.*`, `jex.docs.*`.

## Verify
Boot logs reflect the value (port, chosen plugins); unknown keys are ignored silently — check spelling against the package llms.txt.
