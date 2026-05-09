<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# `@json-express/adapter-json`

> **Persistent JSON file database adapter for JSONExpress v2.**
> A zero-infrastructure, human-readable database that reads from and writes back to your project's `.json` files. Ideal for local development, small tools, and projects where Git-tracked data is a feature, not a compromise.

---

## How It Works

On boot, the adapter self-scans `process.cwd()` for `.json` files (excluding `package.json`, `tsconfig.json`, and config files). It loads each file into an in-memory store and records the file path for write-back.

On every **mutation** (create, update, delete):
1. The in-memory store is updated immediately (fast response to the client).
2. A **50ms debounced write** is queued — rapid mutations are batched into a single disk write.
3. The data is written to `<collection>.json.tmp` first.
4. `fs.rename()` atomically promotes the `.tmp` to the final file — safe even on process crash.

---

## Installation

```bash
npm install @json-express/adapter-json
```

JSONExpress auto-discovers this adapter. No registration code required.

---

## Zero Configuration Required

Just have `.json` files in your project directory:

```
my-project/
  users.json       ← auto-discovered
  posts.json       ← auto-discovered
  package.json     ← excluded automatically
```

Boot the server — all collections are ready.

---

## Switching Between Adapters

If both `adapter-json` and another adapter (e.g. `adapter-memory`) are available, use `.env` to pin your preference:

```env
# Use in-memory (no disk writes) even if adapter-json is installed
jex.adapter=@json-express/adapter-memory

# Or run the interactive wizard to select
# json-express --configure
```

---

## Persistence Guarantee

| Event | Behaviour |
|---|---|
| `POST /users` | Record added to memory + written to `users.json` within ~50ms |
| `PATCH /users/:id` | Record updated in memory + written to `users.json` |
| `DELETE /users/:id` | Record removed from memory + written to `users.json` |
| Server restart | All data from `.json` files is reloaded — mutations are preserved |
| Process crash | At most 50ms of writes could be lost (the debounce window) |

---

## Health Check

`isHealthy()` verifies that all tracked `.json` files are readable **and** writable. Used by `@json-express/plugin-health`:

```json
{ "status": "UP", "database": "connected" }
```

If any tracked file loses read/write access (e.g. permissions change):

```json
{ "status": "DOWN", "database": "disconnected" }
```

---

## Relational Data (`ref` / `id`)

Fully supports the JSONExpress relational linking system inherited from `adapter-memory`:

```json
// albums.json
[
  {
    "id": "1",
    "name": "Encore",
    "artist": { "ref": "artists", "id": "1" }
  }
]
```

`GET /albums` resolves the `artist` reference inline from the `artists` collection automatically.

---

## Performance

| Metric | Value |
|---|---|
| Read throughput | ~500k RPS (pure in-memory) |
| Write throughput | ~200–500 RPS (debounced disk I/O) |
| Max dataset size | Practical limit ~100MB (whole file loaded into RAM) |
| Crash durability | High — atomic rename, at most 50ms of data loss |

> For production workloads requiring > 500 RPS writes, use `@json-express/adapter-mongodb` or `@json-express/adapter-postgres`.

---

## 🛡️ Integrated Observability & Auditing

Every database operation is now automatically logged through the framework's centralized logger.
- **Tracing**: All logs are correlated with the framework-wide `traceId`.
- **Metadata**: It logs the **count** of records found for `getAll`/`search` and the **record ID** for `create`, `update`, and `delete`.
- **Privacy**: No actual record content (sensitive data) is ever written to the logs.

---

## Architecture Note

```
JsonFileDatabaseAdapter
  ├─ constructor()    → scans cwd, loads .json files, records file paths
  ├─ getAll/search   → in-memory with full ref resolution + metadata logging
  ├─ create          → add to store + _persist() + ID logging
  ├─ update          → mutate store + _persist() + ID logging
  ├─ delete          → remove from store + _persist() + ID logging
  ├─ _persist(col)   → debounced (50ms) atomic write → .tmp → rename
  └─ isHealthy()     → fs.access(R_OK | W_OK) on all tracked files
```
