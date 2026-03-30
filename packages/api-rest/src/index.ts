import type {
    IApiGenerator,
    IDatabaseAdapter,
    RouteDefinition,
    JsonRequest,
    JsonResponse,
    IConfigProvider
} from '@json-express/core';

export class RestApiGenerator implements IApiGenerator {
    private db: IDatabaseAdapter;
    private config?: IConfigProvider;

    constructor({ database, configProvider }: { database: IDatabaseAdapter, configProvider?: IConfigProvider }) {
        this.db = database;
        this.config = configProvider;
    }

    public generate(collections: string[]): RouteDefinition[] {
        const routes: RouteDefinition[] =[];

        // 🌟 New Feature: Global API Prefix
        const rawPrefix = this.config?.get<string>('api.rest.prefix', '') ?? '';
        const prefix = rawPrefix.endsWith('/') ? rawPrefix.slice(0, -1) : rawPrefix;

        for (const collection of collections) {
            const basePath = `${prefix}/${collection}`;
            const itemPath = `${prefix}/${collection}/:id`;

            routes.push({
                method: 'GET',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const hasQuery = Object.keys(req.query).length > 0;
                    const data = hasQuery
                        ? await this.db.search(collection, req.query as Record<string, any>)
                        : await this.db.getAll(collection);
                    return { statusCode: 200, body: data };
                }
            });

            routes.push({
                method: 'GET',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };

                    const record = await this.db.getById(collection, id);
                    if (!record) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };

                    return { statusCode: 200, body: record };
                }
            });

            routes.push({
                method: 'POST',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    if (!req.body || typeof req.body !== 'object') {
                        return { statusCode: 400, body: { error: 'Request body must be a JSON object.' } };
                    }
                    const created = await this.db.create(collection, req.body);
                    return { statusCode: 201, body: created };
                }
            });

            routes.push({
                method: 'PATCH',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };
                    if (!req.body || typeof req.body !== 'object') {
                        return { statusCode: 400, body: { error: 'Request body must be a JSON object.' } };
                    }

                    const updated = await this.db.update(collection, id, req.body);
                    if (!updated) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };

                    return { statusCode: 200, body: updated };
                }
            });

            routes.push({
                method: 'DELETE',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };

                    const deleted = await this.db.delete(collection, id);
                    if (!deleted) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };

                    return { statusCode: 200, body: { message: `Resource '${id}' deleted from '${collection}'.` } };
                }
            });
        }

        return routes;
    }
}
