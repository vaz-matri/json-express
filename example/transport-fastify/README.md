# Fastify transport example

Swaps the default Express HTTP server for Fastify. Same routes, same JSON files — just a different transport underneath.

> New to JSON Express? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/transport-fastify
```

Because `@json-express/boot` ships `@json-express/transport-express` as the default transport, both transports are now installed side by side. Tell the CLI which one to use:

```env
# .env
jex.transport=@json-express/transport-fastify
```

Drop your data into `data/`:

```
data/
└── albums.json     # [{ "id": "1", "name": "...", "artist": "..." }]
```

## Run it

```bash
npm run serve
```

You now have the same REST surface on `http://localhost:3000`, served by Fastify:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/albums` | List albums |
| `GET` | `/albums/:id` | Get one album |
| `POST` | `/albums` | Create an album |
| `PATCH` | `/albums/:id` | Update an album |
| `DELETE` | `/albums/:id` | Remove an album |

```bash
curl http://localhost:3000/albums
curl -X POST http://localhost:3000/albums \
  -H 'content-type: application/json' \
  -d '{"name":"Discovery","artist":"Daft Punk"}'
```

## What's in this folder

- `package.json` — declares `@json-express/boot` and `@json-express/transport-fastify`
- `.env` — picks Fastify over the bundled Express transport
- `data/` — your JSON collections (single source of truth for the test, too)
- `tests/` — Playwright CRUD parity suite

## See also

- [`@json-express/transport-fastify`](../../packages/transport-fastify/README.md) — the package's own README
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
