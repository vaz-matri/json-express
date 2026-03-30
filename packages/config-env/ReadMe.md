# @json-express/config-env

The default Configuration Provider for [JSON Express](https://github.com/vaz-matri/json-express).

This lightweight plugin parses `.env` files and translates them into deeply nested configuration objects using JSON Express's "Relaxed Binding" rules.

## 📦 Installation
Included by default via the `@json-express/cli`.

## ⚙️ How it Works

### 1. The Prefix & Relaxed Binding
To prevent clashes with other tools (like Next.js or Docker), this plugin **only reads variables starting with `JEX_`**.
- A dot (`.`) translates to a nested object.
- An underscore (`_`) is used for multi-word keys.

```env
# Translates to: { database: { max_connections: 100 } }
JEX_DATABASE_MAX_CONNECTIONS=100

# Translates to: { transport: { express: { port: 8080 } } }
JEX_TRANSPORT.EXPRESS.PORT=8080
```

### 2. Environment Cascading
It automatically detects your `NODE_ENV` (e.g., `production`, `test`) and cascades overrides in the following Twelve-Factor priority order:
1. System OS Variables (Highest)
2. `.env.[mode].local`
3. `.env.local`
4. `.env.[mode]`
5. `.env` (Lowest)
