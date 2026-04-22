import { existsSync, readdirSync } from 'fs';
import { extname, join } from 'path';
import { createJiti } from 'jiti';

import type {
    IApiGenerator,
    IDatabaseAdapter,
    RouteDefinition,
    JsonRequest,
    JsonResponse,
    IConfigProvider,
    ILogger,
    ModelSchema,
    QueryOptions
} from '@json-express/core';
import { ConsoleLogger } from '@json-express/core';

export class RestApiGenerator implements IApiGenerator {
    private db: IDatabaseAdapter;
    private config?: IConfigProvider;
    private logger: ILogger;
    private collections: string[] = [];
    private schemas: ModelSchema[] = [];

    constructor({ database, configProvider, logger }: {
        database: IDatabaseAdapter;
        configProvider?: IConfigProvider;
        logger?: ILogger;
    }) {
        this.db = database;
        this.config = configProvider;
        this.logger = logger?.child({ component: 'API-REST' }) ?? new ConsoleLogger({ context: { component: 'API-REST' } });
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.logger.info(`Received ${schemas.length} schemas for endpoint parsing`);
        this.schemas = schemas;
    }

    private enrichRoute(route: RouteDefinition): RouteDefinition {
        route.middlewares = route.middlewares || [];
        route.metadata = route.metadata || {};

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

    private bindCustomEndpoint(handler: any): (req: JsonRequest) => Promise<JsonResponse> {
        return async (req: JsonRequest) => {
            let statusCode = 200;
            let responseBody: any = undefined;

            const resHelper = {
                status: (code: number) => { statusCode = code; return resHelper; },
                send: (body: any) => { responseBody = body; },
                json: (body: any) => { responseBody = body; }
            };

            const ctx = { db: this.db };
            
            try {
                const result = await handler(req, resHelper as any, ctx);
                // If they return the strict object declarative style:
                if (result && typeof result === 'object' && ('statusCode' in result || 'body' in result)) {
                    return result as JsonResponse;
                }
                // If they used the Express-like mutator helpers res.send():
                return { statusCode, body: responseBody };
            } catch (error: any) {
                this.logger.error(`Error in custom endpoint`, { error: error.message });
                return { statusCode: 500, body: { error: error.message } };
            }
        };
    }

    public async generate(collections: string[]): Promise<RouteDefinition[]> {
        const routes: RouteDefinition[] = [];
        this.collections = collections;

        const rawPrefix = this.config?.get<string>('api.rest.prefix', '') ?? '';
        const prefix = rawPrefix.endsWith('/') ? rawPrefix.slice(0, -1) : rawPrefix;

        // --- Core Auto-Generated Standard Routes --- //
        for (const collection of collections) {
            const basePath = `${prefix}/${collection}`;
            const itemPath = `${prefix}/${collection}/:id`;

            routes.push(this.enrichRoute({
                method: 'GET',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    this.logger.info(`Handling ${collection}.getAll`);
                    
                    // Parse QueryOptions cleanly
                    const { _expand, _embed, ...cleanQuery } = req.query;
                    const options: QueryOptions = {
                        expand: _expand ? String(_expand).split(',').map(s => s.trim()) : undefined,
                        embed: _embed ? String(_embed).split(',').map(s => s.trim()) : undefined
                    };

                    const hasQuery = Object.keys(cleanQuery).length > 0;
                    const data = hasQuery
                        ? await this.db.search(collection, cleanQuery, options)
                        : await this.db.getAll(collection, options);
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

                    const { _expand, _embed } = req.query;
                    const options: QueryOptions = {
                        expand: _expand ? String(_expand).split(',').map(s => s.trim()) : undefined,
                        embed: _embed ? String(_embed).split(',').map(s => s.trim()) : undefined
                    };

                    try {
                        const record = await this.db.getById(collection, id, options);
                        if (!record) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                        return { statusCode: 200, body: record };
                    } catch (e: any) {
                        return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                    }
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

                    try {
                        const updated = await this.db.update(collection, id, req.body);
                        if (!updated) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                        return { statusCode: 200, body: updated };
                    } catch (e: any) {
                        return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                    }
                }
            }));

            routes.push(this.enrichRoute({
                method: 'DELETE',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    this.logger.info(`Handling ${collection}.delete`, { id });
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };

                    try {
                        const deleted = await this.db.delete(collection, id);
                        if (!deleted) return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                        return { statusCode: 200, body: { message: `Resource '${id}' deleted from '${collection}'.` } };
                    } catch (e: any) {
                        return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                    }
                }
            }));
        }

        // --- Extensibility 1: Model-Bound Endpoints --- //
        for (const schema of this.schemas) {
            if (schema.endpoints) {
                for (const [routeKey, handler] of Object.entries(schema.endpoints)) {
                    // "GET /stats"
                    const parts = routeKey.split(' ');
                    const method = parts.length > 1 ? parts[0] : 'GET';
                    const pathStr = parts.length > 1 ? parts[1] : parts[0];
                    const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
                    const fullPath = `${prefix}/${schema.name}${cleanPath}`;

                    this.logger.info(`Mapping Model-Bound Endpoint: ${method.toUpperCase()} ${fullPath}`);

                    routes.push(this.enrichRoute({
                        method: method.toUpperCase() as any,
                        path: fullPath,
                        handler: this.bindCustomEndpoint(handler)
                    }));
                }
            }
        }

        // --- Extensibility 2: Global '/routes' Scanner --- //
        const cwd = process.cwd();
        const routesDir = join(cwd, 'routes');
        if (existsSync(routesDir)) {
            const jiti = createJiti(import.meta.url, { interopDefault: true });
            const routeFiles = readdirSync(routesDir, { withFileTypes: true })
                .filter(d => d.isFile() && (extname(d.name) === '.ts' || extname(d.name) === '.js'))
                .map(d => d.name);
            
            for (const filename of routeFiles) {
                try {
                    const mod = await jiti.import(join(routesDir, filename)) as any;
                    const defaultExport = mod.default || mod;
                    
                    if (defaultExport && defaultExport.endpoints) {
                        for (const [routeKey, handler] of Object.entries(defaultExport.endpoints)) {
                            const parts = routeKey.split(' ');
                            const method = parts.length > 1 ? parts[0] : 'GET';
                            const pathStr = parts.length > 1 ? parts[1] : parts[0];
                            const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
                            const fullPath = `${prefix}${cleanPath}`;

                            this.logger.info(`Mapping Global Endpoint: ${method.toUpperCase()} ${fullPath}`);

                            routes.push(this.enrichRoute({
                                method: method.toUpperCase() as any,
                                path: fullPath,
                                handler: this.bindCustomEndpoint(handler)
                            }));
                        }
                    }
                } catch (e: any) {
                    this.logger.error(`Error loading global route ${filename}:`, { error: e.message });
                }
            }
        }

        return routes;
    }
}
