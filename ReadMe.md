<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo/logo_long_desc_dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="logo/logo_long_desc.svg">
  <img src="logo/logo_long_desc.svg" alt="JSON Express">
</picture>

Skip the backend bottleneck and go from prototype to MVP launch faster.
**JSON Express v2.0** is a highly modular, pluggable Meta-Framework. It instantly converts your JSON files into a complete server, providing the practical infrastructure you need until your dedicated backend is ready.

visit[jsonexpress.com](https://jsonexpress.com)

## ✨ Features
- **Schema-Driven Engine** - Define strongly-typed data models using `defineModel` for the ultimate Code-First experience. Drop TypeScript files into `/models` and JSON Express transpiles them at runtime with zero-config via `jiti`!
- **Data & Logic Separation** - Strictly separates your definition schemas (`/models/albums.ts`) from your permanent disk storage (`/data/albums.json`).
- **REST Joins** - The Memory database automatically resolves relationships natively! Use `?_expand=artistId` directly in HTTP requests to join objects securely.
- **Custom Endpoints** - Extend your models immediately using the `endpoints: {}` block in schemas, or drop global API routes straight into a root `/routes` directory. 
- **The `export` Command** - Start hacking in raw JSON. When you need relationships, run `json-express export albums` to instantly scaffold a strict, typed schema blueprint from your unstructured data.
- **Microkernel Architecture** - Pluggable design! Swap out the Database, Transport (Express/Fastify), or API paradigm without breaking your logic.
- **Deep Observability** - Fully correlated tracing via `AsyncLocalStorage` seamlessly connecting every Request → Middleware → API → Database call across the framework.

---

## 🚀 Installation & Quick Start

You can run JSON Express globally for instant prototyping, or install it locally to customize your stack.

### Option A: The Global Quick-Start (Zero Config)
Get up and running in seconds without installing anything in your project.

```bash
# 1. Boilerplate your folder structure
$ mkdir -p my-api/data my-api/models && cd my-api

# 2. Start hacking your data
$ echo '[{"id": "1", "name": "The Marshall Mathers LP", "artist": "Eminem"}]' > data/albums.json

# 3. Run JSON Express via npx!
$ npx @json-express/cli
```

### Option B: The Schema-Driven Experience
When you're ready to add relations or webhooks to your data, scaffold a TypeScript schema natively without configuring TSC!

```bash
# Export the raw JSON into a typed schema instantly:
$ npx @json-express/cli export albums

# Edit your new strongly-typed model:
# (Inside models/albums.ts)
import { defineModel, types } from '@json-express/core';

export default defineModel('albums', {
    fields: {
        name: types.string(),
        artistId: types.relation({ target: 'artists', type: 'many-to-one' })
    },
    endpoints: {
        'GET /stats': async (req, res, ctx) => {
             res.send({ status: 'album stats go here' });
        }
    }
});
```

---

## 🧠 How It Works Behind the Scenes

JSON Express v2 is built on a "Headless Microkernel" architecture. The `@json-express/core` package contains **zero** HTTP or database logic. It acts purely as an orchestrator using an Inversion of Control (IoC) container.

When you start the CLI, the Kernel boots in phases:
1. **Configuration:** Loads environment variables and config files.
2. **Auto-Discovery:** Scans your `package.json` to see which plugins you have installed.
3. **Registration:** Binds the Logger, Database, API Generator, and Server Transport layers together.
4. **Boot:** The Database parses your data, the API Generator builds the routes, and the Transport server starts listening!

### The Default Stack ("Batteries Included")
If you run the CLI without installing any custom plugins, it automatically falls back to its highly-capable default stack:
- **Logger:** [`@json-express/logger-console`](./packages/logger-console)
- **Server:** [`@json-express/transport-express`](./packages/transport-express)
- **API:** [`@json-express/api-rest`](./packages/api-rest)
- **Database:** [`@json-express/adapter-memory`](./packages/adapter-memory)
- **Config:** [`@json-express/config-env`](./packages/config-env)

### 🔄 How to Override Defaults
To change the framework's behavior, **you just install the plugin you want.** The CLI's Auto-Discovery engine handles the rest!

*Example: Swapping Express for Fastify*
```bash
# Install the fastify transport plugin
npm install @json-express/transport-fastify
```
The next time you run `npx json-express`, the CLI detects Fastify, silently unloads the default Express plugin, and boots your server using Fastify. No code changes required!

*(If you install two conflicting plugins, the interactive CLI will pause and ask you which one you prefer!)*

---

## 🧩 The Ecosystem (Mix & Match)

### 🛠️ Core & Tooling
* **[`@json-express/core`](./packages/core/ReadMe.md)** - The headless Microkernel and IoC container.
* **[`@json-express/cli`](./packages/cli/ReadMe.md)** - The command-line runner and auto-discovery engine.

### 🌐 Transports (Server Layer)
* **[`@json-express/transport-express`](./packages/transport-express/ReadMe.md)** *(Default)* - Express.js server.
* **[`@json-express/transport-fastify`](./packages/transport-fastify/ReadMe.md)** - High-performance Fastify server.
* *(Upcoming)* `@json-express/transport-h3` - Lightweight, edge-ready h3 server.

### 🔌 API Paradigms
* **[`@json-express/api-rest`](./packages/api-rest/ReadMe.md)** *(Default)* - Standardized RESTful routes (`GET`, `POST`, `PATCH`, `DELETE`).
* *(Upcoming)* `@json-express/api-graphql` - Generates a GraphQL schema and resolvers.

### 🗄️ Adapters (Database Layer)
* **[`@json-express/adapter-memory`](./packages/adapter-memory/ReadMe.md)** *(Default)* - Fast, in-memory local JSON file storage.
* *(Upcoming)* `@json-express/adapter-mongodb` - Persists your data to MongoDB.

### 📊 Loggers (Observability Layer)
* **[`@json-express/logger-console`](./packages/logger-console/ReadMe.md)** *(Default)* - Zero-dependency standard output logging.
* **[`@json-express/logger-pino`](./packages/logger-pino/ReadMe.md)** - Enterprise high-performance structured JSON logging.

---

## 📄 License
[MIT License](LICENSE)
