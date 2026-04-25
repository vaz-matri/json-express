import {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLInputObjectType,
    GraphQLString,
    GraphQLFloat,
    GraphQLBoolean,
    GraphQLID,
    GraphQLInt,
    GraphQLList,
    GraphQLNonNull,
    GraphQLScalarType,
    GraphQLError,
    graphql as executeGraphQL,
} from 'graphql';
import type {
    IApiGenerator,
    IDatabaseAdapter,
    IConfigProvider,
    ILogger,
    ModelSchema,
    RouteDefinition,
    AccessRule,
    AccessOp,
} from '@json-express/core';
import {
    ConsoleLogger,
    evaluateAccess,
    needsOwnerCheck,
    resolveOwnerField,
    resolveUserId,
    ownsRecord,
    verifyJwt,
    getFieldRule,
    stripDeniedWriteFields,
} from '@json-express/core';

interface ResolverContext {
    userPayload: string | string[] | undefined;
}

/**
 * Runs `evaluateAccess` and throws a GraphQLError on deny. Returns the user payload
 * (which may be null) so the caller can perform owner checks without re-decoding.
 */
function enforceAccess(
    rule: AccessRule | undefined,
    ctx: ResolverContext,
    typeName: string,
    op: AccessOp
): Record<string, any> | null {
    const verdict = evaluateAccess(rule, ctx?.userPayload);
    if (!verdict.allowed) {
        throw new GraphQLError(`${verdict.reason} (${typeName}.${op})`, {
            extensions: { code: verdict.code },
        });
    }
    return verdict.user;
}

function notFoundError(typeName: string, id: string): GraphQLError {
    return new GraphQLError(`${typeName} with id '${id}' not found`, {
        extensions: { code: 'NOT_FOUND' },
    });
}

const JSONScalar = new GraphQLScalarType({
    name: 'JSON',
    description: 'Arbitrary JSON value — used for collections without a ModelSchema',
    serialize: (value) => value,
    parseValue: (value) => value,
    parseLiteral: () => null,
});

function toSingular(name: string): string {
    if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
    if (name.endsWith('s')) return name.slice(0, -1);
    return name;
}

function toTypeName(collection: string): string {
    const s = toSingular(collection);
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function scalarFor(type: string): GraphQLScalarType {
    switch (type) {
        case 'id': return GraphQLID;
        case 'number': return GraphQLFloat;
        case 'boolean': return GraphQLBoolean;
        default: return GraphQLString; // string, date, unknown
    }
}

// Structural shape for a Zod-compatible schema. Typed locally so api-graphql
// does not depend on zod or middleware-validation directly.
interface ParsableSchema {
    safeParse(input: unknown): { success: boolean; data?: any; error?: { format(): any } };
}
interface ValidationRule {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | '*';
    path: string | RegExp;
    body?: ParsableSchema;
    query?: ParsableSchema;
}

function matchRule(rule: ValidationRule, method: string, path: string): boolean {
    const methodOk = rule.method === '*' || rule.method.toUpperCase() === method.toUpperCase();
    if (!methodOk) return false;
    if (rule.path instanceof RegExp) return rule.path.test(path);
    return path === rule.path || path.startsWith(rule.path);
}

const GRAPHIQL_HTML = `<!DOCTYPE html>
<html>
  <head>
    <title>GraphiQL</title>
    <link rel="stylesheet" href="https://unpkg.com/graphiql@3/graphiql.min.css" />
  </head>
  <body style="margin:0;height:100vh">
    <div id="graphiql" style="height:100%"></div>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
    <script>
      const root = ReactDOM.createRoot(document.getElementById('graphiql'));
      root.render(React.createElement(GraphiQL, {
        fetcher: GraphiQL.createFetcher({ url: window.location.href })
      }));
    </script>
  </body>
</html>`;

export class GraphQLApiGenerator implements IApiGenerator {
    private db: IDatabaseAdapter;
    private config?: IConfigProvider;
    private logger: ILogger;
    private schemas: ModelSchema[] = [];

    constructor({
        database,
        configProvider,
        logger,
    }: {
        database: IDatabaseAdapter;
        configProvider?: IConfigProvider;
        logger?: ILogger;
    }) {
        this.db = database;
        this.config = configProvider;
        this.logger =
            logger?.child({ component: 'API-GraphQL' }) ??
            new ConsoleLogger({ context: { component: 'API-GraphQL' } });
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.schemas = schemas;
    }

    private buildSchema(collections: string[], rules: ValidationRule[]): GraphQLSchema {
        const db = this.db;
        const schemaMap = new Map(this.schemas.map((s) => [s.name, s]));

        // Phase 1: register all GraphQLObjectTypes up-front so relation thunks can reference them
        const typeRegistry = new Map<string, GraphQLObjectType>();
        const inputRegistry = new Map<string, GraphQLInputObjectType>();
        const whereRegistry = new Map<string, GraphQLInputObjectType>();

        for (const collection of collections) {
            const typeName = toTypeName(collection);
            const modelSchema = schemaMap.get(collection);

            if (!modelSchema) {
                this.logger.warn(`No ModelSchema for '${collection}' — exposing id + data (JSON) fields`);
            }

            typeRegistry.set(
                collection,
                new GraphQLObjectType({
                    name: typeName,
                    fields: () => {
                        if (!modelSchema) {
                            return {
                                id: { type: GraphQLID },
                                data: {
                                    type: JSONScalar,
                                    resolve: (obj: any) => {
                                        const { id, ...rest } = obj;
                                        return rest;
                                    },
                                },
                            };
                        }

                        const fields: Record<string, any> = {};

                        for (const [fieldName, fieldDef] of Object.entries(modelSchema.fields)) {
                            if (fieldDef.type === 'relation') {
                                const opts = fieldDef.options as any;
                                const targetType = typeRegistry.get(opts.target);
                                if (!targetType) continue;

                                const isMany = opts.type === 'one-to-many' || opts.type === 'many-to-many';
                                const targetAccess = schemaMap.get(opts.target)?.access;
                                const targetReadRule = targetAccess?.read;
                                const targetTypeName = toTypeName(opts.target);
                                const targetOwnerField = resolveOwnerField(targetAccess);

                                fields[fieldName] = {
                                    type: isMany ? new GraphQLList(targetType) : targetType,
                                    resolve: async (parent: any, _args: any, ctx: ResolverContext) => {
                                        // Enforce target collection's read rule on relation traversal.
                                        const verdict = evaluateAccess(targetReadRule, ctx?.userPayload);
                                        if (!verdict.allowed) {
                                            // Throw so graphql-js nulls the relation field; the parent stays.
                                            throw new GraphQLError(`${verdict.reason} (${targetTypeName}.read via ${typeName}.${fieldName})`, {
                                                extensions: { code: verdict.code },
                                            });
                                        }

                                        if (isMany) {
                                            const fkField = opts.foreignKey ?? `${toSingular(collection)}Id`;
                                            const filter: Record<string, any> = { [fkField]: parent.id };
                                            if (needsOwnerCheck(targetReadRule)) {
                                                // Owner-scoped target: only return target rows the caller owns.
                                                filter[targetOwnerField] = resolveUserId(verdict.user);
                                            }
                                            return await db.search(opts.target, filter);
                                        }
                                        const fkField = opts.foreignKey ?? `${fieldName}Id`;
                                        const fkValue = parent[fkField];
                                        if (!fkValue) return null;
                                        const record = await db.getById(opts.target, String(fkValue)).catch(() => null);
                                        if (!record) return null;
                                        if (needsOwnerCheck(targetReadRule) && !ownsRecord(record, targetOwnerField, verdict.user)) {
                                            // Pretend the relation doesn't exist when the caller doesn't own it.
                                            return null;
                                        }
                                        return record;
                                    },
                                };
                            } else {
                                const fieldReadRule = getFieldRule(modelSchema.access, fieldName, 'read');
                                if (fieldReadRule !== undefined) {
                                    const accessForField = modelSchema.access;
                                    const accessOwnerField = resolveOwnerField(accessForField);
                                    fields[fieldName] = {
                                        type: scalarFor(fieldDef.type),
                                        resolve: (parent: any, _args: any, ctx: ResolverContext) => {
                                            const v = evaluateAccess(fieldReadRule, ctx?.userPayload);
                                            if (!v.allowed) return null;
                                            if (needsOwnerCheck(fieldReadRule) && !ownsRecord(parent, accessOwnerField, v.user)) {
                                                return null;
                                            }
                                            return parent[fieldName];
                                        },
                                    };
                                } else {
                                    fields[fieldName] = { type: scalarFor(fieldDef.type) };
                                }
                            }
                        }

                        return fields;
                    },
                })
            );

            inputRegistry.set(
                collection,
                new GraphQLInputObjectType({
                    name: `${typeName}Input`,
                    fields: () => {
                        if (!modelSchema) {
                            return { data: { type: JSONScalar } };
                        }

                        const inputFields: Record<string, any> = {};
                        for (const [fieldName, fieldDef] of Object.entries(modelSchema.fields)) {
                            // Skip id (auto-generated) and relations (resolved, not set directly)
                            if (fieldDef.type === 'id' || fieldDef.type === 'relation') continue;
                            inputFields[fieldName] = { type: scalarFor(fieldDef.type) };
                        }
                        return inputFields;
                    },
                })
            );

            // Where-input: scalar fields (all optional) for exact-match filtering on list queries.
            // Relations are excluded; id is included since filtering by id is useful.
            whereRegistry.set(
                collection,
                new GraphQLInputObjectType({
                    name: `${typeName}WhereInput`,
                    fields: () => {
                        if (!modelSchema) return { id: { type: GraphQLID } };
                        const whereFields: Record<string, any> = {};
                        for (const [fieldName, fieldDef] of Object.entries(modelSchema.fields)) {
                            if (fieldDef.type === 'relation') continue;
                            whereFields[fieldName] = { type: scalarFor(fieldDef.type) };
                        }
                        return whereFields;
                    },
                })
            );
        }

        // Phase 2: build Query and Mutation root types
        const queryFields: Record<string, any> = {};
        const mutationFields: Record<string, any> = {};

        for (const collection of collections) {
            const gqlType = typeRegistry.get(collection)!;
            const inputType = inputRegistry.get(collection)!;
            const whereType = whereRegistry.get(collection)!;
            const typeName = toTypeName(collection);
            const singleField = toSingular(collection); // e.g. 'album'

            const access = schemaMap.get(collection)?.access;
            const readRule = access?.read;
            const createAccessRule = access?.create;
            const updateAccessRule = access?.update;
            const deleteAccessRule = access?.delete;
            const ownerField = resolveOwnerField(access);

            // List: always use the collection name (e.g. 'albums')
            queryFields[collection] = {
                type: new GraphQLList(gqlType),
                args: {
                    limit: { type: GraphQLInt },
                    offset: { type: GraphQLInt },
                    where: { type: whereType },
                },
                resolve: async (_: any, args: any, ctx: ResolverContext) => {
                    const user = enforceAccess(readRule, ctx, typeName, 'read');
                    const { limit, offset, where } = args ?? {};
                    const filter: Record<string, any> = { ...(where ?? {}) };
                    if (needsOwnerCheck(readRule)) {
                        // Owner clause overwrites any client-supplied value to prevent spoofing.
                        filter[ownerField] = resolveUserId(user);
                    }
                    const hasFilter = Object.keys(filter).length > 0;
                    const all = hasFilter
                        ? await db.search(collection, filter)
                        : await db.getAll(collection);
                    const start = offset ?? 0;
                    const end = limit != null ? start + limit : undefined;
                    return (all as any[]).slice(start, end);
                },
            };

            // Single: use singular form only if it differs from the collection name
            if (singleField !== collection) {
                queryFields[singleField] = {
                    type: gqlType,
                    args: { id: { type: new GraphQLNonNull(GraphQLID) } },
                    resolve: async (_: any, { id }: { id: string }, ctx: ResolverContext) => {
                        const user = enforceAccess(readRule, ctx, typeName, 'read');
                        const record = await db.getById(collection, id).catch(() => null);
                        if (!record) throw notFoundError(typeName, id);
                        if (needsOwnerCheck(readRule) && !ownsRecord(record, ownerField, user)) {
                            // 404 (not 403) so callers cannot probe for IDs they don't own.
                            throw notFoundError(typeName, id);
                        }
                        return record;
                    },
                };
            }

            const createRule = rules.find((r) => matchRule(r, 'POST', `/${collection}`));
            const updateRule = rules.find((r) => matchRule(r, 'PATCH', `/${collection}`));

            mutationFields[`create${typeName}`] = {
                type: gqlType,
                args: { input: { type: new GraphQLNonNull(inputType) } },
                resolve: async (_: any, { input }: any, ctx: ResolverContext) => {
                    const user = enforceAccess(createAccessRule, ctx, typeName, 'create');
                    const validated = runValidation(createRule, input, typeName);
                    let body: any = stripDeniedWriteFields(validated, access, user, 'create');
                    if (needsOwnerCheck(createAccessRule)) {
                        // Auto-stamp caller as owner; overwrites any client-supplied value.
                        body[ownerField] = resolveUserId(user);
                    }
                    return db.create(collection, body);
                },
            };

            mutationFields[`update${typeName}`] = {
                type: gqlType,
                args: {
                    id: { type: new GraphQLNonNull(GraphQLID) },
                    input: { type: new GraphQLNonNull(inputType) },
                },
                resolve: async (_: any, { id, input }: any, ctx: ResolverContext) => {
                    const user = enforceAccess(updateAccessRule, ctx, typeName, 'update');
                    const existing = await db.getById(collection, id).catch(() => null);
                    if (!existing) throw notFoundError(typeName, id);
                    if (needsOwnerCheck(updateAccessRule) && !ownsRecord(existing, ownerField, user)) {
                        throw notFoundError(typeName, id);
                    }
                    const validated = runValidation(updateRule, input, typeName);
                    const body = stripDeniedWriteFields(validated, access, user, 'update');
                    return db.update(collection, id, body);
                },
            };

            mutationFields[`delete${typeName}`] = {
                type: gqlType,
                args: { id: { type: new GraphQLNonNull(GraphQLID) } },
                resolve: async (_: any, { id }: any, ctx: ResolverContext) => {
                    const user = enforceAccess(deleteAccessRule, ctx, typeName, 'delete');
                    const existing = await db.getById(collection, id).catch(() => null);
                    if (!existing) throw notFoundError(typeName, id);
                    if (needsOwnerCheck(deleteAccessRule) && !ownsRecord(existing, ownerField, user)) {
                        throw notFoundError(typeName, id);
                    }
                    return db.delete(collection, id);
                },
            };
        }

        return new GraphQLSchema({
            query: new GraphQLObjectType({ name: 'Query', fields: queryFields }),
            mutation: new GraphQLObjectType({ name: 'Mutation', fields: mutationFields }),
        });
    }

    public async generate(collections: string[]): Promise<RouteDefinition[]> {
        const endpoint = this.config?.get<string>('api.graphql.endpoint') ?? '/graphql';
        const graphiql = this.config?.get<boolean>('api.graphql.graphiql') ?? true;

        if (collections.length === 0) {
            this.logger.warn('No collections — GraphQL API will be empty');
            return [];
        }

        const rules = this.config?.get<ValidationRule[]>('validation.rules', []) ?? [];
        const schema = this.buildSchema(collections, rules);
        this.logger.info(`GraphQL API ready at POST ${endpoint}`, { collections });

        const routes: RouteDefinition[] = [];

        // GraphQL is single-endpoint: blanket-gating /graphql with the auth middleware can't
        // express per-op rules. Instead the route is left open and the handler does an
        // unconditional soft-decode of the Bearer token, populating user context for the
        // resolvers. Resolvers remain the source of truth via evaluateAccess.
        const authSecret = this.config?.get<string>('auth.secret');

        routes.push({
            method: 'POST',
            path: endpoint,
            middlewares: [],
            metadata: { graphql: true },
            handler: async (req) => {
                const { query, variables, operationName } = req.body ?? {};

                if (!query) {
                    return {
                        statusCode: 400,
                        body: { errors: [{ message: 'Missing "query" in request body' }] },
                    };
                }

                // Anti-spoof: drop any client-supplied x-user-payload before we (maybe) re-set it
                // from a verified JWT. Without this, a forged header could pose as authenticated.
                delete req.headers['x-user-payload'];
                delete req.headers['X-User-Payload'];

                if (authSecret) {
                    const verified = verifyJwt(req.headers['authorization'], authSecret);
                    if (verified) req.headers['x-user-payload'] = verified;
                }

                try {
                    const ctx: ResolverContext = { userPayload: req.headers['x-user-payload'] };
                    const result = await executeGraphQL({
                        schema,
                        source: query,
                        variableValues: variables,
                        operationName,
                        contextValue: ctx,
                    });
                    return { statusCode: 200, body: result };
                } catch (err: any) {
                    this.logger.error('GraphQL execution error', { error: err.message });
                    return {
                        statusCode: 400,
                        body: { errors: [{ message: err.message }] },
                    };
                }
            },
        });

        if (graphiql) {
            routes.push({
                method: 'GET',
                path: endpoint,
                middlewares: [],
                metadata: { graphql: true, graphiql: true },
                handler: async () => ({
                    statusCode: 200,
                    // transport-express checks Content-Type === 'text/html' to use res.send() vs res.json()
                    headers: { 'Content-Type': 'text/html' },
                    body: GRAPHIQL_HTML,
                }),
            });
        }

        return routes;
    }
}

function runValidation(rule: ValidationRule | undefined, input: any, typeName: string): any {
    if (!rule?.body) return input;
    const parsed = rule.body.safeParse(input);
    if (!parsed.success) {
        throw new GraphQLError(`${typeName} input validation failed`, {
            extensions: {
                code: 'BAD_USER_INPUT',
                details: parsed.error?.format?.(),
            },
        });
    }
    return parsed.data ?? input;
}

