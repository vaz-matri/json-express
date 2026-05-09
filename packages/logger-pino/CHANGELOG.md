# @json-express/logger-pino

## 2.0.0

### Major Changes

- ## JSONExpress v2 — Modular Ecosystem (Breaking)

  **What changed:** The single `json-express` v1 package has been replaced by a monorepo of 26 focused, independently installable packages under the `@json-express/*` scope. Every layer — transport, database adapter, API style, logger, auth, docs — is now an explicit, swappable dependency rather than a hardcoded implementation.

  **Why:** v1's monolithic design made it impossible to swap out any layer (e.g. use Fastify instead of Express, or Pino instead of the console logger) without forking the project. v2 introduces a headless microkernel (`@json-express/core`) with a plugin/IoC model so each concern can be replaced or extended independently.

  **How to migrate:**

  1. Uninstall the old package:

     ```bash
     npm uninstall json-express
     ```

  2. Install the v2 quickstart preset, which bundles the recommended default stack (Express + in-memory adapter + REST + console logger + docs):

     ```bash
     npm install @json-express/boot
     ```

  3. Opt in to additional layers as needed:

     ```bash
     npm install @json-express/adapter-json        # persist to JSON files
     npm install @json-express/transport-fastify   # swap to Fastify
     npm install @json-express/api-graphql         # add GraphQL
     npm install @json-express/plugin-identity @json-express/middleware-auth  # add auth
     ```

     JSONExpress auto-discovers any `@json-express/*` package in your `package.json` — no manual wiring required.

  See the [Migrating to v2](https://jsonexpress.com/migration-v2) guide for the full package reference and config changes.

### Patch Changes

- Updated dependencies
  - @json-express/core@2.0.0
