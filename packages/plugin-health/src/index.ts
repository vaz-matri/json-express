import type { IPlugin, IConfigProvider, JsonRequest, JsonResponse, ITransport, IDatabaseAdapter, ILogger } from '@json-express/core';

export class HealthPlugin implements IPlugin {
    name = 'health';

    async onBoot(kernel: any, configProvider: IConfigProvider) {
        const logger: ILogger = kernel.container.resolve('logger').child({ component: 'Health' });

        try {
            const transport = kernel.container.resolve('transport') as ITransport;
            const db = kernel.container.resolve('database') as IDatabaseAdapter;

            // --- /health endpoint ---
            transport.registerRoute({
                method: 'GET',
                path: '/health',
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    try {
                        const isDbHealthy = typeof db.isHealthy === 'function'
                            ? await db.isHealthy()
                            : true;

                        if (isDbHealthy) {
                            return {
                                statusCode: 200,
                                body: { status: 'UP', database: 'connected' }
                            };
                        } else {
                            return {
                                statusCode: 503,
                                body: { status: 'DOWN', database: 'disconnected' }
                            };
                        }
                    } catch (e: any) {
                        return {
                            statusCode: 503,
                            body: { status: 'DOWN', error: e.message }
                        };
                    }
                }
            });

            // --- /info endpoint ---
            transport.registerRoute({
                method: 'GET',
                path: '/info',
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const memoryUsage = process.memoryUsage();
                    return {
                        statusCode: 200,
                        body: {
                            environment: configProvider.get('NODE_ENV', 'development'),
                            uptimeSeconds: process.uptime(),
                            timestamp: new Date().toISOString(),
                            system: {
                                nodeVersion: process.versions.node,
                                platform: process.platform,
                                memoryUsageMb: Math.round(memoryUsage.rss / 1024 / 1024 * 100) / 100
                            }
                        }
                    };
                }
            });

        } catch (e) {
            logger.warn(`Could not register health routes.`, { error: (e as any)?.message });
        }
    }
}
