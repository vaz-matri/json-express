import { MongoClient, ObjectId, Db, MongoServerError } from 'mongodb';
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

export interface AdapterMongoConfig {
    /** Direct override; when omitted, read from jex.adapter-mongodb.connectionstring */
    connectionString?: string;
    logger: ILogger;
    dbName?: string;
    configProvider?: IConfigProvider;
}

/**
 * MongoDB database adapter for JSONExpress.
 * @agent-instruction This adapter automatically manages `_id` and string `id` interoperability. Do not configure Mongoose or raw `mongodb` connections in application logic. Inject this adapter into the kernel. Call `.migrate()` via `jex migrate` to build indexes.
 */
export class AdapterMongo implements IDatabaseAdapter {
    private client: MongoClient;
    private dbName?: string;
    private logger: ILogger;
    private schemas: ModelSchema[] = [];
    private hookContext?: HookContext;

    constructor(config: AdapterMongoConfig) {
        const connectionString = config.connectionString
            ?? config.configProvider?.get<string>('adapter-mongodb.connectionstring');
        if (!connectionString) {
            throw new Error(
                '@json-express/adapter-mongodb: no connection string configured. ' +
                'Set jex.adapter-mongodb.connectionstring in .env (or pass { connectionString } directly).'
            );
        }
        this.client = new MongoClient(connectionString);
        this.dbName = config.dbName ?? config.configProvider?.get<string>('adapter-mongodb.dbname');
        this.logger = config.logger.child({ component: 'DB-Mongo' });
    }

    private get db(): Db {
        return this.client.db(this.dbName);
    }

    public setSchemas(schemas: ModelSchema[]) {
        this.schemas = schemas;
    }

    public setHookContext(ctx: HookContext) {
        this.hookContext = ctx;
    }

    public async isHealthy(): Promise<boolean> {
        try {
            await this.db.command({ ping: 1 });
            return true;
        } catch {
            return false;
        }
    }

    public async shutdown(): Promise<void> {
        await this.client.close();
    }

    private parseId(id: string): ObjectId | string {
        if (ObjectId.isValid(id) && (String(new ObjectId(id)) === id)) {
            return new ObjectId(id);
        }
        return id;
    }

    private mapToMongo(data: any): any {
        if (!data) return data;
        const mapped = { ...data };
        if (mapped.id !== undefined) {
            mapped._id = this.parseId(mapped.id);
            delete mapped.id;
        }
        return mapped;
    }

    private mapFromMongo(doc: any): any {
        if (!doc) return null;
        const mapped = { ...doc };
        if (mapped._id !== undefined) {
            mapped.id = mapped._id.toString();
            delete mapped._id;
        }
        return mapped;
    }

    private handleMongoError(collection: string, error: any) {
        if (error instanceof MongoServerError && error.code === 11000) {
            // E11000 duplicate key error
            // Example message: E11000 duplicate key error collection: test.users index: email_1 dup key: { email: "a@b.com" }
            const match = error.message.match(/index:\s+(.*?)_1/);
            const fieldName = match ? match[1] : 'unknown';
            throw new UniqueConstraintError(collection, fieldName, 'duplicate value');
        }
        throw error;
    }

    public async migrate() {
        this.logger.info('Starting MongoDB index migrations...');
        for (const schema of this.schemas) {
            if (!schema.fields) continue;

            const collection = this.db.collection(schema.name);
            for (const [fieldName, fieldDefRaw] of Object.entries(schema.fields)) {
                const fieldDef = fieldDefRaw as TypeDefinition;
                if (fieldDef.options) {
                    if (fieldDef.options.unique) {
                        await collection.createIndex({ [fieldName]: 1 }, { unique: true });
                        this.logger.info(`Created unique index on '${schema.name}.${fieldName}'`);
                    } else if (fieldDef.options.primaryKey) {
                        // In Mongo, _id is the primary key natively. But if they mark another field as PK, we make it unique.
                        await collection.createIndex({ [fieldName]: 1 }, { unique: true });
                        this.logger.info(`Created primaryKey index on '${schema.name}.${fieldName}'`);
                    }
                }
            }

            // Handle composite primary keys
            if (schema.primaryKeys && schema.primaryKeys.length > 0) {
                const indexSpec: Record<string, 1> = {};
                for (const key of schema.primaryKeys) {
                    indexSpec[key] = 1;
                }
                await collection.createIndex(indexSpec, { unique: true });
                this.logger.info(`Created composite primaryKey index on '${schema.name}'`);
            }
        }
        this.logger.info('Migrations complete.');
    }

    public async getAll(collection: string, options?: QueryOptions): Promise<any[]> {
        const col = this.db.collection(collection);
        const results = await col.find({}).toArray();
        this.logger.info(`Read all from '${collection}'`, { count: results.length });
        return results.map(doc => this.mapFromMongo(doc));
    }

    public async getById(collection: string, id: string, options?: QueryOptions): Promise<any> {
        const col = this.db.collection(collection);
        const result = await col.findOne({ _id: this.parseId(id) });
        if (!result) throw new Error(`Item with id '${id}' not found in '${collection}'`);
        this.logger.info(`Read '${id}' from '${collection}'`);
        return this.mapFromMongo(result);
    }

    public async search(collection: string, query: Record<string, any>, options?: QueryOptions): Promise<any[]> {
        const col = this.db.collection(collection);
        // Defense in depth: strip operator/nested keys ($ne, $where, dotted paths) before
        // building the Mongo query. The API layer is the primary choke point, but a direct
        // db.search() from a model hook must not be able to smuggle operators into find().
        const mongoQuery: Record<string, any> = sanitizeFilter(query as Record<string, unknown>);
        // If they search by id
        if (mongoQuery.id !== undefined) {
            mongoQuery._id = this.parseId(mongoQuery.id);
            delete mongoQuery.id;
        }

        const results = await col.find(mongoQuery).toArray();
        this.logger.info(`Search in '${collection}'`, { count: results.length });
        return results.map(doc => this.mapFromMongo(doc));
    }

    public async create(collection: string, data: any): Promise<any> {
        const schema = this.schemas.find(s => s.name === collection);
        const ctx = this.hookContext ?? { db: this, logger: this.logger };

        let payload = data;
        if (schema?.hooks?.beforeCreate) {
            payload = (await schema.hooks.beforeCreate(payload, ctx)) ?? payload;
        }

        const col = this.db.collection(collection);
        const mongoDoc = this.mapToMongo(payload);

        try {
            const result = await col.insertOne(mongoDoc);
            mongoDoc._id = result.insertedId;
            const newItem = this.mapFromMongo(mongoDoc);

            this.logger.info(`Created in '${collection}'`, { id: newItem.id });

            if (schema?.hooks?.afterCreate) {
                await schema.hooks.afterCreate(newItem, ctx);
            }
            return newItem;
        } catch (e: any) {
            this.handleMongoError(collection, e);
        }
    }

    public async update(collection: string, id: string, data: any): Promise<any> {
        const schema = this.schemas.find(s => s.name === collection);
        const ctx = this.hookContext ?? { db: this, logger: this.logger };

        let patch = data;
        if (schema?.hooks?.beforeUpdate) {
            patch = (await schema.hooks.beforeUpdate(patch, ctx)) ?? patch;
        }

        const col = this.db.collection(collection);
        const mongoPatch = { ...patch };
        delete mongoPatch.id; // Prevent updating ID directly

        try {
            const result = await col.findOneAndUpdate(
                { _id: this.parseId(id) },
                { $set: mongoPatch },
                { returnDocument: 'after' }
            );

            if (!result) throw new Error(`Item with id '${id}' not found in '${collection}'`);
            
            const updatedItem = this.mapFromMongo(result);
            this.logger.info(`Updated '${id}' in '${collection}'`);

            if (schema?.hooks?.afterUpdate) {
                await schema.hooks.afterUpdate(updatedItem, patch, ctx);
            }
            return updatedItem;
        } catch (e: any) {
            this.handleMongoError(collection, e);
        }
    }

    public async delete(collection: string, id: string): Promise<any> {
        const col = this.db.collection(collection);
        const result = await col.findOneAndDelete({ _id: this.parseId(id) });
        if (!result) throw new Error(`Item with id '${id}' not found in '${collection}'`);
        
        this.logger.info(`Deleted '${id}' from '${collection}'`);
        return this.mapFromMongo(result);
    }
}

export default AdapterMongo;
