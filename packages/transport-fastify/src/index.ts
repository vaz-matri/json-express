import Fastify from 'fastify';
import type { FastifyBaseLogger, FastifyTypeProviderDefault, RawServerBase, FastifyError, FastifyRequest, FastifyReply } from 'fastify';
import type { ITransport, RouteDefinition, JsonRequest, IConfigProvider } from '@json-express/core';

export class FastifyTransport implements ITransport {
    private fastify: ReturnType<typeof Fastify>;
    private config?: IConfigProvider;

    constructor({ configProvider }: { configProvider?: IConfigProvider } = {}) {
        this.config = configProvider;

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
        console.log(`[FastifyTransport] Registered route: ${route.method} ${route.path}`);

        this.fastify[method](route.path, async (request: FastifyRequest, reply: FastifyReply) => {
            const jsonRequest: JsonRequest = {
                method: request.method,
                path: request.url,
                body: request.body,
                query: request.query as Record<string, string | undefined>,
                params: request.params as Record<string, string | undefined>,
                headers: request.headers as Record<string, string | string[] | undefined>,
            };

            const jsonResponse = await route.handler(jsonRequest);

            if (jsonResponse.headers) {
                reply.headers(jsonResponse.headers);
            }

            reply.code(jsonResponse.statusCode ?? 200).send(jsonResponse.body);
        });
    }

    public start(port: number): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                await this.fastify.listen({ port, host: '0.0.0.0' });
                const isHttps = !!this.config?.get('transport.fastify.ssl.key');
                console.log(`🚀 [FastifyTransport] Server listening on ${isHttps ? 'https' : 'http'}://localhost:${port}`);
                resolve();
            } catch (err) {
                reject(err);
            }
        });
    }

    public stop(): Promise<void> {
        return this.fastify.close();
    }
}
