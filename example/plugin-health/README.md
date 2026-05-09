<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# Health & info endpoints example

Adds `/health` and `/info` endpoints to your server — the same shape Kubernetes, ECS, and most uptime checkers expect for liveness and readiness probes.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/plugin-health
```

The plugin auto-registers — no `.env` change required.

Drop a JSON collection next to `package.json`:

```
albums.json     # [{ "name": "Encore", "releaseDate": "12-11-2004" }]
```

## Run it

```bash
npm run serve
```

You get the standard CRUD routes for your collections, plus two extras:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/health` | Liveness check — `{ status: "UP", database: "connected" }` |
| `GET` | `/info` | Build info — environment, uptime, Node version, memory usage |

```bash
curl http://localhost:3000/health
curl http://localhost:3000/info
```

The `/health` link also appears in the docs page footer (`/docs`) when this plugin is installed.

## What's in this folder

- `package.json` — declares `@json-express/boot` and `@json-express/plugin-health`
- `albums.json` — sample collection served as `/albums`

## See also

- [`@json-express/plugin-health`](../../packages/plugin-health/README.md) — the package's own README
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
