import type { IPlugin, IConfigProvider, JsonRequest, JsonResponse, ITransport, IDatabaseAdapter, ILogger } from '@json-express/core';

export class AdvancedHealthPlugin implements IPlugin {
    name = 'advanced-health';

    async onBoot(kernel: any, configProvider: IConfigProvider) {
        const logger: ILogger = kernel.container.resolve('logger').child({ component: 'Health' });

        if (configProvider.get('transport.express.health') === false) return;
        
        try {
            const transport = kernel.container.resolve('transport') as ITransport;
            const db = kernel.container.resolve('database') as IDatabaseAdapter;

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
        } catch (e) {
            logger.warn(`Could not register health route.`, { error: (e as any)?.message });
        }
    }
}
