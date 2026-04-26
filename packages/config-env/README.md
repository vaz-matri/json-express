# @json-express/config-env

The default Configuration Provider for [JSON Express](https://github.com/vaz-matri/json-express).

This lightweight plugin parses `.env` files and translates them into deeply nested configuration objects using JSON Express's "Relaxed Binding" rules.

## 📦 Installation
Included by default via the `@json-express/cli`.

## ⚙️ How it Works

### 1. Spring Boot-Style Relaxed Binding
To prevent clashes with other tools (like Next.js or Docker), this plugin **only reads variables starting with the `JEX.` or `JEX_` prefix**.

It uses strict, predictable rules to translate flat environment variables into deep JSON objects:
- **A dot (`.`)** creates a nested object.
- **An underscore (`_`)** is used for multi-word keys.

```env
# 1. Basic properties
JEX.PORT=4000
# -> { port: 4000 }

# 2. Nested blocks
JEX.TRANSPORT.EXPRESS.LOGGER=true
# -> { transport: { express: { logger: true } } }

# 3. Multi-word keys
JEX.DATABASE.MAX_CONNECTIONS=100
# -> { database: { max_connections: 100 } }
```

### 2. The Docker / AWS Fallback
Standard Linux terminals and some cloud providers (like AWS or Docker) strictly forbid dots (`.`) in environment variable names.

JSON Express natively supports the industry-standard **double-underscore (`__`)** fallback. You can seamlessly swap to this syntax in production without changing any framework code; it maps to the exact same JSON structure!

```env
# Deployment-safe equivalent
JEX__TRANSPORT__EXPRESS__LOGGER=true
JEX__DATABASE__MAX_CONNECTIONS=100
```

### 3. Environment Cascading
It automatically detects your `NODE_ENV` (e.g., `production`, `test`) and cascades overrides in the following Twelve-Factor priority order:
1. System OS Variables (Highest)
2. `.env.[mode].local`
3. `.env.local`
4. `.env.[mode]`
5. `.env` (Lowest)
```
