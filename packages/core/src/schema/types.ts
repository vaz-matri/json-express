export type FieldDefinitionType = 'string' | 'number' | 'boolean' | 'date' | 'id' | 'relation';

export interface BaseOptions {
    required?: boolean;
    default?: any;
    unique?: boolean;
    index?: boolean;
    primaryKey?: boolean;
}

export interface StringOptions extends BaseOptions {
    maxLength?: number;
    minLength?: number;
}

export interface NumberOptions extends BaseOptions {
    min?: number;
    max?: number;
}

export interface RelationOptions extends BaseOptions {
    target: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    foreignKey?: string; // The field on this record that holds the FK value (e.g. 'artistId')
    onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT';
}

export interface TypeDefinition<T = any> {
    type: FieldDefinitionType;
    options?: BaseOptions | StringOptions | NumberOptions | RelationOptions;
    _inferHint?: T; // Used purely for TypeScript compile-time type extraction
}

// -----------------------------------------------------------------------------
// DYNAMIC FLUENT BUILDER (ZOD-STYLE API)
// -----------------------------------------------------------------------------

// Maps every property in OptionsType to a chainable method
export type FluentBuilder<OptionsType, BaseDef> = {
    [Key in keyof OptionsType]-?: (
        // If the property is boolean (like required), allow calling without args to imply "true"
        val?: OptionsType[Key] extends boolean | undefined ? boolean | void : OptionsType[Key]
    ) => FluentBuilder<OptionsType, BaseDef>;
} & BaseDef;

// The Proxy intercepts all method calls and automatically assigns them to the options object
function createFluentBuilder<O, T>(baseType: FieldDefinitionType, initialOptions: any = {}): FluentBuilder<O, TypeDefinition<T>> {
    const state = {
        type: baseType,
        options: { ...initialOptions }
    };

    return new Proxy(state as any, {
        get(target, prop: string | symbol) {
            // Passthrough for runtime property extraction (this is what the framework reads)
            if (prop === 'type' || prop === 'options' || prop === '_inferHint') {
                return target[prop as keyof typeof target];
            }

            // Return a chainable method for anything else (e.g., .required(), .default())
            return (val?: any) => {
                target.options[prop] = val !== undefined ? val : true;
                return createFluentBuilder<O, T>(baseType, target.options);
            };
        }
    });
}

export const types = {
    string: (options?: StringOptions) => createFluentBuilder<StringOptions, string>('string', options),
    number: (options?: NumberOptions) => createFluentBuilder<NumberOptions, number>('number', options),
    boolean: (options?: BaseOptions) => createFluentBuilder<BaseOptions, boolean>('boolean', options),
    date: (options?: BaseOptions) => createFluentBuilder<BaseOptions, Date | string>('date', options),
    id: (options?: BaseOptions) => createFluentBuilder<BaseOptions, string | number>('id', options),
    // Relation enforces that 'target' and 'type' are provided initially, but allows chaining the rest
    relation: (options: RelationOptions) => createFluentBuilder<RelationOptions, any>('relation', options)
};
