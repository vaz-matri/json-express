# Local HTTPS dev certificate example

Generates a self-signed HTTPS certificate for `localhost` so you can develop against `https://localhost:3000` without browser warnings or `--insecure` curl flags.

Useful when your frontend uses APIs that only work over HTTPS (Service Workers, `crypto.subtle`, third-party SDKs that refuse plain HTTP).

> New to JSONExpress? Start with the [**`simple`** example](../simple/README.md) — that's the hub that explains the default stack and links to every other plugin.

## Setup

```bash
npm install @json-express/boot @json-express/plugin-devcert
```

That's it — **installing the plugin enables HTTPS by default.** No `.env` setting required.

Drop your data into `data/`:

```
data/
└── albums.json     # [{ "id": "1", "name": "Discovery" }]
```

## Run it

```bash
npm run serve
```

The first run prompts your OS keychain to trust the generated certificate (one time). After that, your API is available at `https://localhost:3000`:

```bash
curl https://localhost:3000/albums
```

## .env options

The plugin reads a single key — defaults shown:

| Key | Type | Default | Effect |
| --- | --- | --- | --- |
| `jex.https` | boolean | `true` | Installing the plugin opts you in to HTTPS. Set `false` to keep the dependency installed but boot over plain HTTP — useful for shared `.env.local` files where one teammate needs HTTP, or for non-interactive CI runs that can't accept a keychain prompt. |

```env
# Disable local HTTPS without uninstalling the plugin
jex.https=false
```

The plugin also disables itself automatically when `NODE_ENV=production` — production HTTPS termination should come from your reverse proxy / load balancer, not a self-signed dev cert.

## What's in this folder

- `package.json` — declares `@json-express/boot` and `@json-express/plugin-devcert`
- `data/` — your JSON collections
- `.env` — explicitly pins `jex.https=true`. Identical to the plugin's default, but kept in the file so the demo is self-describing. Set it to `false` to verify the opt-out path.
- `tests/plugin-devcert.spec.ts` — Playwright e2e suite. Drives `https://localhost:3000` with `ignoreHTTPSErrors: true` and verifies the docs page, CRUD, and that plain HTTP is refused. The first local run prompts your OS keychain to trust the dev CA.

## See also

- [`@json-express/plugin-devcert`](../../packages/plugin-devcert/README.md) — the package's own README
- [`config` example](../config/README.md) — the full inventory of `.env` keys every plugin reads
- [`simple` example](../simple/README.md) — the default stack and the directory of every other plugin
