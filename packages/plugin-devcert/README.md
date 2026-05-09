<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# `@json-express/plugin-devcert`

> **Local HTTPS plugin for JSONExpress v2.**
> Drop it in your deps and your dev server boots over `https://localhost:3000` with a trusted certificate — no flags, no manual cert generation, no `--insecure` curl. Production builds short-circuit safely so you never request a keychain prompt where you shouldn't.

---

## Why It Exists

Modern browser APIs refuse to work over plain HTTP. Service Workers, `crypto.subtle`, the Web Push API, several third-party SDKs (Stripe, Auth0, OAuth flows that demand a `https://` redirect_uri) — all gate themselves behind a secure context.

Without this plugin, your options for local HTTPS are:

- Generate certs by hand with `openssl` and tell every teammate where to put them.
- Run behind `mkcert` and remember to keep its CA in sync.
- Suppress browser warnings and pollute curl with `-k`.

`plugin-devcert` wraps [`devcert`](https://github.com/davewasmer/devcert) so the cert is generated, installed into your OS keychain, and injected into the active transport at boot. Cached after the first run.

---

## Installation

```bash
npm install @json-express/plugin-devcert
```

JSONExpress auto-discovers it. **Installing the plugin enables HTTPS by default** — no `onRegister` call, no flag, no `.env` setting.

---

## How It Works

The plugin runs in the kernel's `onBoot` phase, before the transport binds to a port:

1. **Production guard** — bails out silently if `NODE_ENV === 'production'`. You never want a self-signed dev cert (or a keychain prompt) on a deployed server.
2. **Opt-out check** — reads `jex.https`. Default is `true`, so the plugin runs unless you explicitly set `jex.https=false`.
3. **Certificate** — calls `devcert.certificateFor('localhost')`. First run prompts the OS keychain to trust a freshly minted CA; subsequent runs reuse the cached cert.
4. **Hand-off** — writes `{ key, cert }` to `express.ssl` via `configProvider.set(...)`. `transport-express` reads the same key at `transport.start()` time and switches from `http.createServer` to `https.createServer`.

The hand-off is the [defensive-decoupling pattern](../../context/INTER_PACKAGE_ARCHITECTURE.md): neither package imports the other. If `transport-express` isn't the active transport, the cert is generated but ignored — harmless.

```
boot()
  ├─ onRegister phases
  ├─ resolve transport (express)
  ├─ onBoot
  │    └─ DevcertPlugin
  │         ├─ skip if NODE_ENV=production
  │         ├─ skip if jex.https=false
  │         └─ devcert.certificateFor('localhost')
  │              └─ configProvider.set('express.ssl', { key, cert })
  └─ transport.start(port)
       └─ reads express.ssl → https.createServer(...)
```

---

## Configuration

The plugin reads one key. Defaults shown.

| Key | Type | Default | Effect |
|---|---|---|---|
| `jex.https` | boolean | `true` | When `true`, generates a dev cert and binds it to `express.ssl`. Set `false` to keep the dependency installed but boot over plain HTTP. |

`.env`:

```env
# Disable local HTTPS without uninstalling
jex.https=false
```

The same key works in any config provider — `jex.config.json`, `jex.config.ts`, etc. See the [`config` example](../../example/config/README.md) for the full key inventory.

### Production behavior

`NODE_ENV=production` short-circuits the plugin **before** it touches `devcert` or the OS keychain. This is intentional — production HTTPS belongs to your reverse proxy (nginx, Traefik, an ALB, Cloud Run, etc.), not a per-process dev cert. There is no flag to override this; remove the plugin from your deploy if you somehow need it in prod.

---

## Transport Compatibility

| Transport | Supported | Notes |
|---|---|---|
| `transport-express` | ✅ | Reads `express.ssl` directly. |
| `transport-fastify` | ⚠️ partial | Use `jex.transport.fastify.ssl.{key,cert}` paths instead — this plugin doesn't write that key. |
| Custom transports | depends | If your transport reads `express.ssl`, it works. Otherwise mirror the pattern. |

---

## Architecture Note

This plugin implements `IPlugin`. It owns no routes, no middleware, no schemas — just a single `onBoot` side effect that mutates the shared config tree before the transport reads it.

```
CLI Auto-Discovery
  └─ Detects @json-express/plugin-devcert
       └─ DevcertPlugin.onBoot(kernel, configProvider)
            ├─ guard: NODE_ENV === 'production' → return
            ├─ guard: jex.https === false        → return
            ├─ devcert.certificateFor('localhost')
            └─ configProvider.set('express.ssl', { key, cert })
```

See the [`plugin-devcert` example](../../example/plugin-devcert/README.md) for a runnable end-to-end demo.
