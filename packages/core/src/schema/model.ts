import { TypeDefinition } from './types';
import { JsonRequest, JsonResponse, IDatabaseAdapter, IEmailProvider, ILogger, IKvStore, IQueueAdapter } from '../types';

export interface RouteContext {
    db: IDatabaseAdapter;
    // Ready to be extended by future plugins (e.g. auth context)
}

/**
 * A familiar response helper passed to custom endpoints
 */
export interface ResponseHelper {
    send: (body: any) => void;
    json: (body: any) => void;
    status: (code: number) => ResponseHelper;
}

/**
 * Signature for user-defined custom endpoints
 */
export type CustomEndpointHandler = (
    req: JsonRequest, 
    res: ResponseHelper, 
    ctx: RouteContext
) => Promise<JsonResponse | void> | JsonResponse | void;

/**
 * Context object handed to model hooks at execution time. Adapters build this
 * from the active database, the optional email provider, and the kernel logger
 * so hooks can perform side-effects (writes, emails) without resolving the
 * IoC container themselves.
 */
export interface HookContext {
    db: IDatabaseAdapter;
    email?: IEmailProvider;
    kvStore?: IKvStore;
    queue?: IQueueAdapter;
    logger: ILogger;
}

export interface ModelHooks<T = any> {
    beforeCreate?: (data: Partial<T>, ctx: HookContext) => Promise<Partial<T>> | Partial<T>;
    afterCreate?: (data: T, ctx: HookContext) => Promise<void> | void;
    beforeUpdate?: (patch: Partial<T>, ctx: HookContext) => Promise<Partial<T>> | Partial<T>;
    afterUpdate?: (updated: T, patch: Partial<T>, ctx: HookContext) => Promise<void> | void;
    // We will expand these lifecycles as needed
}

export type AccessRule = 'public' | 'owner' | false | string | string[];

/**
 * Per-field access overrides, evaluated against the authenticated caller.
 * Only restricts further than the op-level rule — a field absent from
 * `AuthRules.fields` is governed entirely by the op-level rule.
 *
 * Pass `false` for an op to deny that op for everyone — useful for fields
 * that must only be mutated through dedicated workflows (e.g. `passwordHash`
 * via /auth/password/change), never via generic CRUD.
 */
export interface FieldAccess {
    read?: AccessRule;
    create?: AccessRule;
    update?: AccessRule;
}

export interface AuthRules {
    create?: AccessRule;
    read?: AccessRule;
    update?: AccessRule;
    delete?: AccessRule;
    /**
     * Column on the record used for ownership checks when an op rule is `'owner'`.
     * Defaults to `'ownerId'`.
     */
    ownerField?: string;
    /**
     * Field-level access overrides. Read-denied fields are omitted from REST
     * responses (and `null` in GraphQL); write-denied fields are stripped
     * silently from `req.body` before db.create/db.update.
     */
    fields?: Record<string, FieldAccess>;
}

/**
 * Read-only handle to the auto-generated GraphQL types, passed to function-form
 * `graphql.*Fields` blocks so user resolvers can reference auto-generated types
 * (e.g. constructing a custom field that returns the auto-generated `Album` type).
 *
 * Values are typed as `unknown` so core stays free of a `graphql` dependency;
 * cast to `GraphQLObjectType` / `GraphQLInputObjectType` in user code.
 */
export interface TypeRegistry {
    getType(collection: string): unknown;
    getInputType(collection: string): unknown;
    getWhereType(collection: string): unknown;
}

/**
 * A map of GraphQL field names to graphql-js `GraphQLFieldConfig` objects, OR
 * a function returning that map. The function form receives a `TypeRegistry`
 * so resolvers can reference auto-generated types lazily — useful when a custom
 * field returns the auto-generated `Album` type, for example.
 */
export type GraphQLFieldsBlock =
    | Record<string, any>
    | ((registry: TypeRegistry) => Record<string, any>);

/**
 * Custom GraphQL fields layered onto the auto-generated schema for this model.
 *
 * - `queryFields` and `mutationFields` extend the root `Query` / `Mutation` types.
 * - `typeFields` extend the auto-generated `GraphQLObjectType` for this model
 *   (e.g. a computed `Artist.albumCount` defined on `artists.ts`).
 *
 * Resolvers receive `(parent, args, context, info)` per graphql-js convention.
 * `context` carries `{ userPayload, db }`:
 *   - `userPayload`: stringified JWT payload (or `string[]` / `undefined`) produced
 *     by the soft-decode of the request's `Authorization` header. Use
 *     `evaluateAccess(rule, ctx.userPayload)` from `@json-express/core` to enforce
 *     auth inside a custom resolver.
 *   - `db`: the active `IDatabaseAdapter`, so resolvers can read/write the same
 *     store the auto-generated CRUD uses.
 *
 * On collision with an auto-generated field, the user-supplied value wins and
 * a warning is logged.
 */
export interface ModelGraphQLBlock {
    queryFields?: GraphQLFieldsBlock;
    mutationFields?: GraphQLFieldsBlock;
    typeFields?: GraphQLFieldsBlock;
}

export interface ModelConfig<TFields extends Record<string, TypeDefinition> = any> {
    name?: string;
    fields: TFields;
    endpoints?: Record<string, CustomEndpointHandler>;
    hooks?: ModelHooks;
    access?: AuthRules;
    graphql?: ModelGraphQLBlock;
    /**
     * Set to false to prevent auto-generating REST and GraphQL APIs for this model.
     * Default: true
     */
    exposeApi?: boolean;
}

export interface ModelSchema<TFields extends Record<string, TypeDefinition> = any> extends ModelConfig<TFields> {
    name: string; // The loader guarantees this is set via filename if omitted
}

/**
 * The core identity function used to explicitly define a ModelSchema. 
 * Provides strong typing and autocomplete for Developers.
 */
export function defineModel<TFields extends Record<string, TypeDefinition>>(
    config: ModelConfig<TFields>
): ModelSchema<TFields> {
    return {
        // A placeholder name. The file scanner module will forcefully override 
        // this with the filename (e.g., 'albums') when loaded into the Registry.
        name: config.name || 'UNNAMED_MODEL',
        ...config
    };
}
