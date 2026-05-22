import { pgTable, text, integer, boolean, timestamp, uuid, AnyPgColumnBuilder, primaryKey } from 'drizzle-orm/pg-core';
import type { ModelSchema, TypeDefinition, StringOptions, NumberOptions, RelationOptions } from '@json-express/core';

export function translateSchemaToDrizzle(schema: ModelSchema) {
    if (!schema.fields) return null;

    const columns: Record<string, AnyPgColumnBuilder> = {};
    const pkFields: string[] = [];

    for (const [fieldName, fieldDefRaw] of Object.entries(schema.fields)) {
        const fieldDef = fieldDefRaw as TypeDefinition;
        let col: AnyPgColumnBuilder;

        switch (fieldDef.type) {
            case 'string':
                col = text(fieldName);
                break;
            case 'number':
                col = integer(fieldName);
                break;
            case 'boolean':
                col = boolean(fieldName);
                break;
            case 'date':
                col = timestamp(fieldName, { mode: 'date' });
                break;
            case 'id':
                col = uuid(fieldName);
                break;
            case 'relation':
                // For relations, we only create a physical column if it's many-to-one or one-to-one
                // and the foreignKey belongs to this table.
                const relOpts = fieldDef.options as RelationOptions;
                if (relOpts.type === 'many-to-one' || relOpts.type === 'one-to-one') {
                    const fkColName = relOpts.foreignKey || `${fieldName}Id`;
                    col = uuid(fkColName);
                    // Note: Drizzle raw string foreign keys can be tricky to set dynamically 
                    // without the target table object. We will build them later or assume UUID for now.
                    columns[fkColName] = col;
                }
                continue; // Relation logic handled; skip default assignment
            default:
                col = text(fieldName);
        }

        // Apply BaseOptions
        if (fieldDef.options) {
            if (fieldDef.options.required) col = col.notNull();
            if (fieldDef.options.default !== undefined) col = col.default(fieldDef.options.default);
            if (fieldDef.options.unique) col = col.unique();
            if (fieldDef.options.primaryKey) {
                col = col.primaryKey();
                pkFields.push(fieldName);
            }
        }

        columns[fieldName] = col;
    }

    // Return the Drizzle pgTable definition
    return pgTable(schema.name, columns, (table) => {
        const extras: Record<string, any> = {};
        
        // Handle composite primary keys if defined at the ModelConfig level
        if (schema.primaryKeys && schema.primaryKeys.length > 0) {
            const columnsToUse = schema.primaryKeys.map(k => table[k]);
            extras.pk = primaryKey({ columns: columnsToUse });
        }
        
        return extras;
    });
}
