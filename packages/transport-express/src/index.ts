import express, { Request, Response, NextFunction, Application } from 'express';
import type { Server } from 'http';
import type { ITransport, RouteDefinition, JsonRequest, IConfigProvider } from '@json-express/core';

export class ExpressTransport implements ITransport {
    private app: Application;
    private server: Server | null = null;
    private config?: IConfigProvider;

    constructor({ configProvider }: { configProvider?: IConfigProvider } = {}) {
        this.app = express();
        this.config = configProvider;

        // Built-in middleware for parsing JSON requests
        this.app.use(express.json());

        // 🌟 New Feature: Optional Logger driven by Config
        if (this.config?.get('transport.express.logger', false)) {
            this.app.use((req: Request, res: Response, next: NextFunction) => {
                console.log(`[Express] ${req.method} ${req.originalUrl}`);
                next();
            });
        }
    }

    public registerRoute(route: RouteDefinition): void {
        const method = route.method.toLowerCase() as 'get' | 'post' | 'patch' | 'delete';

        this.app[method](route.path, async (req: Request, res: Response) => {
            try {
                const jsonRequest: JsonRequest = {
                    method: req.method,
                    path: req.originalUrl || req.path,
                    body: req.body,
                    query: req.query as Record<string, string>,
                    params: req.params,
                    headers: req.headers as Record<string, string | string[] | undefined>
                };

                const jsonResponse = await route.handler(jsonRequest);

                if (jsonResponse.headers) {
                    Object.entries(jsonResponse.headers).forEach(([key, value]) => {
                        res.setHeader(key, value);
                    });
                }

                res.status(jsonResponse.statusCode || 200).json(jsonResponse.body);
            } catch (error: any) {
                console.error(`❌ [ExpressTransport] Error on ${route.method} ${route.path}:`, error);
                res.status(500).json({ error: error.message || 'Internal Server Error' });
            }
        });
    }

    public start(port: number): Promise<void> {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                console.log(`🚀 [ExpressTransport] Server listening on http://localhost:${port}`);
                resolve();
            });
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
