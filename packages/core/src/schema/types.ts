export type FieldDefinitionType = 'string' | 'number' | 'boolean' | 'date' | 'id' | 'relation';

export interface BaseOptions {
    required?: boolean;
    default?: any;
    unique?: boolean;
    index?: boolean;
}

export interface StringOptions extends BaseOptions {
    maxLength?: number;
    minLength?: number;
}

export interface NumberOptions extends BaseOptions {
    min?: number;
    max?: number;
}

export interface RelationOptions {
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

export const types = {
    string: (options?: StringOptions): TypeDefinition<string> => ({ type: 'string', options }),
    number: (options?: NumberOptions): TypeDefinition<number> => ({ type: 'number', options }),
    boolean: (options?: BaseOptions): TypeDefinition<boolean> => ({ type: 'boolean', options }),
    date: (options?: BaseOptions): TypeDefinition<Date | string> => ({ type: 'date', options }),
    id: (options?: BaseOptions): TypeDefinition<string | number> => ({ type: 'id', options }),
    relation: (options: RelationOptions): TypeDefinition<any> => ({ type: 'relation', options })
};
