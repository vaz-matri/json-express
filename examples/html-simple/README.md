<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# HTML frontend + JSON Express API example

A minimal static HTML page that consumes a JSON Express API. Useful as a starting point for "small frontend, small backend" projects where you don't want a build step or a frontend framework.

> New to JSON Express? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot
```

Drop your data into `data/`:

```
data/
└── users.json     # []
```

## Run it

In one terminal, start the API:

```bash
npm run serve
```

In another, open `index.html` directly in your browser (the page calls `http://localhost:3000/users`).

You'll see an empty users table. Create one from the command line:

```bash
curl -X POST http://localhost:3000/users \
  -H 'content-type: application/json' \
  -d '{"username":"alice","email":"alice@example.com"}'
```

Refresh the page — `alice` shows up.

## What's in this folder

- `index.html` — the static frontend, with vanilla JS that fetches `/users` and renders a table
- `styles.css` — basic styling
- `package.json` — declares `@json-express/boot`
- `data/` — your JSON collections

## See also

- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
