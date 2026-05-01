---
title: "@json-express/cli"
description: "The zero-config CLI that auto-discovers plugins, resolves conflicts, and boots your JSONExpress application."
---

# @json-express/cli

> The intelligent command-line interface for JSONExpress.

The `@json-express/cli` package is the primary entry point for running a JSONExpress application. When you execute `npx json-express`, the CLI scans your local `package.json`, auto-discovers every installed `@json-express/*` plugin, dynamically imports them, and boots the Kernel.

You never have to manually wire plugins together. The CLI handles it all.

## Installation

```bash
npm install @json-express/cli
```

## Usage

```bash
# Start the server (auto-discovers all installed plugins)
npx json-express

# Start with the interactive configuration wizard
npx json-express --configure

# Start and seed the database with mock data
npx json-express --seed

# Export a schema definition to stdout
npx json-express export users
```

## Core Features

### 1. Auto-Discovery Engine
The CLI reads your `package.json` and filters all dependencies matching the `@json-express/*` namespace. It then categorizes them by type:
*   **Transports:** `transport-express`, `transport-fastify`
*   **Adapters:** `adapter-memory`, `adapter-json`
*   **API Generators:** `api-rest`, `api-graphql`
*   **Middleware:** `middleware-auth`, `middleware-validation`
*   **Plugins:** `plugin-identity`, `plugin-health`, `plugin-devcert`

Each category has a sensible **default** (e.g., `adapter-memory` for databases). If you install a different plugin in that category, the CLI will silently swap to it.

### 2. Conflict Resolution
If you install *two* plugins in the same category (e.g., both `transport-express` and `transport-fastify`), the CLI will detect the conflict and launch an **interactive prompt** asking you to choose. Your selection is saved to `.env` so you are never prompted again.

### 3. The `--configure` Wizard
Running `npx json-express --configure` forces the interactive prompt for *every* plugin category, allowing you to reconfigure your entire stack in seconds. All selections are persisted as `JEX.*` keys in your `.env` file.

### 4. Schema Loader
On boot, the CLI scans both `/models` (TypeScript schemas) and `/data` (raw JSON files). It merges them using the override rule: if a TypeScript model exists with the same name as a JSON file, the TypeScript schema wins.

### 5. Graceful Shutdown
The CLI captures `SIGINT` (Ctrl+C) and `SIGTERM` signals and executes a clean `kernel.shutdown()`, ensuring all database connections are closed and in-flight requests are drained.

## Related Ecosystem Packages
*   **[@json-express/core](/packages/core):** The Kernel that the CLI boots after plugin discovery.
*   **[@json-express/config-env](/packages/config-env):** The default configuration provider that reads `JEX.*` environment variables.
