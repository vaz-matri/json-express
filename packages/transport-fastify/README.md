# @json-express/transport-fastify

High-performance Fastify transport plugin for JSON Express v2.

## ✨ Features

- **Blazing Fast** - Leverages Fastify for 3-10x better performance than Express.
- **Built-in Logging** - Integrated with Pino for structured JSON logging.
- **Native HTTPS** - Support for secure connections without external wrappers.
- **Consistent JSON Errors** - Standardized JSON error responses for 404s and 500s.
- **Permissive by Default** - Optimized for use with `@json-express/middleware-validation` (Zod).

## 🚀 Installation

```bash
npm install @json-express/transport-fastify
```

## ⚙️ Configuration

JSON Express will automatically detect and use this transport if it is the only one installed. You can explicitly pin it in your `.env` or config file:

```env
jex.transport=@json-express/transport-fastify
```

### Automated Access Logging & Tracing
The Fastify transport now automatically performs **post-response access logging** using the framework's configured logger.
- It generates a unique `traceId` via `AsyncLocalStorage` for every request.
- It logs the method, path, status code, and latency (in ms) once the request is complete.
- **No configuration required.** The old `transport.fastify.logger` flag has been deprecated and superseded by this automated behavior.

### Options

| Key | Type | Default | Description |
|---|---|---|---|
| `transport.fastify.ssl.key` | `string` | `undefined` | Path to SSL key file or raw PEM string. |
| `transport.fastify.ssl.cert` | `string` | `undefined` | Path to SSL certificate file or raw PEM string. |

## 🛡️ Validation & Strict Mode

By default, this transport is permissive to match Express behavior. We recommend using [`@json-express/middleware-validation`](../middleware-validation) to handle schema enforcement via Zod. This ensures validation logic remains agnostic of the underlying server technology.

## 📄 License

MIT
