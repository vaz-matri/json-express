# Pino structured logging example

Swaps the default pretty console logger for [Pino](https://getpino.io). You get one JSON object per line, automatic `traceId` correlation across components, and output that drops straight into Datadog, Loki, CloudWatch, or any other log aggregator.

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/logger-pino
```

Tell the framework to use Pino instead of the default console logger:

```env
jex.logger=@json-express/logger-pino
```

> The framework treats `__` and `.` as nesting separators and is case-insensitive — `jex__logger`, `jex.logger`, and `JEX.LOGGER` all work. Use `__` when your platform forbids dots in env keys.

Drop your data into `data/`:

```
data/
└── albums.json     # [{ "id": "1", "name": "The Marshall Mathers LP", "artist": "Eminem" }]
```

## Run it

```bash
npm run serve
```

By default Pino writes to `./logs/app.log` — one JSON object per line, ready to ship:

```json
{"level":30,"time":1714000000000,"pid":49434,"hostname":"...","component":"Express","msg":"Server listening on http://localhost:3000"}
{"level":30,"time":1714000000123,"pid":49434,"hostname":"...","component":"API-REST","traceId":"3372e241-3fdf-425a-bc91-421140ffeffd","msg":"Handling albums.getAll"}
{"level":30,"time":1714000000125,"pid":49434,"hostname":"...","component":"DB-Memory","traceId":"3372e241-3fdf-425a-bc91-421140ffeffd","count":1,"msg":"Read all from 'albums'"}
{"level":30,"time":1714000000126,"pid":49434,"hostname":"...","component":"Express","traceId":"3372e241-3fdf-425a-bc91-421140ffeffd","msg":"GET /albums 200 (3ms)"}
```

The matching `traceId` lets you follow a single request across the transport, API, and adapter layers in any aggregator.

### Stream to stdout instead

Switch the destination and turn on pretty printing for a colorized, human-readable dev stream:

```env
jex.log.path=stdout
jex.log.pretty=true
```

## Test it

The bundled Playwright suite verifies the log file is well-formed JSON, that boot logs are emitted, and that a single request produces lines stamped with one shared `traceId` across `Express`, `API-REST`, and `DB-Memory`:

```bash
npm test
```

## What's in this folder

- `package.json` — declares `@json-express/boot` and `@json-express/logger-pino`
- `.env` — points the framework at the Pino logger
- `data/albums.json` — seed collection
- `tests/logger-pino.spec.ts` — log file shape, traceId correlation, and CRUD regression checks

## See also

- [`@json-express/logger-pino`](../../packages/logger-pino/README.md) — the package's own README
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
