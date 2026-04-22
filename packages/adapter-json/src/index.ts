import { readFileSync, readdirSync, writeFileSync, renameSync, accessSync, existsSync, mkdirSync, constants } from 'fs';
import { join, extname } from 'path';
import type { IDatabaseAdapter, IConfigProvider, ILogger, IIdGenerator } from '@json-express/core';
import { ConsoleLogger } from '@json-express/core';

export class JsonFileDatabaseAdapter implements IDatabaseAdapter {
    private store: Record<string, any[]> = {};
    private filePaths: Record<string, string> = {};
    private timers: Record<string, ReturnType<typeof setTimeout>> = {};
    private cwd: string;
    private config?: IConfigProvider;
    private logger: ILogger;
    private idGenerator?: IIdGenerator;

    constructor({ configProvider, logger, idGenerator }: { configProvider?: IConfigProvider; logger?: ILogger; idGenerator?: IIdGenerator } = {}) {
        this.config = configProvider;
        this.cwd = process.cwd();
        this.logger = logger?.child({ component: 'DB-Json' }) ?? new ConsoleLogger({ context: { component: 'DB-Json' } });
        this.idGenerator = idGenerator;
        this._scanAndLoad();
    }

    // --- File Discovery & Initial Load ---

    private _scanAndLoad() {
        const dataDir = join(this.cwd, 'data');
        if (!existsSync(dataDir)) return;

        const files = readdirSync(dataDir, { withFileTypes: true }).filter(
            dirent => dirent.isFile() && extname(dirent.name).toLowerCase() === '.json'
        );

        for (const dirent of files) {
            const filePath = join(dataDir, dirent.name);
            try {
                const content = readFileSync(filePath, 'utf8');
                const parsed = JSON.parse(content);
                const collection = dirent.name.replace('.json', '');
                let data = Array.isArray(parsed) ? parsed : [parsed];

                // Auto-assign IDs to records missing them
                let modified = false;
                data = data.map(item => {
                    if (item.id === undefined) {
                        modified = true;
                        return { id: (this.idGenerator ? this.idGenerator.generate() : `${Date.now()}`), ...item };
                    }
                    return item;
                });

                this.store[collection] = data;
                this.filePaths[collection] = filePath;

                if (modified) {
                    this.logger.info(`Assigned missing IDs to '${collection}'`);
                    this._persist(collection);
                }
            } catch (e) {
                this.logger.warn(`Skipping unreadable file: ${dirent.name}`);
            }
        }
    }

    // --- Atomic Debounced Write-Back ---

    private _persist(collection: string) {
        // Clear any pending write for this collection
        if (this.timers[collection]) {
            clearTimeout(this.timers[collection]);
        }

        // Debounce: batch rapid mutations into a single write after 50ms idle
        this.timers[collection] = setTimeout(() => {
            const filePath = this.filePaths[collection];
            if (!filePath) return;

            const tmpPath = `${filePath}.tmp`;
            try {
                // Write to .tmp first
                writeFileSync(tmpPath, JSON.stringify(this.store[collection], null, 2), 'utf8');
                // Atomic rename — safe even on crash
                renameSync(tmpPath, filePath);
            } catch (e) {
                this.logger.error(`Failed to persist '${collection}'`, { error: (e as Error).message });
            }

            delete this.timers[collection];
        }, 50);
    }

    // --- Relational Utility Functions (ported from adapter-memory) ---

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
        const index = items.findIndex(item => item.id === id);

        if (index === -1) {
            throw new Error(`Item with id '${id}' not found in '${collection}'`);
        }

        return { item: items[index], index };
    }

    // --- IDatabaseAdapter Implementation ---

    public loadData(initialData: Record<string, any[]>) {
        // adapter-json manages its own files — this is a no-op to satisfy the interface.
        // The CLI may call this with pre-parsed data; we ignore it since we self-loaded.
    }

    public async getAll(collection: string): Promise<any[]> {
        const items = this.store[collection] || [];
        this.logger.info(`Read all from '${collection}'`, { count: items.length });

        return items.map(item => {
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
        const results = items.filter(item =>
            Object.keys(query).every(key => query[key] === item[key])
        );
        this.logger.info(`Search in '${collection}'`, { count: results.length });
        return results;
    }

    public async create(collection: string, data: any): Promise<any> {
        if (!this.store[collection]) {
            this.store[collection] = [];
            const dataDir = join(this.cwd, 'data');
            if (!existsSync(dataDir)) mkdirSync(dataDir);
            this.filePaths[collection] = join(dataDir, `${collection}.json`);
        }

        const newId = data.id !== undefined ? data.id : (this.idGenerator ? this.idGenerator.generate() : `${Date.now()}`);
        const newItem = { ...data, id: newId };
        this.store[collection].push(newItem);

        this.logger.info(`Created in '${collection}'`, { id: newItem.id });
        this._persist(collection);
        return newItem;
    }

    public async update(collection: string, id: string, data: any): Promise<any> {
        const { item, index } = this.findById(collection, id);

        const updatedItem = { ...item, ...data, id };
        this.store[collection][index] = updatedItem;

        this.logger.info(`Updated '${id}' in '${collection}'`, { id });
        this._persist(collection);
        return updatedItem;
    }

    public async delete(collection: string, id: string): Promise<any> {
        const { item, index } = this.findById(collection, id);

        this.store[collection].splice(index, 1);

        this.logger.info(`Deleted '${id}' from '${collection}'`, { id });
        this._persist(collection);
        return item;
    }

    public async isHealthy(): Promise<boolean> {
        try {
            for (const filePath of Object.values(this.filePaths)) {
                accessSync(filePath, constants.R_OK | constants.W_OK);
            }
            return true;
        } catch {
            return false;
        }
    }
}
