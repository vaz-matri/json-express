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
    QueryOptions,
    AccessRule,
    HookContext
} from '@json-express/core';
import {
    evaluateAccess,
    needsOwnerCheck,
    resolveOwnerField,
    resolveUserId,
    ownsRecord,
    stripDeniedReadFields,
    stripDeniedWriteFields,
} from '@json-express/core';

function denyResponse(verdict: { code: 'UNAUTHENTICATED' | 'FORBIDDEN'; reason: string }): JsonResponse {
    return {
        statusCode: verdict.code === 'UNAUTHENTICATED' ? 401 : 403,
        body: { error: verdict.reason },
    };
}

function notFound(collection: string, id: string): JsonResponse {
    return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
}

export class RestApiGenerator implements IApiGenerator {
    private db: IDatabaseAdapter;
    private config?: IConfigProvider;
    private logger: ILogger;
    private collections: string[] = [];
    private schemas: ModelSchema[] = [];
    private hookContext?: HookContext;

    constructor({ database, configProvider, logger }: {
        database: IDatabaseAdapter;
        configProvider?: IConfigProvider;
        logger: ILogger;
    }) {
        this.db = database;
        this.config = configProvider;
        this.logger = logger.child({ component: 'API-REST' });
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.logger.info(`Received ${schemas.length} schemas for endpoint parsing`);
        this.schemas = schemas;
    }

    public setHookContext(ctx: HookContext) {
        this.hookContext = ctx;
    }

    private enrichRoute(
        route: RouteDefinition,
        opRule?: AccessRule,
        modelValidationOp?: { schema: ModelSchema; op: 'create' | 'update' | 'list' },
    ): RouteDefinition {
        route.middlewares = route.middlewares || [];
        route.metadata = route.metadata || {};

        const authSecret = this.config?.get<string>('auth.secret');
        const authJwksUri = this.config?.get<string>('auth.jwksUri');
        const authConfigured = (typeof authSecret === 'string' && authSecret.length > 0)
            || (typeof authJwksUri === 'string' && authJwksUri.length > 0);
        // 'public' rules opt the route out of the auth gate so anonymous traffic isn't 401'd
        // before the handler runs. The handler still re-evaluates the rule for defense in depth.
        if (authConfigured && opRule !== 'public') {
            const rawExclude = this.config?.get<string | string[]>('auth.exclude', []);
            const excludePaths = Array.isArray(rawExclude) ? rawExclude : (typeof rawExclude === 'string' ? rawExclude.split(',').map(s => s.trim()) : []);

            const isExcluded = excludePaths.some(p => route.path.startsWith(p));
            if (!isExcluded) {
                if (!route.middlewares.includes('auth')) route.middlewares.push('auth');
                route.metadata.isProtected = true;
            }
        }

        // Model-driven validation: if the schema declares a validation block for this op,
        // attach the `validation` middleware. The middleware itself reads the resolved
        // schemas at boot via `setSchemas` and matches requests against its compiled rules.
        if (modelValidationOp) {
            const opBlock = modelValidationOp.schema.validation?.[modelValidationOp.op];
            if (opBlock) {
                if (!route.middlewares.includes('validation')) route.middlewares.push('validation');
                route.metadata.validation = { ...route.metadata.validation, [modelValidationOp.op]: opBlock };
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

            // Same context the kernel hands to db hooks; falls back to db-only
            // when boot didn't call setHookContext (e.g. direct unit-test wiring).
            const ctx = this.hookContext ?? { db: this.db };

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

        const schemaMap = new Map(this.schemas.map(s => [s.name, s]));

        // --- Core Auto-Generated Standard Routes --- //
        for (const collection of collections) {
            const schema = schemaMap.get(collection);
            if (schema?.exposeApi === false) continue;
            // Skip CRUD codegen for fieldless models — they declare behavior only
            // (custom endpoints, validation, hooks). The endpoint loop below still mounts them.
            if (schema && !schema.fields) continue;

            const basePath = `${prefix}/${collection}`;
            const itemPath = `${prefix}/${collection}/:id`;

            const access = schema?.access;
            const readRule = access?.read;
            const createRule = access?.create;
            const updateRule = access?.update;
            const deleteRule = access?.delete;
            const ownerField = resolveOwnerField(access);

            routes.push(this.enrichRoute({
                method: 'GET',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    this.logger.info(`Handling ${collection}.getAll`);

                    const verdict = evaluateAccess(readRule, req.headers['x-user-payload']);
                    if (!verdict.allowed) return denyResponse(verdict);

                    // Parse QueryOptions cleanly
                    const { _expand, _embed, ...cleanQuery } = req.query;
                    const options: QueryOptions = {
                        expand: _expand ? String(_expand).split(',').map(s => s.trim()) : undefined,
                        embed: _embed ? String(_embed).split(',').map(s => s.trim()) : undefined
                    };

                    let data: any[];
                    if (needsOwnerCheck(readRule)) {
                        // Force owner clause to overwrite any client-supplied value for the owner field —
                        // clients must not be able to query around their own ownership.
                        cleanQuery[ownerField] = resolveUserId(verdict.user) as any;
                        data = await this.db.search(collection, cleanQuery, options);
                    } else {
                        const hasQuery = Object.keys(cleanQuery).length > 0;
                        data = hasQuery
                            ? await this.db.search(collection, cleanQuery, options)
                            : await this.db.getAll(collection, options);
                    }
                    const projected = data.map((r: any) => stripDeniedReadFields(r, access, verdict.user));
                    return { statusCode: 200, body: projected };
                }
            }, readRule, schema ? { schema, op: 'list' } : undefined));

            routes.push(this.enrichRoute({
                method: 'GET',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    this.logger.info(`Handling ${collection}.getById`, { id });
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };

                    const verdict = evaluateAccess(readRule, req.headers['x-user-payload']);
                    if (!verdict.allowed) return denyResponse(verdict);

                    const { _expand, _embed } = req.query;
                    const options: QueryOptions = {
                        expand: _expand ? String(_expand).split(',').map(s => s.trim()) : undefined,
                        embed: _embed ? String(_embed).split(',').map(s => s.trim()) : undefined
                    };

                    try {
                        const record = await this.db.getById(collection, id, options);
                        if (!record) return notFound(collection, id);
                        if (needsOwnerCheck(readRule) && !ownsRecord(record, ownerField, verdict.user)) {
                            // Return 404 (not 403) so callers can't probe for IDs they don't own.
                            return notFound(collection, id);
                        }
                        return { statusCode: 200, body: stripDeniedReadFields(record, access, verdict.user) };
                    } catch {
                        return notFound(collection, id);
                    }
                }
            }, readRule));

            routes.push(this.enrichRoute({
                method: 'POST',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    this.logger.info(`Handling ${collection}.create`);
                    if (!req.body || typeof req.body !== 'object') {
                        return { statusCode: 400, body: { error: 'Request body must be a JSON object.' } };
                    }

                    const verdict = evaluateAccess(createRule, req.headers['x-user-payload']);
                    if (!verdict.allowed) return denyResponse(verdict);

                    let body: any = stripDeniedWriteFields(req.body, access, verdict.user, 'create');

                    if (needsOwnerCheck(createRule)) {
                        // Auto-stamp the caller as owner; overwrite any client-supplied value.
                        body[ownerField] = resolveUserId(verdict.user);
                    }

                    try {
                        const created = await this.db.create(collection, body);
                        return { statusCode: 201, body: stripDeniedReadFields(created, access, verdict.user) };
                    } catch (e: any) {
                        if (e && e.name === 'UniqueConstraintError') {
                            return { statusCode: 400, body: { error: e.message } };
                        }
                        throw e;
                    }
                }
            }, createRule, schema ? { schema, op: 'create' } : undefined));

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

                    const verdict = evaluateAccess(updateRule, req.headers['x-user-payload']);
                    if (!verdict.allowed) return denyResponse(verdict);

                    if (needsOwnerCheck(updateRule)) {
                        try {
                            const existing = await this.db.getById(collection, id);
                            if (!existing) return notFound(collection, id);
                            if (!ownsRecord(existing, ownerField, verdict.user)) return notFound(collection, id);
                        } catch {
                            return notFound(collection, id);
                        }
                    }

                    const body = stripDeniedWriteFields(req.body, access, verdict.user, 'update');

                    try {
                        const updated = await this.db.update(collection, id, body);
                        if (!updated) return notFound(collection, id);
                        return { statusCode: 200, body: stripDeniedReadFields(updated, access, verdict.user) };
                    } catch (e: any) {
                        if (e && e.name === 'UniqueConstraintError') {
                            return { statusCode: 400, body: { error: e.message } };
                        }
                        // Only missing records become 404 — infrastructure failures
                        // must surface as 500, not masquerade as not-found.
                        if (/not found/i.test(e?.message ?? '')) {
                            return notFound(collection, id);
                        }
                        throw e;
                    }
                }
            }, updateRule, schema ? { schema, op: 'update' } : undefined));

            routes.push(this.enrichRoute({
                method: 'DELETE',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    this.logger.info(`Handling ${collection}.delete`, { id });
                    if (!id) return { statusCode: 400, body: { error: 'Missing resource ID.' } };

                    const verdict = evaluateAccess(deleteRule, req.headers['x-user-payload']);
                    if (!verdict.allowed) return denyResponse(verdict);

                    if (needsOwnerCheck(deleteRule)) {
                        try {
                            const existing = await this.db.getById(collection, id);
                            if (!existing) return notFound(collection, id);
                            if (!ownsRecord(existing, ownerField, verdict.user)) return notFound(collection, id);
                        } catch {
                            return notFound(collection, id);
                        }
                    }

                    try {
                        const deleted = await this.db.delete(collection, id);
                        if (!deleted) return notFound(collection, id);
                        return { statusCode: 200, body: { message: `Resource '${id}' deleted from '${collection}'.` } };
                    } catch {
                        return notFound(collection, id);
                    }
                }
            }, deleteRule));
        }

        // --- Extensibility 1: Model-Bound Endpoints --- //
        for (const schema of this.schemas) {
            if (schema.endpoints) {
                for (const [routeKey, entry] of Object.entries(schema.endpoints)) {
                    // "GET /stats"
                    const parts = routeKey.split(' ');
                    const method = parts.length > 1 ? parts[0] : 'GET';
                    const pathStr = parts.length > 1 ? parts[1] : parts[0];
                    const cleanPath = pathStr === '/' ? '' : (pathStr.startsWith('/') ? pathStr : `/${pathStr}`);
                    const fullPath = `${prefix}/${schema.name}${cleanPath}`;

                    // Accept both the bare-function form and the object form { handler, validation? }.
                    const handler = typeof entry === 'function' ? entry : entry.handler;
                    const validation = typeof entry === 'function' ? undefined : entry.validation;

                    this.logger.info(`Mapping Model-Bound Endpoint: ${method.toUpperCase()} ${fullPath}`);

                    const route = this.enrichRoute({
                        method: method.toUpperCase() as any,
                        path: fullPath,
                        handler: this.bindCustomEndpoint(handler)
                    });

                    if (validation && (validation.body || validation.query)) {
                        route.middlewares = route.middlewares || [];
                        route.metadata = route.metadata || {};
                        if (!route.middlewares.includes('validation')) route.middlewares.push('validation');
                        route.metadata.validation = validation;
                    }

                    routes.push(route);
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
                        for (const [routeKey, entry] of Object.entries(defaultExport.endpoints) as [string, any][]) {
                            const parts = routeKey.split(' ');
                            const method = parts.length > 1 ? parts[0] : 'GET';
                            const pathStr = parts.length > 1 ? parts[1] : parts[0];
                            const cleanPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
                            const fullPath = `${prefix}${cleanPath}`;

                            const handler = typeof entry === 'function' ? entry : entry.handler;
                            const validation = typeof entry === 'function' ? undefined : entry.validation;

                            this.logger.info(`Mapping Global Endpoint: ${method.toUpperCase()} ${fullPath}`);

                            const route = this.enrichRoute({
                                method: method.toUpperCase() as any,
                                path: fullPath,
                                handler: this.bindCustomEndpoint(handler)
                            });

                            if (validation && (validation.body || validation.query)) {
                                route.middlewares = route.middlewares || [];
                                route.metadata = route.metadata || {};
                                if (!route.middlewares.includes('validation')) route.middlewares.push('validation');
                                route.metadata.validation = validation;
                            }

                            routes.push(route);
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

export default RestApiGenerator;
