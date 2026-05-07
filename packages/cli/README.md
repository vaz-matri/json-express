# `@json-express/cli`

> **The Human Interface for JSON Express v2.**
> The CLI is the single entry point that orchestrates plugin discovery, conflict resolution, configuration, and server boot. It acts as the bridge between the headless `@json-express/core` kernel and the developer's project.

---

## Usage

```bash
# Boot the server (from your project directory)
npx json-express

# Or via package.json script
node /path/to/cli/bin/exec.js
```

---

## CLI Flags

| Flag | Description |
|---|---|
| `--configure` | Run the interactive plugin wizard to (re)select all core layer plugins |
| `--seed` | Seed the database with generated data if a collection is empty (idempotent) |
| `--seed-append` | Append a fresh batch of generated records on every boot, regardless of existing data |

---

## The `--configure` Flag (Plugin Wizard)

Running the server with `--configure` triggers an interactive wizard that lets you select your preferred plugin for each core layer:

```bash
npx json-express --configure
```

```
🔧 JSON Express — Plugin Configuration Wizard

? Select adapter plugin: › - Use arrow-keys. Return to submit.
❯   @json-express/adapter-memory (default)
    @json-express/adapter-json

? Select api plugin: › - Use arrow-keys. Return to submit.
❯   @json-express/api-rest (default)

? Select transport plugin: › - Use arrow-keys. Return to submit.
❯   @json-express/transport-express (default)

✅ Saved: jex.adapter=@json-express/adapter-memory
✅ Saved: jex.api=@json-express/api-rest
✅ Saved: jex.transport=@json-express/transport-express

🚀 Configuration saved. Booting server...
```

**Key behaviours:**
- Always runs all three prompts regardless of existing `.env` state
- Always includes the **bundled default as an explicit option**
- writes selections to `.env` **in-place** — running `--configure` twice never creates duplicate keys
- Boots the server normally after saving

---

## Pin to a Specific Plugin via `.env`

You can bypass the Auto-Discovery Engine and explicitly pin any layer to a specific plugin — including the bundled defaults:

```env
# Force back to the in-memory adapter
jex.adapter=@json-express/adapter-memory

# Force back to REST
jex.api=@json-express/api-rest

# Force a specific transport
jex.transport=@json-express/transport-fastify

# Pin to the high-performance Pino logger
jex.logger=@json-express/logger-pino
```

---

## Auto-Discovery Engine

On boot, the CLI reads the project's `package.json` and auto-discovers all `@json-express/*` packages:

| Situation                                    | Behaviour |
|----------------------------------------------|---|
| No custom plugin installed                   | Boots silently with the bundled default |
| One custom plugin installed                  | Silently overrides the default with the installed plugin |
| Two or more of the same category             | Pauses and prompts you to choose, saves to `.env` |
| `jex.{layer}` or `JEX.{LAYER}` set in `.env` | Respects the preference — including if it points to the bundled default |

---

## Baseline Observability (Always Available)

The CLI automatically registers two built-in lifecycle plugins requiring zero user configuration:

| Endpoint | Response |
|---|---|
| `GET /health` | `{"status":"UP"}` — overridden by `@json-express/plugin-health` if installed |
| `GET /info` | Uptime, Node version, platform, memory, environment |

---

## Architecture

```
CLI (startServer)
  ├─ Phase 1: Load Config (EnvConfigProvider)
  ├─ Phase 2: Auto-Discovery (scan package.json)
  ├─ Phase 3: Resolve Layers (logger / adapter / api / transport)
  │    ├─ Check .env preference → respect it (including defaults)
  │    ├─ --configure → always prompt with full choices list
  │    ├─ 1 custom plugin → silent override
  │    └─ 2+ of same category → conflict prompt → save to .env
  ├─ Phase 4: Resolve & Register Logger (First! Audit all other registers)
  ├─ Phase 5: Register Middlewares, Seeders, Lifecycle Plugins
  ├─ Phase 6: Register Baseline Health + Info plugins
  └─ Phase 7: Boot the Kernel
```
