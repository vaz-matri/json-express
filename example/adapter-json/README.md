<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# JSON file storage example

A minimal JSONExpress setup where your collections live as plain `.json` files on disk and survive server restarts.

Drop a JSON array into `data/`, start the server, and you immediately get a REST API for it. Any `POST` / `PATCH` / `DELETE` is written back to the same file.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/adapter-json
```

This swaps the default in-memory adapter for [`@json-express/adapter-json`](../../packages/adapter-json/README.md). The rest of the stack (`api-rest`, `transport-express`, `logger-console`, `docs-light`) still comes from [`@json-express/boot`](../../presets/boot/README.md).

Create a `.env` so the framework knows to use file-backed storage instead of the default:

```env
jex.adapter=@json-express/adapter-json
```

Drop your data into `data/`:

```
data/
└── notes.json     # [{ "id": "1", "title": "Buy groceries", "done": false }]
```

The filename becomes the collection name. The schema is inferred from the first record.

## Run it

```bash
npm run serve
```

You now have a REST API on `http://localhost:3000`:

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/notes` | List all notes |
| `GET` | `/notes/:id` | Get one note |
| `POST` | `/notes` | Create a note |
| `PATCH` | `/notes/:id` | Update fields on a note |
| `DELETE` | `/notes/:id` | Remove a note |

Try it:

```bash
curl http://localhost:3000/notes
curl -X POST http://localhost:3000/notes \
  -H 'content-type: application/json' \
  -d '{"title":"Learn JSONExpress","done":false}'
```

Open `data/notes.json` after the `POST` — your new record is there. Restart the server and it's still there.

## Adding more collections

Drop another file into `data/`:

```
data/
├── notes.json
└── comments.json
```

You'll get `/comments` routes automatically on the next start.

## What's in this folder

- `package.json` — declares the two dependencies and the `serve` script
- `.env` — points the framework at `adapter-json`
- `data/` — your JSON collections

## See also

- [`@json-express/adapter-json`](../../packages/adapter-json/README.md) — the package's own README, with options and internals
- [`simple` example](../simple/README.md) — the default in-memory stack, plus the full directory of every other plugin and example
