import pg from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import { uuidv7 } from 'uuidv7';

import type {
    IDatabaseAdapter,
    IConfigProvider,
    ILogger,
    HookContext,
    ModelSchema,
    QueryOptions,
    TypeDefinition
} from '@json-express/core';
import { UniqueConstraintError, sanitizeFilter } from '@json-express/core';
import { translateSchemaToDrizzle } from './schema-translator';

/**
 * Postgres database adapter for JSONExpress.
 * @agent-instruction Do not use `drizzle-kit` for schema migrations. Instead, call `.migrate()` via `jex migrate`. IDs are automatically generated as UUIDv7.
 */
export class AdapterPostgres implements IDatabaseAdapter {
    private pool: pg.Pool;
    private db: NodePgDatabase;
    private logger: ILogger;
    private schemas: ModelSchema[] = [];
    private tables: Record<string, any> = {};
    private hookContext?: HookContext;

    constructor({ connectionString, logger, configProvider }: {
        /** Direct override; when omitted, read from jex.adapter-postgres.connectionString */
        connectionString?: string;
        logger: ILogger;
        configProvider?: IConfigProvider;
    }) {
        const resolved = connectionString
            ?? configProvider?.get<string>('adapter-postgres.connectionstring');
        if (!resolved) {
            throw new Error(
                '@json-express/adapter-postgres: no connection string configured. ' +
                'Set jex.adapter-postgres.connectionString in .env (or pass { connectionString } directly).'
            );
        }
        this.pool = new pg.Pool({ connectionString: resolved });
        this.db = drizzle(this.pool);
        this.logger = logger.child({ component: 'DB-Postgres' });
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.schemas = schemas;
        for (const schema of schemas) {
            const table = translateSchemaToDrizzle(schema);
            if (table) {
                this.tables[schema.name] = table;
            }
        }
    }

    public setHookContext(ctx: HookContext) {
        this.hookContext = ctx;
    }

    public loadData(initialData: Record<string, any[]>) {
        // No-op for now. 
    }

    public async isHealthy(): Promise<boolean> {
        try {
            await this.pool.query('SELECT 1');
            return true;
        } catch {
            return false;
        }
    }

    public async shutdown(): Promise<void> {
        await this.pool.end();
    }

    private getTable(collection: string) {
        const table = this.tables[collection];
        if (!table) throw new Error(`Collection '${collection}' not found in Drizzle schemas.`);
        return table;
    }

    public async migrate() {
        this.logger.info('Starting Postgres migrations...');
        for (const schema of this.schemas) {
            if (!schema.fields) continue;
            
            let sql = `CREATE TABLE IF NOT EXISTS "${schema.name}" (\n`;
            const colDefs: string[] = [];
            
            for (const [fieldName, fieldDefRaw] of Object.entries(schema.fields)) {
                const fieldDef = fieldDefRaw as TypeDefinition;
                let colStr = `"${fieldName}" `;
                
                switch (fieldDef.type) {
                    case 'string': colStr += 'VARCHAR(255)'; break;
                    case 'number': colStr += 'INTEGER'; break;
                    case 'boolean': colStr += 'BOOLEAN'; break;
                    case 'date': colStr += 'TIMESTAMP'; break;
                    case 'id': colStr += 'UUID'; break;
                    case 'relation': 
                        const relOpts = fieldDef.options as any;
                        if (relOpts.type === 'many-to-one' || relOpts.type === 'one-to-one') {
                            const fk = relOpts.foreignKey || `${fieldName}Id`;
                            colDefs.push(`"${fk}" UUID`);
                        }
                        continue;
                    default: colStr += 'VARCHAR(255)';
                }

                if (fieldDef.options) {
                    if (fieldDef.options.primaryKey) colStr += ' PRIMARY KEY';
                    if (fieldDef.options.unique) colStr += ' UNIQUE';
                    if (fieldDef.options.required) colStr += ' NOT NULL';
                    if (fieldDef.options.default !== undefined) {
                        const def = typeof fieldDef.options.default === 'string' ? `'${fieldDef.options.default}'` : fieldDef.options.default;
                        colStr += ` DEFAULT ${def}`;
                    }
                }
                colDefs.push(colStr);
            }
            
            if (schema.primaryKeys && schema.primaryKeys.length > 0) {
                colDefs.push(`PRIMARY KEY (${schema.primaryKeys.map(k => `"${k}"`).join(', ')})`);
            }
            
            sql += colDefs.join(',\n') + '\n);';
            await this.pool.query(sql);
            this.logger.info(`Migrated table '${schema.name}'`);
        }
        this.logger.info('Migrations complete.');
    }

    private handleUniqueError(collection: string, error: any) {
        // Postgres unique violation code
        if (error.code === '23505') {
            const detail = error.detail || '';
            const match = detail.match(/Key \((.*?)\)=/);
            const fieldName = match ? match[1] : 'unknown';
            throw new UniqueConstraintError(collection, fieldName, 'duplicate value');
        }
        throw error;
    }

    public async getAll(collection: string, options?: QueryOptions): Promise<any[]> {
        const table = this.getTable(collection);
        const results = await this.db.select().from(table);
        this.logger.info(`Read all from '${collection}'`, { count: results.length });
        return results;
    }

    public async getById(collection: string, id: string, options?: QueryOptions): Promise<any> {
        const table = this.getTable(collection);
        const results = await this.db.select().from(table).where(eq(table.id, id));
        if (results.length === 0) throw new Error(`Item with id '${id}' not found in '${collection}'`);
        this.logger.info(`Read '${id}' from '${collection}'`);
        return results[0];
    }

    public async search(collection: string, query: Record<string, any>, options?: QueryOptions): Promise<any[]> {
        const table = this.getTable(collection);
        let q = this.db.select().from(table);

        // Defense in depth: the API layer already sanitizes client filters, but a direct
        // db.search() from a model hook could pass anything. Strip operator/nested keys,
        // then allow-list to real columns so an unknown key can't produce eq(undefined, …)
        // (a 500 / cheap DoS) or reach an unintended identifier.
        const safe = sanitizeFilter(query as Record<string, unknown>);
        const conditions = Object.entries(safe)
            .filter(([key]) => (table as Record<string, unknown>)[key] !== undefined)
            .map(([key, val]) => eq((table as Record<string, any>)[key], val));
        if (conditions.length > 0) {
            const result = await q.where(and(...conditions));
            this.logger.info(`Search in '${collection}'`, { count: result.length });
            return result;
        }
        
        const result = await q;
        this.logger.info(`Search in '${collection}'`, { count: result.length });
        return result;
    }

    public async create(collection: string, data: any): Promise<any> {
        const schema = this.schemas.find(s => s.name === collection);
        const ctx = this.hookContext ?? { db: this, logger: this.logger };

        let payload = data;
        if (schema?.hooks?.beforeCreate) {
            payload = (await schema.hooks.beforeCreate(payload, ctx)) ?? payload;
        }

        // Auto ID if not provided and table has an `id` field defined
        if (payload.id === undefined) {
            payload.id = uuidv7();
        }

        const table = this.getTable(collection);
        try {
            const result = await this.db.insert(table).values(payload).returning();
            const newItem = result[0];

            this.logger.info(`Created in '${collection}'`, { id: newItem.id });

            if (schema?.hooks?.afterCreate) {
                await schema.hooks.afterCreate(newItem, ctx);
            }
            return newItem;
        } catch (e: any) {
            this.handleUniqueError(collection, e);
        }
    }

    public async update(collection: string, id: string, data: any): Promise<any> {
        const schema = this.schemas.find(s => s.name === collection);
        const ctx = this.hookContext ?? { db: this, logger: this.logger };

        let patch = data;
        if (schema?.hooks?.beforeUpdate) {
            patch = (await schema.hooks.beforeUpdate(patch, ctx)) ?? patch;
        }

        const table = this.getTable(collection);
        try {
            const result = await this.db.update(table).set(patch).where(eq(table.id, id)).returning();
            if (result.length === 0) throw new Error(`Item with id '${id}' not found in '${collection}'`);
            
            const updatedItem = result[0];
            this.logger.info(`Updated '${id}' in '${collection}'`);

            if (schema?.hooks?.afterUpdate) {
                await schema.hooks.afterUpdate(updatedItem, patch, ctx);
            }
            return updatedItem;
        } catch (e: any) {
            this.handleUniqueError(collection, e);
        }
    }

    public async delete(collection: string, id: string): Promise<any> {
        const table = this.getTable(collection);
        const result = await this.db.delete(table).where(eq(table.id, id)).returning();
        if (result.length === 0) throw new Error(`Item with id '${id}' not found in '${collection}'`);
        
        this.logger.info(`Deleted '${id}' from '${collection}'`);
        return result[0];
    }
}

export default AdapterPostgres;
