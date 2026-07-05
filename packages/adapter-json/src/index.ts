import { readFileSync, readdirSync, writeFileSync, renameSync, accessSync, existsSync, mkdirSync, constants } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import type { IDatabaseAdapter, IConfigProvider, ILogger, IIdGenerator, QueryOptions, ModelSchema, HookContext, TypeDefinition } from '@json-express/core';
import { UniqueConstraintError } from '@json-express/core';

function toSingular(name: string): string {
    if (name.endsWith('ies')) return name.slice(0, -3) + 'y';
    if (name.endsWith('s')) return name.slice(0, -1);
    return name;
}

export class JsonFileDatabaseAdapter implements IDatabaseAdapter {
    private store: Record<string, any[]> = {};
    private filePaths: Record<string, string> = {};
    private timers: Record<string, ReturnType<typeof setTimeout>> = {};
    private cwd: string;
    private config?: IConfigProvider;
    private logger: ILogger;
    private idGenerator?: IIdGenerator;
    private schemas: ModelSchema[] = [];
    private hookContext?: HookContext;

    constructor({ configProvider, logger, idGenerator }: { configProvider?: IConfigProvider; logger: ILogger; idGenerator?: IIdGenerator }) {
        this.config = configProvider;
        this.cwd = process.cwd();
        this.logger = logger.child({ component: 'DB-Json' });
        this.idGenerator = idGenerator;
        this._scanAndLoad();
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.schemas = schemas;
    }

    public setHookContext(ctx: HookContext) {
        this.hookContext = ctx;
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
                        return { id: (this.idGenerator ? this.idGenerator.generate() : randomUUID()), ...item };
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

    private applyPopulation(item: any, collection: string, options?: QueryOptions): any {
        const populated = { ...item };

        // 1. Schema-driven expansion (opt-in via _expand).
        //    Mirrors adapter-memory's contract: many-to-one/one-to-one returns a single
        //    record (or null); one-to-many/many-to-many returns an array.
        const schema = this.schemas.find(s => s.name === collection);
        if (options?.expand?.length && schema) {
            for (const expandField of options.expand) {
                const fieldDef = schema.fields[expandField] as TypeDefinition | undefined;
                if (!fieldDef || fieldDef.type !== 'relation' || !fieldDef.options || !('target' in fieldDef.options)) {
                    continue;
                }

                const targetCollection = (fieldDef.options as any).target;
                const targetItems = this.store[targetCollection] || [];
                const relationType = (fieldDef.options as any).type;

                if (relationType === 'many-to-one' || relationType === 'one-to-one') {
                    const fkField = (fieldDef.options as any).foreignKey || `${expandField}Id`;
                    const fkValue = item[fkField];
                    if (fkValue) {
                        const expandedRecord = targetItems.find(t => String(t.id) === String(fkValue));
                        populated[expandField] = expandedRecord || null;
                    }
                } else if (relationType === 'one-to-many' || relationType === 'many-to-many') {
                    const fkField = (fieldDef.options as any).foreignKey || `${toSingular(collection)}Id`;
                    populated[expandField] = targetItems.filter(child => String(child[fkField]) === String(item.id));
                }
            }
        }

        // 2. Inline `{ ref, id }` envelope auto-expansion (always-on, legacy behavior
        //    used by the `json-adv` example for relations declared in JSON without a
        //    model file). Skipped for any field that step 1 already replaced — the
        //    expanded record won't match the envelope shape.
        const refs = this.getRefs(populated);
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
                            refArr.some(br => br.ref === collection && br.id === item.id)
                        );
                    });
                    refObjArr.push(...relevantItems);
                }
            });
            populated[refField] = refObjArr;
        }

        return populated;
    }

    public async getAll(collection: string, options?: QueryOptions): Promise<any[]> {
        const items = this.store[collection] || [];
        this.logger.info(`Read all from '${collection}'`, { count: items.length });
        return items.map(item => this.applyPopulation(item, collection, options));
    }

    public async getById(collection: string, id: string, options?: QueryOptions): Promise<any> {
        this.logger.info(`Read '${id}' from '${collection}'`, { id });
        const { item } = this.findById(collection, id);
        return this.applyPopulation(item, collection, options);
    }

    public async search(collection: string, query: Record<string, any>, options?: QueryOptions): Promise<any[]> {
        const items = this.store[collection] || [];
        const results = items.filter(item =>
            Object.keys(query).every(key => query[key] === item[key])
        );
        this.logger.info(`Search in '${collection}'`, { count: results.length });
        return results.map(item => this.applyPopulation(item, collection, options));
    }

    public async create(collection: string, data: any): Promise<any> {
        if (!this.store[collection]) {
            this.store[collection] = [];
            const dataDir = join(this.cwd, 'data');
            if (!existsSync(dataDir)) mkdirSync(dataDir);
            this.filePaths[collection] = join(dataDir, `${collection}.json`);
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
        this._persist(collection);

        if (schema?.hooks?.afterCreate) {
            await schema.hooks.afterCreate(newItem, ctx);
        }

        return newItem;
    }

    public async update(collection: string, id: string, data: any): Promise<any> {
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
        this._persist(collection);

        if (schema?.hooks?.afterUpdate) {
            await schema.hooks.afterUpdate(updatedItem, patch, ctx);
        }

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

export default JsonFileDatabaseAdapter;
