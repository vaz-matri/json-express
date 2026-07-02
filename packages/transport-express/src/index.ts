import express, { Request, Response, NextFunction, Application } from 'express';
import http, { type Server as HttpServer } from 'http';
import type { Server as HttpsServer } from 'https';
import https from 'https';
import { randomUUID } from 'crypto';
import type { ITransport, RouteDefinition, JsonRequest, IConfigProvider, ILogger } from '@json-express/core';
import { RequestContext } from '@json-express/core';

export class ExpressTransport implements ITransport {
    private app: Application;
    private server: HttpServer | HttpsServer | null = null;
    private config?: IConfigProvider;
    private logger: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider, logger: ILogger }) {
        this.app = express();
        this.config = configProvider;
        this.logger = logger.child({ component: 'Express' });

        // Built-in middleware for parsing JSON requests
        this.app.use(express.json());

        // --- Consistent JSON error convention across all transports ---
        // 500 — unhandled errors from route handlers
        this.app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
            const statusCode = err.statusCode || err.status || 500;
            res.status(statusCode).json({
                statusCode,
                error: err.message || 'Internal Server Error'
            });
        });
    }

    public registerRoute(route: RouteDefinition): void {
        const method = route.method.toLowerCase() as 'get' | 'post' | 'patch' | 'delete';
        
        this.app[method](route.path, async (req: Request, res: Response, next: NextFunction) => {
            const traceId = randomUUID();
            const startTime = Date.now();

            const jsonRequest: JsonRequest = {
                method: req.method,
                path: req.originalUrl || req.path,
                body: req.body,
                query: req.query as Record<string, string>,
                params: req.params,
                headers: req.headers as Record<string, string | string[] | undefined>,
                traceId,
                protocol: req.protocol,
                hostname: req.hostname,
                originalUrl: req.originalUrl,
            };

            try {
                const jsonResponse = await RequestContext.run({ traceId, startTime }, () =>
                    route.handler(jsonRequest)
                );

                const latency = Date.now() - startTime;
                const statusCode = jsonResponse.statusCode ?? 200;

                // Post-response access log — industry standard
                this.logger.info(`${req.method} ${req.originalUrl || req.path} ${statusCode} (${latency}ms)`, { traceId });

                if (jsonResponse.headers) {
                    Object.entries(jsonResponse.headers).forEach(([key, value]) => {
                        res.setHeader(key, value);
                    });
                }

                const isHtml = res.getHeader('Content-Type') === 'text/html';
                if (isHtml) {
                    res.status(statusCode).send(jsonResponse.body);
                } else {
                    res.status(statusCode).json(jsonResponse.body);
                }
            } catch (error: any) {
                // Pass error to the centralized error middleware
                next(error);
            }
        });
    }

    public start(port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            // 404 — catch-all for unknown routes (registered LAST)
            this.app.use((req: Request, res: Response) => {
                res.status(404).json({
                    statusCode: 404,
                    error: `Route ${req.method}:${req.originalUrl || req.path} not found`
                });
            });

            const ssl = this.config?.get<{ key: Buffer | string; cert: Buffer | string }>('express.ssl');
            const protocol = ssl && ssl.key && ssl.cert ? 'https' : 'http';

            const onError = (err: NodeJS.ErrnoException) => {
                if (err.code === 'EADDRINUSE') {
                    this.logger.error(
                        `Port ${port} is already in use. Refusing to start so the deployment ` +
                        `platform's port contract isn't broken. Stop the other process ` +
                        `(\`lsof -i:${port}\`) or set jex.port to a different port.`,
                        { port, code: err.code }
                    );
                } else {
                    this.logger.error(
                        `Server failed to bind to port ${port}: ${err.message}`,
                        { port, code: err.code }
                    );
                }
                reject(err);
            };

            const onListening = () => {
                this.logger.info(`Server listening on ${protocol}://localhost:${port}`);
                resolve();
            };

            this.server = protocol === 'https'
                ? https.createServer(ssl as any, this.app)
                : http.createServer(this.app);

            this.server.once('error', onError);
            this.server.once('listening', onListening);
            this.server.listen(port);
        });
    }

    public stop(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.server) {
                this.server.close((err) => {
                    if (err) return reject(err);
                    this.server = null;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

export default ExpressTransport;
