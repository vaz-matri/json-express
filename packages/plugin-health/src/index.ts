import type { IPlugin, IConfigProvider, JsonRequest, JsonResponse, IDatabaseAdapter, ILogger } from '@json-express/core';
import type { JsonExpressKernel } from '@json-express/core';

export class HealthPlugin implements IPlugin {
    name = 'health';

    async onBoot(kernel: JsonExpressKernel, configProvider: IConfigProvider) {
        const logger: ILogger = kernel.container.resolve('logger').child({ component: 'Health' });

        try {
            const db = kernel.container.resolve('database') as IDatabaseAdapter;

            // --- /health endpoint ---
            kernel.registerRoute({
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
            kernel.registerRoute({
                method: 'GET',
                path: '/info',
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const memoryUsage = process.memoryUsage();
                    // NODE_ENV lives in the container (registered by kernel.boot),
                    // not in the jex.* config namespace.
                    let environment = 'development';
                    try { environment = kernel.container.resolve<string>('NODE_ENV'); } catch { /* pre-boot */ }
                    return {
                        statusCode: 200,
                        body: {
                            environment,
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

export default HealthPlugin;
