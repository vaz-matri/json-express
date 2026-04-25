import { TypeDefinition } from './types';
import { JsonRequest, JsonResponse, IDatabaseAdapter } from '../types';

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

export interface ModelHooks<T = any> {
    beforeCreate?: (data: Partial<T>) => Promise<Partial<T>> | Partial<T>;
    afterCreate?: (data: T) => Promise<void> | void;
    // We will expand these lifecycles as needed
}

export type AccessRule = 'public' | 'owner' | string | string[];

/**
 * Per-field access overrides, evaluated against the authenticated caller.
 * Only restricts further than the op-level rule — a field absent from
 * `AuthRules.fields` is governed entirely by the op-level rule.
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

export interface ModelConfig<TFields extends Record<string, TypeDefinition> = any> {
    name?: string;
    fields: TFields;
    endpoints?: Record<string, CustomEndpointHandler>;
    hooks?: ModelHooks;
    access?: AuthRules;
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
