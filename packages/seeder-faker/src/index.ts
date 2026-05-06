import { faker } from '@faker-js/faker';
import type { ISeeder, IDatabaseAdapter, IConfigProvider, ILogger, ModelSchema, TypeDefinition } from '@json-express/core';

export interface FakerConfig {
    /**
     * When `true` (default), every collection that has a registered schema is
     * auto-seeded using a generator synthesized from its field types. Set
     * `false` to seed only the collections explicitly listed in `collections`.
     */
    auto?: boolean;
    /** Default number of records per collection when no per-collection number is given. */
    count?: number;
    /**
     * Per-collection overrides:
     *  - `number`: count override; auto-schema generator is still used.
     *  - `() => any`: full generator override; replaces auto-schema entirely.
     */
    collections?: Record<string, number | (() => any)>;
}

interface RelationOpts {
    target: string;
    type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';
    foreignKey?: string;
}

export class FakerSeeder implements ISeeder {
    public readonly name = 'faker';
    private config: FakerConfig;
    private logger: ILogger;
    private schemas: ModelSchema[] = [];

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider; logger: ILogger }) {
        this.config = configProvider?.get<FakerConfig>('faker', {}) || {};
        this.logger = logger.child({ component: 'Faker' });
    }

    public setSchemas(schemas: ModelSchema[]): void {
        this.schemas = schemas;
    }

    private getDefaultSchema() {
        return {
            title: faker.word.words(3),
            createdAt: faker.date.recent().toISOString()
        };
    }

    /**
     * Foreign keys that physically live on THIS schema's records:
     * - `many-to-one` always stores the FK locally.
     * - `one-to-one` stores the FK locally only when `foreignKey` is declared on this side.
     * `one-to-many` and `many-to-many` are excluded — their FK lives on the other side
     * (or in a join table for m2m, which we don't auto-seed).
     */
    private getLocalFkMap(schema: ModelSchema): Record<string, string> {
        const map: Record<string, string> = {};
        for (const [fieldName, def] of Object.entries(schema.fields)) {
            const td = def as TypeDefinition;
            if (td.type !== 'relation') continue;
            const opts = td.options as RelationOpts | undefined;
            if (!opts) continue;
            const isLocal = opts.type === 'many-to-one' || (opts.type === 'one-to-one' && !!opts.foreignKey);
            if (!isLocal) continue;
            const fkField = opts.foreignKey || `${fieldName}Id`;
            map[fkField] = opts.target;
        }
        return map;
    }

    /** Returns the list of collection names this schema directly depends on (parents-first). */
    private getDependencies(schema: ModelSchema): string[] {
        return Object.values(this.getLocalFkMap(schema));
    }

    /**
     * Topologically sort the requested collection names so that any collection
     * with an FK on a peer is seeded after that peer. Collections without a
     * registered schema (function-only seeds) sort to the front. On a cycle,
     * we log a warning and fall back to the original input order — the lagging
     * side's FK will resolve to `null`, which is a documented limitation.
     */
    private topoSort(names: string[]): string[] {
        const inSet = new Set(names);
        const indeg: Record<string, number> = {};
        const edges: Record<string, string[]> = {};

        for (const name of names) {
            indeg[name] = 0;
            edges[name] = [];
        }
        for (const name of names) {
            const schema = this.schemas.find(s => s.name === name);
            if (!schema) continue;
            for (const dep of this.getDependencies(schema)) {
                if (!inSet.has(dep) || dep === name) continue;
                edges[dep].push(name);
                indeg[name]++;
            }
        }

        const queue = names.filter(n => indeg[n] === 0);
        const ordered: string[] = [];
        while (queue.length) {
            const n = queue.shift()!;
            ordered.push(n);
            for (const next of edges[n]) {
                indeg[next]--;
                if (indeg[next] === 0) queue.push(next);
            }
        }

        if (ordered.length !== names.length) {
            this.logger.warn(
                'Cycle detected in relation graph — falling back to declaration order. ' +
                'Foreign keys on the lagging side may resolve to null. ' +
                'Provide an explicit generator function in faker.collections to fix.',
                { unresolved: names.filter(n => !ordered.includes(n)) }
            );
            for (const n of names) {
                if (!ordered.includes(n)) ordered.push(n);
            }
        }
        return ordered;
    }

    private generateString(opts: any = {}): string {
        const min = typeof opts.minLength === 'number' ? opts.minLength : 0;
        const max = typeof opts.maxLength === 'number' ? opts.maxLength : 200;
        let value = faker.lorem.words({ min: 2, max: 4 });
        if (value.length > max) value = value.slice(0, max);
        if (value.length < min) value = value.padEnd(min, 'x');
        return value;
    }

    private fromSchema(schema: ModelSchema, seededIds: Record<string, any[]>): any {
        const fkMap = this.getLocalFkMap(schema);
        const record: Record<string, any> = {};

        for (const [fieldName, def] of Object.entries(schema.fields)) {
            const td = def as TypeDefinition;
            const opts: any = td.options || {};

            // The relation field itself is virtual — the FK column carries the value.
            if (td.type === 'relation') continue;

            // FK column for a relation that lives on this side: pick a random parent id.
            if (fieldName in fkMap) {
                const target = fkMap[fieldName];
                const pool = seededIds[target] || [];
                record[fieldName] = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
                continue;
            }

            switch (td.type) {
                case 'id':
                    // DB assigns.
                    break;
                case 'string':
                    record[fieldName] = this.generateString(opts);
                    break;
                case 'number': {
                    const min = typeof opts.min === 'number' ? opts.min : 0;
                    const max = typeof opts.max === 'number' ? opts.max : 1000;
                    record[fieldName] = faker.number.int({ min, max });
                    break;
                }
                case 'boolean':
                    record[fieldName] = typeof opts.default === 'boolean' ? opts.default : faker.datatype.boolean();
                    break;
                case 'date':
                    record[fieldName] = faker.date.recent().toISOString();
                    break;
                default:
                    // Unknown type — leave undefined; the adapter/api decides what to do.
                    break;
            }
        }
        return record;
    }

    public async seed(database: IDatabaseAdapter, isAppend: boolean): Promise<void> {
        const auto = this.config.auto !== false;
        const defaultCount = this.config.count ?? 10;
        const userCollections = this.config.collections || {};

        // Build the union of schema-derived and user-listed collection names.
        const targets = new Set<string>();
        if (auto) {
            for (const s of this.schemas) targets.add(s.name);
        }
        for (const k of Object.keys(userCollections)) targets.add(k);

        if (targets.size === 0) {
            this.logger.info('Nothing to seed — no schemas registered and no faker.collections configured.');
            return;
        }

        const ordered = this.topoSort([...targets]);
        const seededIds: Record<string, any[]> = {};

        for (const name of ordered) {
            const definition = userCollections[name];
            const schema = this.schemas.find(s => s.name === name);

            // Skip if existing data and not in append mode.
            if (!isAppend) {
                const existing = await database.getAll(name);
                if (existing && existing.length > 0) {
                    this.logger.info(`Skipping '${name}' — already contains ${existing.length} records.`, { collection: name, count: existing.length });
                    seededIds[name] = existing.map((r: any) => r.id);
                    continue;
                }
            } else {
                this.logger.warn(`Append mode active for '${name}' — injecting new records on top of existing data.`, { collection: name });
            }

            let count = defaultCount;
            let generator: () => any;

            if (typeof definition === 'function') {
                generator = definition as () => any;
            } else {
                if (typeof definition === 'number') count = definition;
                if (schema) {
                    generator = () => this.fromSchema(schema, seededIds);
                } else {
                    generator = () => this.getDefaultSchema();
                }
            }

            this.logger.info(`Generating ${count} mock records for '${name}'...`, { collection: name, targetCount: count });
            seededIds[name] = seededIds[name] || [];
            for (let i = 0; i < count; i++) {
                const created = await database.create(name, generator());
                if (created && created.id !== undefined) seededIds[name].push(created.id);
            }
        }
    }
}
