import express, { Request, Response, Application } from 'express';
import type { Server } from 'http';
import type { ITransport, RouteDefinition, JsonRequest } from '@json-express/core';

export class ExpressTransport implements ITransport {
    private app: Application;
    private server: Server | null = null;

    constructor() {
        this.app = express();

        // Built-in middleware for parsing JSON requests
        this.app.use(express.json());
    }

    /**
     * Translates a generic RouteDefinition into an Express route
     */
    public registerRoute(route: RouteDefinition): void {
        const method = route.method.toLowerCase() as 'get' | 'post' | 'patch' | 'delete';

        this.app[method](route.path, async (req: Request, res: Response) => {
            try {
                // 1. Map Express Request to our agnostic JsonRequest
                const jsonRequest: JsonRequest = {
                    body: req.body,
                    query: req.query as Record<string, string>,
                    params: req.params,
                    headers: req.headers as Record<string, string | string[] | undefined>
                };

                // 2. Call the framework's agnostic handler
                const jsonResponse = await route.handler(jsonRequest);

                // 3. Map the generic JsonResponse back to an Express Response
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

    /**
     * Starts the Express server
     */
    public start(port: number): Promise<void> {
        return new Promise((resolve) => {
            this.server = this.app.listen(port, () => {
                console.log(`🚀 [ExpressTransport] Server listening on http://localhost:${port}`);
                resolve();
            });
        });
    }

    /**
     * Stops the Express server safely
     */
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
