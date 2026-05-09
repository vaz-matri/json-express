<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/public/logo-long-dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="docs/public/logo-long-light.svg">
  <img src="docs/public/logo-long-dark.svg" alt="JSONExpress">
</picture>

Skip the backend bottleneck and go from prototype to MVP launch faster.
**JSONExpress v2.0** is a highly modular, pluggable Meta-Framework. It instantly converts your JSON files into a complete server, providing the practical infrastructure you need until your dedicated backend is ready.

visit [jsonexpress.com](https://jsonexpress.com)

## ✨ Features
- **Schema-Driven Engine** - Define strongly-typed data models using `defineModel` for the ultimate Code-First experience. Use the ergonomic Zod-style fluent API (e.g. `types.string().required()`) or pure JSON. Drop TypeScript files into `/models` and JSONExpress transpiles them at runtime with zero-config via `jiti`!
- **Data & Logic Separation** - Strictly separates your definition schemas (`/models/albums.ts`) from your permanent disk storage (`/data/albums.json`).
- **REST Joins** - The Memory database automatically resolves relationships natively! Use `?_expand=artistId` directly in HTTP requests to join objects securely.
- **Custom Endpoints** - Extend your models immediately using the `endpoints: {}` block in schemas, or drop global API routes straight into a root `/routes` directory.
- **Offline Tooling** - Use `npx jex export albums` to scaffold a strict, typed schema blueprint from your unstructured JSON.
- **Microkernel Architecture** - Pluggable design! Swap out the Database, Transport (Express/Fastify), or API paradigm without breaking your logic.
- **Deep Observability** - Fully correlated tracing via `AsyncLocalStorage` seamlessly connecting every Request → Middleware → API → Database call across the framework.

---

## 🚀 Installation & Quick Start

JSONExpress ships two installation paths so you can choose how much to wire up yourself.

### Path A — Beginner: `@json-express/boot` (Batteries Included)

A single meta-package bundles the recommended default stack so you can boot a working server immediately.

```bash
npm install @json-express/boot
```

In `package.json`:
```json
{
  "scripts": { "start": "json-express" },
  "dependencies": { "@json-express/boot": "*" }
}
```

Drop a JSON file in and run:
```bash
mkdir data && echo '[{"id":"1","title":"Hello"}]' > data/posts.json
npm run start    # serves GET/POST/PATCH/DELETE /posts on :3000
```

### Path B — Expert: `@json-express/core` + Specific Plugins

Install only the layers you want — `core` plus a config module, an adapter, an API generator, a transport, and a logger.

```bash
npm install @json-express/core @json-express/config-env \
            @json-express/adapter-memory @json-express/api-rest \
            @json-express/transport-fastify @json-express/logger-pino
```

`npm run start` and the engine auto-discovers everything you installed.

---

## 🧩 Infrastructure as Dependencies

JSONExpress's defining philosophy: **your application's infrastructure is defined entirely through composition in `package.json` dependencies.** You never write a `server.ts` or wire an IoC container — to swap a layer, install a different plugin.

- Want Fastify instead of Express? `npm install @json-express/transport-fastify`.
- Want JSON-file persistence instead of in-memory? `npm install @json-express/adapter-json`.
- Conflicts (two transports installed, etc.) are resolved either by setting `JEX.TRANSPORT=<package-name>` in `.env`, or by running the interactive wizard: `npx jex configure`.

---

## 🧠 How It Works Behind the Scenes

JSONExpress v2 is built on a "Headless Microkernel" architecture. The `@json-express/core` package contains **zero** HTTP or database logic — it acts as an orchestrator using an Inversion of Control (IoC) container, and ships the `json-express` binary that boots your server.

When you run `json-express`, the kernel boots in phases:
1. **Configuration:** Auto-discovers the installed `config-*` module and loads `.env`.
2. **Auto-Discovery:** Scans your `package.json` for the rest of the installed `@json-express/*` plugins.
3. **Registration:** Binds the Logger, Database, API Generator, and Server Transport into the IoC container.
4. **Boot:** The Database parses your data, the API Generator builds the routes, and the Transport server starts listening.

The runtime is non-interactive — if multiple plugins are installed in the same category and no `JEX.<CATEGORY>` env value is set, `core` errors out with a clear message. Use `npx jex configure` (see below) to write the choice to `.env`.

### The Default Stack

`@json-express/boot` bundles the recommended set:
- **Config:** [`@json-express/config-env`](./packages/config-env/README.md)
- **Logger:** [`@json-express/logger-console`](./packages/logger-console/README.md)
- **Server:** [`@json-express/transport-express`](./packages/transport-express/README.md)
- **API:** [`@json-express/api-rest`](./packages/api-rest/README.md)
- **Database:** [`@json-express/adapter-memory`](./packages/adapter-memory/README.md)
- **Docs:** [`@json-express/docs-light`](./packages/docs-light/README.md)

---

## 🛠 Developer Tooling: `jex`

The `@json-express/cli` package ships an offline `jex` binary for project workflows. It does **not** start the server — that's `json-express` from `@json-express/core`.

```bash
npx jex init my-app          # scaffold a new project pointing to @json-express/boot
npx jex configure            # pick a plugin per category and save to .env
npx jex export albums        # turn data/albums.json into a typed model under models/
```

Recommended as a `devDependency` or invoked via `npx`.

---

## 🧩 The Ecosystem

### 🛠️ Core & Tooling
* **[`@json-express/core`](./packages/core/README.md)** - Kernel + IoC container + Auto-Discovery Orchestrator. Provides the `json-express` binary.
* **[`@json-express/boot`](./presets/boot/README.md)** - "Batteries Included" preset bundling the recommended default stack.

### ⚙️ Configuration
* **[`@json-express/config-env`](./packages/config-env/README.md)** *(Default)* - Twelve-Factor `.env` configuration provider.

### 🌐 Transports (Server Layer)
* **[`@json-express/transport-express`](./packages/transport-express/README.md)** *(Default)* - Express.js server.
* **[`@json-express/transport-fastify`](./packages/transport-fastify/README.md)** - High-performance Fastify server.

### 🔌 API Paradigms
* **[`@json-express/api-rest`](./packages/api-rest/README.md)** *(Default)* - Standardized RESTful routes (`GET`, `POST`, `PATCH`, `DELETE`).
* **[`@json-express/api-graphql`](./packages/api-graphql/README.md)** - Generates a GraphQL schema and resolvers.

### 🗄️ Adapters (Database Layer)
* **[`@json-express/adapter-memory`](./packages/adapter-memory/README.md)** *(Default)* - Fast, in-memory storage.
* **[`@json-express/adapter-json`](./packages/adapter-json/README.md)** - Persists each collection as a JSON file on disk.

### 📊 Loggers (Observability Layer)
* **[`@json-express/logger-console`](./packages/logger-console/README.md)** *(Default)* - Zero-dependency standard output logging.
* **[`@json-express/logger-pino`](./packages/logger-pino/README.md)** - Enterprise high-performance structured JSON logging.

### 📚 Documentation Providers
* **[`@json-express/docs-light`](./packages/docs-light/README.md)** *(Default)* - Lightweight HTML manifest at `/docs`.
* **[`@json-express/docs-swagger`](./packages/docs-swagger/README.md)** - Interactive Swagger UI at `/docs`.

---

## 📄 License
[MIT License](LICENSE)
