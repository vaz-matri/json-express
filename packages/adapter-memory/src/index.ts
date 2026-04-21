import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { IDatabaseAdapter, IConfigProvider, ILogger, IIdGenerator, QueryOptions, ModelSchema } from '@json-express/core';
import { ConsoleLogger } from '@json-express/core';

export class MemoryDatabaseAdapter implements IDatabaseAdapter {
    private store: Record<string, any[]> = {};
    private config?: IConfigProvider;
    private logger: ILogger;
    private idGenerator?: IIdGenerator;
    private schemas: ModelSchema[] = [];

    constructor({ configProvider, logger, idGenerator }: { configProvider?: IConfigProvider; logger?: ILogger; idGenerator?: IIdGenerator } = {}) {
        this.config = configProvider;
        this.logger = logger?.child({ component: 'DB-Memory' }) ?? new ConsoleLogger({ context: { component: 'DB-Memory' } });
        this.idGenerator = idGenerator;
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.schemas = schemas;
    }

    public loadData(initialData: Record<string, any[]>) {
        for (const collection of Object.keys(initialData)) {
            initialData[collection] = initialData[collection].map(item => {
                if (item.id === undefined) {
                    return { id: (this.idGenerator ? this.idGenerator.generate() : `${Date.now()}`), ...item };
                }
                return item;
            });
        }
        this.store = initialData;
    }

    private syncToDisk(collection: string) {
        // We sync directly back to the ./data folder.
        // Wrapped in try-catch to prevent crashes in serverless/readonly environments.
        try {
            const cwd = process.cwd();
            const dataDir = join(cwd, 'data');
            if (!existsSync(dataDir)) {
                mkdirSync(dataDir);
            }
            const filepath = join(dataDir, `${collection}.json`);
            writeFileSync(filepath, JSON.stringify(this.store[collection] || [], null, 2), 'utf8');
        } catch (e: any) {
            this.logger.warn(`Failed to sync '${collection}' to disk: ${e.message}`);
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
        if (!schema) return item;

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
                // Current item holds the Foreign Key
                const fkValue = item[expandField];
                if (fkValue) {
                    const expandedRecord = targetItems.find(t => String(t.id) === String(fkValue));
                    populated[expandField] = expandedRecord || null;
                }
            } else if (relationType === 'one-to-many') {
                // Heuristic: Foreign records point BACK to this item's ID
                const childRecords = targetItems.filter(child => {
                     return Object.entries(child).some(([k, v]) => String(v) === String(item.id));
                });
                populated[expandField] = childRecords;
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

        const newId = data.id !== undefined ? data.id : (this.idGenerator ? this.idGenerator.generate() : `${Date.now()}`);
        const newItem = { ...data, id: newId };
        this.store[collection].push(newItem);

        this.syncToDisk(collection);
        this.logger.info(`Created in '${collection}'`, { id: newItem.id });
        return newItem as T;
    }

    public async update<T = any>(collection: string, id: string, data: any): Promise<T> {
        const { item, index } = this.findById(collection, id);

        const updatedItem = { ...item, ...data, id };
        this.store[collection][index] = updatedItem;

        this.syncToDisk(collection);
        this.logger.info(`Updated '${id}' in '${collection}'`, { id });
        return updatedItem as T;
    }

    public async delete<T = any>(collection: string, id: string): Promise<T> {
        const { item, index } = this.findById(collection, id);
        this.store[collection].splice(index, 1);
        
        this.syncToDisk(collection);
        this.logger.info(`Deleted '${id}' from '${collection}'`, { id });
        return item as T;
    }

    public async isHealthy(): Promise<boolean> {
        return true;
    }
}
