import Fastify from 'fastify';
import { randomUUID } from 'crypto';
import type { FastifyBaseLogger, FastifyTypeProviderDefault, RawServerBase, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import type { ITransport, RouteDefinition, JsonRequest, IConfigProvider, ILogger } from '@json-express/core';
import { RequestContext } from '@json-express/core';

export class FastifyTransport implements ITransport {
    private fastify: ReturnType<typeof Fastify>;
    private config?: IConfigProvider;
    private logger: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider, logger: ILogger }) {
        this.config = configProvider;
        this.logger = logger.child({ component: 'Fastify' });

        const enableLogger = this.config?.get<boolean>('transport.fastify.logger', false) ?? false;

        // Only pass https option if BOTH key AND cert are present
        const sslKey = this.config?.get<string>('transport.fastify.ssl.key');
        const sslCert = this.config?.get<string>('transport.fastify.ssl.cert');

        if (sslKey && sslCert) {
            // @ts-ignore — Fastify v5 https option requires the https server options type
            this.fastify = Fastify({ logger: enableLogger, https: { key: sslKey, cert: sslCert } });
        } else {
            // HTTP mode — do NOT pass https key at all (even as undefined causes type branching in Fastify v5)
            this.fastify = Fastify({ logger: enableLogger });
        }

        // --- Consistent JSON error convention across all transports ---
        // NOTE: Fastify is kept in permissive (schema-less) mode.
        //       If @json-express/middleware-validation is installed, Zod handles
        //       all body/query validation before the handler is reached.

        // 500 — unhandled errors from route handlers
        this.fastify.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
            const statusCode = (error.statusCode ?? 500) as number;
            reply.code(statusCode).send({
                statusCode,
                error: error.message || 'Internal Server Error',
            });
        });

        // 404 — no matching route
        this.fastify.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
            reply.code(404).send({
                statusCode: 404,
                error: `Route ${request.method}:${request.url} not found`,
            });
        });
    }

    public registerRoute(route: RouteDefinition): void {
        const method = route.method.toLowerCase() as 'get' | 'post' | 'patch' | 'delete';

        this.fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
            const traceId = randomUUID();
            const startTime = Date.now();

            const jsonRequest: JsonRequest = {
                method: request.method,
                path: request.url,
                body: request.body,
                query: request.query as Record<string, string | undefined>,
                params: request.params as Record<string, string | undefined>,
                headers: request.headers as Record<string, string | string[] | undefined>,
                traceId,
                protocol: request.protocol,
                hostname: request.hostname,
                originalUrl: request.raw.url,
                ip: request.ip ?? request.socket?.remoteAddress,
            };

            const jsonResponse = await RequestContext.run({ traceId, startTime }, () =>
                route.handler(jsonRequest)
            );

            const latency = Date.now() - startTime;
            const statusCode = jsonResponse.statusCode ?? 200;

            // Post-response access log
            this.logger.info(`${request.method} ${request.url} ${statusCode} (${latency}ms)`, { traceId });

            if (jsonResponse.headers) {
                reply.headers(jsonResponse.headers);
            }

            reply.code(statusCode).send(jsonResponse.body);
        });
    }

    public async start(port: number): Promise<void> {
        try {
            await this.fastify.listen({ port, host: '0.0.0.0' });
            const isHttps = !!this.config?.get('transport.fastify.ssl.key');
            this.logger.info(`Server listening on ${isHttps ? 'https' : 'http'}://localhost:${port}`);
        } catch (err: any) {
            if (err?.code === 'EADDRINUSE') {
                this.logger.error(
                    `Port ${port} is already in use. Refusing to start so the deployment ` +
                    `platform's port contract isn't broken. Stop the other process ` +
                    `(\`lsof -i:${port}\`) or set jex.port to a different port.`,
                    { port, code: err.code }
                );
            } else {
                this.logger.error(
                    `Server failed to bind to port ${port}: ${err?.message ?? err}`,
                    { port, code: err?.code }
                );
            }
            throw err;
        }
    }

    public stop(): Promise<void> {
        return this.fastify.close();
    }
}

export default FastifyTransport;
