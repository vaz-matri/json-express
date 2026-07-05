---
name: config-file
description: Configure a JSON Express app with jex.config.ts/yml/json files and per-mode overlays instead of .env. Use for structured config, typed config files, or per-environment overlay files.
---

# @json-express/config-file

> Rule zero: never import or instantiate this package — discovery wires it automatically.
> Full key reference: the llms.txt of this package.

## When to use
Config too rich for .env lines (nested blocks, arrays), or teams preferring config-as-file.

## How
1. `npm i @json-express/config-file`; if config-env is also installed choose via env var `jex_config=@json-express/config-file`.
2. Create `jex.config.ts` default-exporting an object or `({ env }) => object`.
3. Mode overlay: `jex.config.production.ts` deep-merges over the base by NODE_ENV.
4. The config file is DATA (framework configuration only) — never behavior, handlers, or validation.

## Verify
Boot uses your port/plugin picks from the file; switch NODE_ENV and see the overlay apply.
