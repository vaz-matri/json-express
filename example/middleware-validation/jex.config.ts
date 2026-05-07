// Framework-level configuration. Read by `@json-express/config` (advanced provider).
// With the default `@json-express/config-env`, the same keys live in `.env` as
// `jex.transport.port=4000`, `jex.cors.origin=...`, etc.
//
// Validation rules do NOT belong here — they live in `models/<entity>.ts`.

export default ({ env }: { env: string }) => ({
    transport: {
        port: 3000,
        host: '0.0.0.0',
    },
    logger: {
        level: env === 'production' ? 'warn' : 'debug',
    },
    cors: {
        origin: '*',
    },
});
