import type { IDatabaseAdapter, IConfigProvider, ILogger, IIdGenerator } from '@json-express/core';
import { ConsoleLogger } from '@json-express/core';

export class MemoryDatabaseAdapter implements IDatabaseAdapter {
    // Our in-memory store representing the parsed JSON files
    private store: Record<string, any[]> = {};
    private config?: IConfigProvider;
    private logger: ILogger;
    private idGenerator?: IIdGenerator;

    constructor({ configProvider, logger, idGenerator }: { configProvider?: IConfigProvider; logger?: ILogger; idGenerator?: IIdGenerator } = {}) {
        this.config = configProvider;
        this.logger = logger?.child({ component: 'DB-Memory' }) ?? new ConsoleLogger({ context: { component: 'DB-Memory' } });
        this.idGenerator = idGenerator;
    }

    /**
     * Helper method to load the initial JSON data into memory
     */
    public loadData(initialData: Record<string, any[]>) {
        // Ensure every record has an ID
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

    // --- Utility functions ported from obj-utils.js ---

    private hasRef(obj: any): boolean {
        return obj && typeof obj === 'object' && 'ref' in obj;
    }

    private getRefs(obj: any): Record<string, Array<{ ref: string; id: string }>> {
        const details: Record<string, Array<{ ref: string; id: string }>> = {};

        for (const [key, value] of Object.entries(obj)) {
            if (this.hasRef(value)) {
                details[key] = [{ ref: (value as any).ref, id: (value as any).id }];
            } else if (Array.isArray(value) && value.length > 0 && this.hasRef(value[0])) {
                details[key] = value.map(item => ({ ref: item.ref, id: item.id }));
            }
        }

        return details;
    }

    private findById(collection: string, id: string) {
        const items = this.store[collection] || [];
        const index = items.findIndex((item) => item.id === id);

        if (index === -1) {
            throw new Error(`Item with id '${id}' not found in '${collection}'`);
        }

        return { item: items[index], index };
    }

    // --- IDatabaseAdapter Implementation ---

    public async getAll(collection: string): Promise<any[]> {
        const items = this.store[collection] || [];
        this.logger.info(`Read all from '${collection}'`, { count: items.length });

        // Ported referencing/population logic
        return items.map(item => {
            // Clone to prevent mutating the original store
            const clonedItem = { ...item };
            const refs = this.getRefs(clonedItem);

            for (const refField of Object.keys(refs)) {
                const refObjArr: any[] = [];

                refs[refField].forEach(({ id: refId, ref }) => {
                    const refItems = this.store[ref] || [];

                    if (refId) {
                        const refObj = refItems.find(i => i.id === refId);
                        if (refObj) refObjArr.push(refObj);
                    } else {
                        // Back reference logic
                        const relevantItems = refItems.filter(refItem => {
                            const backRefs = this.getRefs(refItem);
                            return Object.values(backRefs).some(refArr =>
                                refArr.some(br => br.ref === collection && br.id === clonedItem.id)
                            );
                        });
                        refObjArr.push(...relevantItems);
                    }
                });

                clonedItem[refField] = refObjArr;
            }

            return clonedItem;
        });
    }

    public async getById(collection: string, id: string): Promise<any> {
        this.logger.info(`Read '${id}' from '${collection}'`, { id });
        const { item } = this.findById(collection, id);
        return item;
    }

    public async search(collection: string, query: Record<string, any>): Promise<any[]> {
        const items = this.store[collection] || [];
        const results = items.filter(item => {
            return Object.keys(query).every(searchKey => query[searchKey] === item[searchKey]);
        });
        this.logger.info(`Search in '${collection}'`, { count: results.length });
        return results;
    }

    public async create(collection: string, data: any): Promise<any> {
        if (!this.store[collection]) {
            this.store[collection] = [];
        }

        // Auto-generate ID if missing
        const newId = data.id !== undefined ? data.id : (this.idGenerator ? this.idGenerator.generate() : `${Date.now()}`);
        const newItem = { ...data, id: newId };
        this.store[collection].push(newItem);

        this.logger.info(`Created in '${collection}'`, { id: newItem.id });
        return newItem;
    }

    public async update(collection: string, id: string, data: any): Promise<any> {
        const { item, index } = this.findById(collection, id);

        // Merge updates, ensuring ID cannot be overwritten
        const updatedItem = { ...item, ...data, id };
        this.store[collection][index] = updatedItem;

        this.logger.info(`Updated '${id}' in '${collection}'`, { id });
        return updatedItem;
    }

    public async delete(collection: string, id: string): Promise<any> {
        const { item, index } = this.findById(collection, id);
        this.store[collection].splice(index, 1);
        this.logger.info(`Deleted '${id}' from '${collection}'`, { id });
        return item;
    }

    public async isHealthy(): Promise<boolean> {
        return true;
    }
}
