import type { IPlugin, IConfigProvider, JsonRequest, JsonResponse, ITransport } from '@json-express/core';

export class BaselineHealthPlugin implements IPlugin {
    name = 'baseline-health';

    async onBoot(kernel: any, configProvider: IConfigProvider) {
        if (configProvider.get('transport.express.health') === false) return;
        
        try {
            const transport = kernel.container.resolve('transport') as ITransport;
            transport.registerRoute({
                method: 'GET',
                path: '/health',
                handler: async (req: JsonRequest): Promise<JsonResponse> => ({ 
                    statusCode: 200, 
                    body: { status: 'UP' } 
                })
            });
        } catch (e) {
            // Ignore if transport isn't registered
            console.warn(`[BaselineHealth] Could not register health route: ${e}`);
        }
    }
}

export class BaselineInfoPlugin implements IPlugin {
    name = 'baseline-info';

    async onBoot(kernel: any, configProvider: IConfigProvider) {
        if (configProvider.get('transport.express.info') === false) return;
        
        try {
            const transport = kernel.container.resolve('transport') as ITransport;
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
            console.warn(`[BaselineInfo] Could not register info route: ${e}`);
        }
    }
}
