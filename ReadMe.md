<picture>
  <source media="(prefers-color-scheme: dark)" srcset="logo/logo_long_desc_dark.svg">
  <source media="(prefers-color-scheme: light)" srcset="logo/logo_long_desc.svg">
  <img src="logo/logo_long_desc.svg" alt="JSON Express">
</picture>

Skip the backend bottleneck and go from prototype to MVP launch faster.
**JSON Express v2.0** is a highly modular, pluggable Meta-Framework. It instantly converts your JSON files into a complete server, providing the practical infrastructure you need until your dedicated backend is ready.

visit[jsonexpress.com](https://jsonexpress.com)

## ✨ Features
- **Zero-Config REST API** - Instantly generates GET, POST, PATCH, and DELETE operations based on your files.
- **Relational Data** - Automatically resolves linked data across collections using `id` and `ref`.
- **Agnostic Microkernel** - Pluggable architecture! Swap out the Database, Server (Transport), or API Paradigm without rewriting your business logic.
- **Auto-Discovery** - Install a plugin and the CLI automatically detects and wires it up. No boilerplate needed.
- **Twelve-Factor Configuration** - Cascading environment variables and smart configurations built for enterprise.

---

## 🚀 Installation & Quick Start

You can run JSON Express globally for instant prototyping, or install it locally to customize your stack.

### Option A: The Global Quick-Start (Zero Config)
Get up and running in seconds without installing anything in your project.

```bash
# 1. Create a directory for your data
$ mkdir my-api && cd my-api

# 2. Create some JSON data
$ echo '[{"id": "1", "name": "The Marshall Mathers LP", "artist": "Eminem"}]' > albums.json

# 3. Run JSON Express via npx!
$ npx @json-express/cli
```

### Option B: Local Installation (For Customization)
If you want to override default plugins, manage dependencies, or use advanced configurations:

```bash
# Install the CLI as a dev dependency
$ npm install @json-express/cli -D

# Add a script to your package.json
# "scripts": { "dev": "json-express" }

# Start the server
$ npm run dev
```

---

## 🧠 How It Works Behind the Scenes

JSON Express v2 is built on a "Headless Microkernel" architecture. The `@json-express/core` package contains **zero** HTTP or database logic. It acts purely as an orchestrator using an Inversion of Control (IoC) container.

When you start the CLI, the Kernel boots in phases:
1. **Configuration:** Loads environment variables and config files.
2. **Auto-Discovery:** Scans your `package.json` to see which plugins you have installed.
3. **Registration:** Binds the Database, API Generator, and Server Transport layers together.
4. **Boot:** The Database parses your data, the API Generator builds the routes, and the Transport server starts listening!

### The Default Stack ("Batteries Included")
If you run the CLI without installing any custom plugins, it automatically falls back to its highly-capable default stack:
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
* *(Upcoming)* `@json-express/transport-fastify` - High-performance Fastify server.
* *(Upcoming)* `@json-express/transport-h3` - Lightweight, edge-ready h3 server.

### 🔌 API Paradigms
* **[`@json-express/api-rest`](./packages/api-rest/ReadMe.md)** *(Default)* - Standardized RESTful routes (`GET`, `POST`, `PATCH`, `DELETE`).
* *(Upcoming)* `@json-express/api-graphql` - Generates a GraphQL schema and resolvers.

### 🗄️ Adapters (Database Layer)
* **[`@json-express/adapter-memory`](./packages/adapter-memory/ReadMe.md)** *(Default)* - Fast, in-memory local JSON file storage.
* *(Upcoming)* `@json-express/adapter-mongodb` - Persists your data to MongoDB.

### ⚙️ Configuration Providers

JSON Express relies on cascading, environment-aware configurations.
By default, you can configure your server using a `.env` file. To avoid conflicts with other tools in your workspace, all JSON Express variables must be prefixed with the **`JEX`** namespace.

We use **Spring Boot-style Relaxed Binding**, meaning you can use dot-notation for highly readable configurations right inside your `.env` file!

```env
# .env
JEX.PORT=8080
JEX.TRANSPORT.EXPRESS.LOGGER=true
JEX.API.REST.PREFIX=/api/v1
```

*(Note: If you are deploying to Docker, AWS, or an OS that strictly forbids dots in environment variables, JSON Express seamlessly supports double-underscores as a fallback: `JEX__TRANSPORT__EXPRESS__LOGGER=true`)*

For advanced, deeply nested configurations, install `@json-express/config` and create a `jex.config.json` (or `.yml`, `.ts`):

```json
{
  "port": 8080,
  "transport": {
    "express": {
      "logger": true
    }
  },
  "api": {
    "rest": {
      "prefix": "/api/v1"
    }
  }
}
```

Read more about each packages
* **[`@json-express/config-env`](./packages/config-env/ReadMe.md)** *(Default)* - Lightweight parser for cascading `.env` files.
* **[`@json-express/config`](./packages/config)** - Advanced parser for YAML, deep JSON, and functional JS/TS files.

---

## 📄 License
[MIT License](LICENSE)
