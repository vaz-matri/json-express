import type { IPlugin, IConfigProvider, JsonRequest, JsonResponse, ITransport, IDatabaseAdapter } from '@json-express/core';

export class AdvancedHealthPlugin implements IPlugin {
    name = 'advanced-health';

    async onBoot(kernel: any, configProvider: IConfigProvider) {
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
            console.warn(`[AdvancedHealthPlugin] Could not register route: ${e}`);
        }
    }
}
