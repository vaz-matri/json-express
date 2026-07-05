import { randomUUID } from 'crypto';
import type { IDatabaseAdapter, IConfigProvider, ILogger, IIdGenerator, QueryOptions, ModelSchema, HookContext, TypeDefinition } from '@json-express/core';
import { UniqueConstraintError } from '@json-express/core';

function toSingular(name: string): string {
    if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
    if (name.endsWith('s')) return name.slice(0, -1);
    return name;
}

export class MemoryDatabaseAdapter implements IDatabaseAdapter {
    private store: Record<string, any[]> = {};
    private config?: IConfigProvider;
    private logger: ILogger;
    private idGenerator?: IIdGenerator;
    private schemas: ModelSchema[] = [];
    private hookContext?: HookContext;

    constructor({ configProvider, logger, idGenerator }: { configProvider?: IConfigProvider; logger: ILogger; idGenerator?: IIdGenerator }) {
        this.config = configProvider;
        this.logger = logger.child({ component: 'DB-Memory' });
        this.idGenerator = idGenerator;
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.schemas = schemas;
    }

    public setHookContext(ctx: HookContext) {
        this.hookContext = ctx;
    }

    public loadData(initialData: Record<string, any[]>) {
        for (const collection of Object.keys(initialData)) {
            initialData[collection] = initialData[collection].map(item => {
                if (item.id === undefined) {
                    return { id: (this.idGenerator ? this.idGenerator.generate() : randomUUID()), ...item };
                }
                return item;
            });
        }
        this.store = initialData;
    }

    private enforceUniqueConstraints(collection: string, payload: any, excludeId?: string) {
        const schema = this.schemas.find(s => s.name === collection);
        if (!schema || !schema.fields) return;

        const items = this.store[collection] || [];
        for (const [fieldName, fieldDefRaw] of Object.entries(schema.fields)) {
            const fieldDef = fieldDefRaw as TypeDefinition;
            if (fieldDef.options?.unique && payload[fieldName] !== undefined) {
                const isDuplicate = items.some(item => 
                    item[fieldName] === payload[fieldName] && 
                    (excludeId ? String(item.id) !== String(excludeId) : true)
                );
                if (isDuplicate) {
                    throw new UniqueConstraintError(collection, fieldName, payload[fieldName]);
                }
            }
        }
    }

    private findById(collection: string, id: string) {
        const items = this.store[collection] || [];
        const index = items.findIndex((item) => String(item.id) === String(id));

        if (index === -1) {
            throw new Error(`Item with id '${id}' not found in '${collection}'`);
        }

        return { item: items[index], index };
    }

    private applyPopulation(item: any, collection: string, options?: QueryOptions): any {
        if (!options?.expand || options.expand.length === 0) return item;

        const schema = this.schemas.find(s => s.name === collection);
        if (!schema || !schema.fields) return item;

        const populated = { ...item };

        for (const expandField of options.expand) {
            const fieldDef = schema.fields[expandField];
            if (!fieldDef || fieldDef.type !== 'relation' || !fieldDef.options || !('target' in fieldDef.options)) {
                continue; // Cannot expand non-relation explicit fields
            }

            const targetCollection = (fieldDef.options as any).target;
            const targetItems = this.store[targetCollection] || [];
            const relationType = (fieldDef.options as any).type;

            if (relationType === 'many-to-one' || relationType === 'one-to-one') {
                // Current item holds the Foreign Key.
                // Use explicit foreignKey option, or fall back to the '{fieldName}Id' convention.
                const fkField = (fieldDef.options as any).foreignKey || `${expandField}Id`;
                const fkValue = item[fkField];
                if (fkValue) {
                    const expandedRecord = targetItems.find(t => String(t.id) === String(fkValue));
                    populated[expandField] = expandedRecord || null;
                }
            } else if (relationType === 'one-to-many' || relationType === 'many-to-many') {
                // Reverse FK: child records on the target collection carry a column pointing
                // back at this record's id. Use the explicit foreignKey option, or fall back
                // to the `${parentSingular}Id` convention.
                const fkField = (fieldDef.options as any).foreignKey || `${toSingular(collection)}Id`;
                populated[expandField] = targetItems.filter(child => String(child[fkField]) === String(item.id));
            }
        }

        return populated;
    }

    public async getAll<T = any>(collection: string, options?: QueryOptions): Promise<T[]> {
        const items = this.store[collection] || [];
        this.logger.info(`Read all from '${collection}'`, { count: items.length });
        
        return items.map(item => this.applyPopulation(item, collection, options)) as T[];
    }

    public async getById<T = any>(collection: string, id: string, options?: QueryOptions): Promise<T> {
        this.logger.info(`Read '${id}' from '${collection}'`, { id });
        const { item } = this.findById(collection, id);
        
        return this.applyPopulation(item, collection, options) as T;
    }

    public async search<T = any>(collection: string, query: Record<string, any>, options?: QueryOptions): Promise<T[]> {
        const items = this.store[collection] || [];
        const results = items.filter(item => {
            return Object.keys(query).every(searchKey => String(query[searchKey]) === String(item[searchKey]));
        });
        this.logger.info(`Search in '${collection}'`, { count: results.length });
        
        return results.map(item => this.applyPopulation(item, collection, options)) as T[];
    }

    public async create<T = any>(collection: string, data: any): Promise<T> {
        if (!this.store[collection]) {
            this.store[collection] = [];
        }

        const schema = this.schemas.find(s => s.name === collection);
        const ctx = this.hookContext ?? { db: this, logger: this.logger };

        let payload = data;
        if (schema?.hooks?.beforeCreate) {
            payload = (await schema.hooks.beforeCreate(payload, ctx)) ?? payload;
        }

        this.enforceUniqueConstraints(collection, payload);

        const newId = payload.id !== undefined ? payload.id : (this.idGenerator ? this.idGenerator.generate() : randomUUID());
        const newItem = { ...payload, id: newId };
        this.store[collection].push(newItem);

        this.logger.info(`Created in '${collection}'`, { id: newItem.id });

        if (schema?.hooks?.afterCreate) {
            await schema.hooks.afterCreate(newItem, ctx);
        }

        return newItem as T;
    }

    public async update<T = any>(collection: string, id: string, data: any): Promise<T> {
        const schema = this.schemas.find(s => s.name === collection);
        const ctx = this.hookContext ?? { db: this, logger: this.logger };

        let patch = data;
        if (schema?.hooks?.beforeUpdate) {
            patch = (await schema.hooks.beforeUpdate(patch, ctx)) ?? patch;
        }

        this.enforceUniqueConstraints(collection, patch, id);

        const { item, index } = this.findById(collection, id);

        const updatedItem = { ...item, ...patch, id };
        this.store[collection][index] = updatedItem;

        this.logger.info(`Updated '${id}' in '${collection}'`, { id });

        if (schema?.hooks?.afterUpdate) {
            await schema.hooks.afterUpdate(updatedItem, patch, ctx);
        }

        return updatedItem as T;
    }

    public async delete<T = any>(collection: string, id: string): Promise<T> {
        const { item, index } = this.findById(collection, id);
        this.store[collection].splice(index, 1);

        this.logger.info(`Deleted '${id}' from '${collection}'`, { id });
        return item as T;
    }

    public async isHealthy(): Promise<boolean> {
        return true;
    }
}

export default MemoryDatabaseAdapter;
