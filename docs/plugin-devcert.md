---
title: "@json-express/plugin-devcert"
description: "Automatically generate trusted local SSL certificates for JSONExpress HTTPS development."
---

# @json-express/plugin-devcert

> Official local SSL certificate generator for JSONExpress.

The `@json-express/plugin-devcert` package implements `IPlugin` and uses the `devcert` library to automatically generate locally-trusted SSL certificates for `localhost`. This eliminates browser security warnings and allows you to test secure cookies, webhook integrations, and OAuth flows during local development.

## Installation

```bash
npm install @json-express/plugin-devcert
```

## Configuration

**Installing the plugin enables HTTPS by default.** No `.env` change required.

When the JSONExpress server boots, the Devcert plugin will:
1. Check if local SSL certificates already exist for `localhost`.
2. If not, generate them and install them into your system's trust store (you may be prompted for your system password once).
3. Inject the `key` and `cert` buffers directly into the `express.ssl` configuration slot.
4. `@json-express/transport-express` detects the SSL configuration and boots an `https.createServer`.

### Opt-out

If you need to keep the plugin in your dependencies but boot over plain HTTP — for example a CI run that can't accept a keychain prompt, or a shared `.env.local` where one teammate is on HTTP — set:

```bash
# .env
jex.https=false
```

| Key | Type | Default | Effect |
|---|---|---|---|
| `jex.https` | boolean | `true` | When `true`, generates a dev cert and writes it to `express.ssl`. Set `false` to disable without uninstalling. |

## Core Features

### 1. Production Safety
The plugin includes an explicit **production guard**. If `NODE_ENV=production`, the plugin silently aborts and does nothing. This prevents accidental keychain access or `sudo` prompts on production servers, where SSL should always be handled by a reverse proxy like Nginx or a cloud load balancer.

### 2. One-Time Trust Installation
The first time you run the plugin, `devcert` will install a local Certificate Authority (CA) into your operating system's trust store. After this one-time setup, every subsequent boot is instant — no prompts, no passwords.

### 3. Dynamic Configuration Injection
The plugin uses the `configProvider.set()` API to dynamically inject the SSL key and certificate at runtime. This means your configuration files never contain hardcoded file paths to `.pem` files — the entire lifecycle is fully automated.

## Related Ecosystem Packages
*   **[@json-express/transport-express](/transport-express):** The transport that consumes the injected `express.ssl` configuration to boot an HTTPS server.
*   **[@json-express/transport-fastify](/transport-fastify):** Also supports the injected SSL configuration for Fastify-based HTTPS.
