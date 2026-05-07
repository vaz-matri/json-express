# API prefix example

Mounts every generated route under a configurable prefix (e.g. `/api`) instead of the root path. Useful when your service shares a domain with a frontend or sits behind a reverse proxy that strips a path prefix.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot
```

Set the prefix in `.env`:

```env
jex.api.rest.prefix=/api
```

> The framework treats `__` and `.` as nesting separators. `jex__api__rest__prefix=/api` works identically — useful on cloud platforms that disallow dots in env var names.

Drop your data into `data/`:

```
data/
└── items.json     # []
```

## Run it

```bash
npm run serve
```

All collection routes now live under `/api`:

```bash
# ❌ 404 — root path is no longer used
curl http://localhost:3000/items

# ✅ 200 — under the configured prefix
curl http://localhost:3000/api/items

curl -X POST http://localhost:3000/api/items \
  -H 'content-type: application/json' \
  -d '{"name":"Widget","price":9.99}'
```

The docs page at `/docs` and any framework-internal routes are unaffected — only your collection endpoints get the prefix.

## What's in this folder

- `package.json` — declares `@json-express/boot`
- `.env` — sets the `/api` prefix
- `data/` — your JSON collections

## See also

- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
