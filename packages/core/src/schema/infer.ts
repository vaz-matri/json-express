import { TypeDefinition } from './types';
import { ModelSchema } from './model';

/**
 * Extracts the raw TypeScript type hidden inside the _inferHint.
 */
export type InferFieldType<T> = T extends TypeDefinition<infer R> ? R : never;

/**
 * Helper mapped type that unwraps a ModelSchema definition back into a 
 * standard TypeScript interface for full IDE autocomplete in user routes.
 */
export type InferType<M extends ModelSchema<any>> = {
    // If the field is omitted but has a default or is optional, this handles the core mapping.
    // For now we map everything to required, in a future PR we can conditionally map Optionals.
    [K in keyof M['fields']]: InferFieldType<M['fields'][K]>
};
