# @json-express/boot

Zero-code preset that bundles the recommended JSON Express stack so you can boot a working server with a single install.

```bash
npm install @json-express/boot
npx json-express
```

## What's in the box

This package ships **no application code** — its only purpose is to declare the default stack as `dependencies`:

- `@json-express/core` — kernel + auto-discovery orchestrator (the `json-express` binary)
- `@json-express/config-env` — `.env`-based configuration provider
- `@json-express/transport-express` — Express HTTP server
- `@json-express/adapter-memory` — in-memory database
- `@json-express/api-rest` — REST API generator
- `@json-express/logger-console` — console logger
- `@json-express/docs-light` — built-in `/docs` provider

## When to use this vs. core directly

- **Beginner / quickstart:** install `@json-express/boot`. You get a complete working stack out of the box.
- **Expert:** install `@json-express/core` plus only the specific plugins you want (e.g. `@json-express/transport-fastify`, `@json-express/adapter-json`). The `json-express` binary auto-discovers whichever plugins are present.
