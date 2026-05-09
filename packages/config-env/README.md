<img src="../../docs/public/logo-long-light.svg" alt="JSONExpress">

# @json-express/config-env

The default Configuration Provider for [JSONExpress](https://github.com/vaz-matri/json-express).

This lightweight plugin parses `.env` files and translates them into deeply nested configuration objects using JSONExpress's "Relaxed Binding" rules.

## 📦 Installation
Included by default via the `@json-express/cli`.

## ⚙️ How it Works

### 1. Spring Boot-Style Relaxed Binding
To prevent clashes with other tools (like Next.js or Docker), this plugin **only reads variables starting with the `jex.` or `jex_` prefix** (case-insensitive).

It uses strict, predictable rules to translate flat environment variables into deep JSON objects:
- **A dot (`.`)** creates a nested object.
- **An underscore (`_`)** is used for multi-word keys.

The framework **prefers lowercase** for `.env` files — it reads cleanly and matches typical config conventions:

```env
# 1. Basic properties
jex.port=4000
# -> { port: 4000 }

# 2. Nested blocks
jex.transport.express.logger=true
# -> { transport: { express: { logger: true } } }

# 3. Multi-word keys
jex.database.max_connections=100
# -> { database: { max_connections: 100 } }
```

### 2. The Cloud / Docker Fallback
Some hosting platforms (AWS, Docker, Kubernetes, systemd) **enforce uppercase** environment variable names and/or **forbid dots (`.`)**. For these cases, JSONExpress also accepts the all-uppercase, double-underscore form — case and separator are both flexible, and the parser maps them to the same JSON structure.

```env
# Deployment-safe equivalent (identical result)
JEX__TRANSPORT__EXPRESS__LOGGER=true
JEX__DATABASE__MAX_CONNECTIONS=100
```

You can swap freely between `jex.foo.bar` (dev) and `JEX__FOO__BAR` (prod) without changing any framework code.

### 3. Environment Cascading
It automatically detects your `NODE_ENV` (e.g., `production`, `test`) and cascades overrides in the following Twelve-Factor priority order:
1. System OS Variables (Highest)
2. `.env.[mode].local`
3. `.env.local`
4. `.env.[mode]`
5. `.env` (Lowest)
```
