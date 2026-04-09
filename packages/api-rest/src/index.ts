import type {
    IApiGenerator,
    IDatabaseAdapter,
    RouteDefinition,
    JsonRequest,
    JsonResponse,
    IConfigProvider,
    ILogger
} from '@json-express/core';
import { ConsoleLogger } from '@json-express/core';

export class RestApiGenerator implements IApiGenerator {
    private db: IDatabaseAdapter;
    private config?: IConfigProvider;
    private logger: ILogger;
    private collections: string[] = [];

    constructor({ database, configProvider, logger }: {
        database: IDatabaseAdapter;
        configProvider?: IConfigProvider;
        logger?: ILogger;
    }) {
        this.db = database;
        this.config = configProvider;
        this.logger = logger?.child({ component: 'API-REST' }) ?? new ConsoleLogger({ context: { component: 'API-REST' } });
    }

    private enrichRoute(route: RouteDefinition): RouteDefinition {
        route.middlewares = route.middlewares || [];
        route.metadata = route.metadata || {};

        // 1. Auth Metadata & Middleware
        // If auth secret exists, assume routes are protected unless specifically excluded.
        const authSecret = this.config?.get<string>('auth.secret');
        if (authSecret) {
            const rawExclude = this.config?.get<string | string[]>('auth.exclude', []);
            const excludePaths = Array.isArray(rawExclude) ? rawExclude : (typeof rawExclude === 'string' ? rawExclude.split(',').map(s => s.trim()) : []);
            
            const isExcluded = excludePaths.some(p => route.path.startsWith(p));
            if (!isExcluded) {
                if (!route.middlewares.includes('auth')) route.middlewares.push('auth');
                route.metadata.isProtected = true;
            }
        }

        // 2. Validation Metadata & Middleware
        const validationRules = this.config?.get<any[]>('validation.rules', []);
        if (validationRules && validationRules.length > 0) {
            const matchedRule = validationRules.find(r => {
                const pathMatch = r.path instanceof RegExp ? r.path.test(route.path) : (route.path === r.path || route.path.startsWith(r.path));
                const methodMatch = r.method === '*' || r.method.toUpperCase() === route.method.toUpperCase();
                return pathMatch && methodMatch;
            });

            if (matchedRule) {
                if (!route.middlewares.includes('validation')) route.middlewares.push('validation');
                if (matchedRule.body) route.metadata.schema = matchedRule.body;
                if (matchedRule.query) route.metadata.querySchema = matchedRule.query;
            }
        }

        return route;
    }

    public generate(collections: string[]): RouteDefinition[] {
        const routes: RouteDefinition[] = [];
        this.collections = collections;

        // 🌟 New Feature: Global API Prefix
        const rawPrefix = this.config?.get<string>('api.rest.prefix', '') ?? '';
        const prefix = rawPrefix.endsWith('/') ? rawPrefix.slice(0, -1) : rawPrefix;

        // 🔍 Universal Cross-Collection Search (registered FIRST to avoid route shadowing)
        const searchEnabled = this.config?.get<boolean>('api.rest.search') !== false;
        if (searchEnabled) {
            routes.push(this.enrichRoute({
                method: 'POST',
                path: `${prefix}/search`,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const body = req.body || {};
                    const query: Record<string, any> = body.query || {};

                    // If user specifies target collections, use those; otherwise search all
                    const targetCollections: string[] = Array.isArray(body.collections) && body.collections.length > 0
                        ? body.collections
                        : this.collections;

                    this.logger.info(`Handling search`, { collections: targetCollections });

                    const results: Record<string, any[]> = {};

                    for (const col of targetCollections) {
                        try {
                            const matches = Object.keys(query).length > 0
                                ? await this.db.search(col, query)
                                : await this.db.getAll(col);

                            // Only include collections that returned results
                            if (matches.length > 0) {
                                results[col] = matches;
                            }
                        } catch (e: any) {
                            // Gracefully skip unknown collections
                            results[col] = [];
                        }
                    }

                    return { statusCode: 200, body: results };
                }
            }));
        }

        for (const collection of collections) {
            const basePath = `${prefix}/${collection}`;
            const itemPath = `${prefix}/${collection}/:id`;

            routes.push(this.enrichRoute({
                method: 'GET',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    this.logger.info(`Handling ${collection}.getAll`);
                    const hasQuery = Object.keys(req.query).length > 0;
                    const data = hasQuery
                        ? await this.db.search(collection, req.query as Record<string, any>)
                        : await this.db.getAll(collection);
                    return { statusCode: 200, body: data };
                }
            }));

            routes.push(this.enrichRoute({
                method: 'GET',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    this.logger.info(`Handling ${collection}.getById`, { id });
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };

                    const record = await this.db.getById(collection, id);
                    if (!record) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };

                    return { statusCode: 200, body: record };
                }
            }));

            routes.push(this.enrichRoute({
                method: 'POST',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    this.logger.info(`Handling ${collection}.create`);
                    if (!req.body || typeof req.body !== 'object') {
                        return { statusCode: 400, body: { error: 'Request body must be a JSON object.' } };
                    }
                    const created = await this.db.create(collection, req.body);
                    return { statusCode: 201, body: created };
                }
            }));

            routes.push(this.enrichRoute({
                method: 'PATCH',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    this.logger.info(`Handling ${collection}.update`, { id });
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };
                    if (!req.body || typeof req.body !== 'object') {
                        return { statusCode: 400, body: { error: 'Request body must be a JSON object.' } };
                    }

                    const updated = await this.db.update(collection, id, req.body);
                    if (!updated) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };

                    return { statusCode: 200, body: updated };
                }
            }));

            routes.push(this.enrichRoute({
                method: 'DELETE',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    this.logger.info(`Handling ${collection}.delete`, { id });
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };

                    const deleted = await this.db.delete(collection, id);
                    if (!deleted) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };

                    return { statusCode: 200, body: { message: `Resource '${id}' deleted from '${collection}'.` } };
                }
            }));
        }

        return routes;
    }
}
