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
import { ConsoleLogger, evaluateAccess } from '@json-express/core';

interface ResolverContext {
    userPayload: string | string[] | undefined;
}

function enforceAccess(rule: AccessRule | undefined, ctx: ResolverContext, typeName: string, op: AccessOp): void {
    const verdict = evaluateAccess(rule, ctx?.userPayload);
    if (!verdict.allowed) {
        throw new GraphQLError(`${verdict.reason} (${typeName}.${op})`, {
            extensions: { code: verdict.code },
        });
    }
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

                                fields[fieldName] = {
                                    type: isMany ? new GraphQLList(targetType) : targetType,
                                    resolve: async (parent: any) => {
                                        if (isMany) {
                                            // Reverse FK: the child records on opts.target carry a column
                                            // pointing back at parent.id. Use the explicit foreignKey
                                            // if provided, else fall back to `${parentSingular}Id`.
                                            const fkField = opts.foreignKey ?? `${toSingular(collection)}Id`;
                                            return await db.search(opts.target, { [fkField]: parent.id });
                                        }
                                        const fkField = opts.foreignKey ?? `${fieldName}Id`;
                                        const fkValue = parent[fkField];
                                        if (!fkValue) return null;
                                        try {
                                            return await db.getById(opts.target, String(fkValue));
                                        } catch {
                                            return null;
                                        }
                                    },
                                };
                            } else {
                                fields[fieldName] = { type: scalarFor(fieldDef.type) };
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

            // List: always use the collection name (e.g. 'albums')
            queryFields[collection] = {
                type: new GraphQLList(gqlType),
                args: {
                    limit: { type: GraphQLInt },
                    offset: { type: GraphQLInt },
                    where: { type: whereType },
                },
                resolve: async (_: any, args: any, ctx: ResolverContext) => {
                    enforceAccess(readRule, ctx, typeName, 'read');
                    const { limit, offset, where } = args ?? {};
                    const hasWhere = where && Object.keys(where).length > 0;
                    const all = hasWhere
                        ? await db.search(collection, where)
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
                    resolve: (_: any, { id }: { id: string }, ctx: ResolverContext) => {
                        enforceAccess(readRule, ctx, typeName, 'read');
                        return db.getById(collection, id);
                    },
                };
            }

            const createRule = rules.find((r) => matchRule(r, 'POST', `/${collection}`));
            const updateRule = rules.find((r) => matchRule(r, 'PATCH', `/${collection}`));

            mutationFields[`create${typeName}`] = {
                type: gqlType,
                args: { input: { type: new GraphQLNonNull(inputType) } },
                resolve: async (_: any, { input }: any, ctx: ResolverContext) => {
                    enforceAccess(createAccessRule, ctx, typeName, 'create');
                    const validated = runValidation(createRule, input, typeName);
                    return db.create(collection, validated);
                },
            };

            mutationFields[`update${typeName}`] = {
                type: gqlType,
                args: {
                    id: { type: new GraphQLNonNull(GraphQLID) },
                    input: { type: new GraphQLNonNull(inputType) },
                },
                resolve: async (_: any, { id, input }: any, ctx: ResolverContext) => {
                    enforceAccess(updateAccessRule, ctx, typeName, 'update');
                    await ensureExists(db, collection, id, typeName);
                    const validated = runValidation(updateRule, input, typeName);
                    return db.update(collection, id, validated);
                },
            };

            mutationFields[`delete${typeName}`] = {
                type: gqlType,
                args: { id: { type: new GraphQLNonNull(GraphQLID) } },
                resolve: async (_: any, { id }: any, ctx: ResolverContext) => {
                    enforceAccess(deleteAccessRule, ctx, typeName, 'delete');
                    await ensureExists(db, collection, id, typeName);
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

        // Mirror api-rest's auth enrichment pattern
        const middlewares: string[] = [];
        if (this.config?.has('auth.secret')) {
            const rawExclude = this.config.get<string | string[]>('auth.exclude', []);
            const excludePaths = Array.isArray(rawExclude)
                ? rawExclude
                : typeof rawExclude === 'string'
                ? rawExclude.split(',').map((s) => s.trim())
                : [];
            if (!excludePaths.some((p) => endpoint.startsWith(p))) {
                middlewares.push('auth');
            }
        }

        routes.push({
            method: 'POST',
            path: endpoint,
            middlewares,
            metadata: { graphql: true },
            handler: async (req) => {
                const { query, variables, operationName } = req.body ?? {};

                if (!query) {
                    return {
                        statusCode: 400,
                        body: { errors: [{ message: 'Missing "query" in request body' }] },
                    };
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

async function ensureExists(
    db: IDatabaseAdapter,
    collection: string,
    id: string,
    typeName: string
): Promise<void> {
    const existing = await db.getById(collection, id).catch(() => null);
    if (!existing) {
        throw new GraphQLError(`${typeName} with id '${id}' not found`, {
            extensions: { code: 'NOT_FOUND' },
        });
    }
}
