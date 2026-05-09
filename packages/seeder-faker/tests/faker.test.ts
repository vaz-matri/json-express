import { describe, it, expect } from 'vitest';
import { FakerSeeder } from '../src/index';
import { defineModel, types } from '@json-express/core';
import type { IConfigProvider, IDatabaseAdapter, ILogger } from '@json-express/core';

const noopLogger: ILogger = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => noopLogger
};

const cfg = (faker: any): IConfigProvider => ({
    get: (key: string, def?: any) => (key === 'faker' ? faker : def),
    has: () => true,
    set: () => {}
});

class MockAdapter implements IDatabaseAdapter {
    public store: Record<string, any[]> = {};
    private counter = 0;

    async getAll(collection: string): Promise<any[]> {
        return this.store[collection] || [];
    }

    async create(collection: string, data: any): Promise<any> {
        if (!this.store[collection]) this.store[collection] = [];
        const record = { id: data.id ?? `id-${++this.counter}`, ...data };
        this.store[collection].push(record);
        return record;
    }

    async getById() { return null; }
    async search() { return []; }
    async update() { return null; }
    async delete() { return null; }
}

describe('Faker Seeder', () => {
    it('honors a custom generator function from config.collections', async () => {
        const seeder = new FakerSeeder({
            configProvider: cfg({ count: 3, collections: { artists: () => ({ name: 'Test Artist', stars: 5 }) } }),
            logger: noopLogger
        });
        const db = new MockAdapter();

        await seeder.seed(db, false);

        const artists = await db.getAll('artists');
        expect(artists).toHaveLength(3);
        expect(artists[0].name).toBe('Test Artist');
    });

    it('skips a populated collection when not in append mode', async () => {
        const seeder = new FakerSeeder({
            configProvider: cfg({ count: 5, collections: { artists: 5 } }),
            logger: noopLogger
        });
        const db = new MockAdapter();
        await db.create('artists', { name: 'Existing Artist' });

        await seeder.seed(db, false);

        const artists = await db.getAll('artists');
        expect(artists).toHaveLength(1);
        expect(artists[0].name).toBe('Existing Artist');
    });

    it('appends on top of existing data when isAppend is true', async () => {
        const seeder = new FakerSeeder({
            configProvider: cfg({ count: 2, collections: { artists: 2 } }),
            logger: noopLogger
        });
        const db = new MockAdapter();
        await db.create('artists', { title: 'Pre-existing' });

        await seeder.seed(db, true);

        const artists = await db.getAll('artists');
        expect(artists).toHaveLength(3);
    });

    it('auto-seeds from a registered schema with no config.collections entry', async () => {
        const wizards = defineModel({
            name: 'wizards',
            fields: {
                id: types.id(),
                name: types.string({ required: true }),
                level: types.number({ min: 1, max: 100 })
            }
        });

        const seeder = new FakerSeeder({
            configProvider: cfg({ count: 4 }),
            logger: noopLogger
        });
        seeder.setSchemas([wizards]);
        const db = new MockAdapter();

        await seeder.seed(db, false);

        const records = await db.getAll('wizards');
        expect(records).toHaveLength(4);
        for (const r of records) {
            expect(typeof r.name).toBe('string');
            expect(r.name.length).toBeGreaterThan(0);
            expect(typeof r.level).toBe('number');
            expect(r.level).toBeGreaterThanOrEqual(1);
            expect(r.level).toBeLessThanOrEqual(100);
        }
    });

    it('topo-sorts and resolves FKs across a many-to-one relation', async () => {
        const wizards = defineModel({
            name: 'wizards',
            fields: {
                id: types.id(),
                name: types.string({ required: true }),
                potions: types.relation({ target: 'potions', type: 'one-to-many', foreignKey: 'wizardId' })
            }
        });
        const potions = defineModel({
            name: 'potions',
            fields: {
                id: types.id(),
                wizardId: types.string().required(),
                wizard: types.relation({ target: 'wizards', type: 'many-to-one', foreignKey: 'wizardId' })
            }
        });

        const seeder = new FakerSeeder({
            configProvider: cfg({ count: 3 }),
            logger: noopLogger
        });
        // Reverse-order on purpose — topo sort must reorder.
        seeder.setSchemas([potions, wizards]);
        const db = new MockAdapter();

        await seeder.seed(db, false);

        const wizardIds = new Set((await db.getAll('wizards')).map(w => w.id));
        const ps = await db.getAll('potions');
        expect(ps).toHaveLength(3);
        for (const p of ps) {
            expect(p.wizardId).toBeDefined();
            expect(wizardIds.has(p.wizardId)).toBe(true);
        }
    });

    it('respects auto: false — only seeds collections explicitly listed', async () => {
        const wizards = defineModel({
            name: 'wizards',
            fields: { id: types.id(), name: types.string() }
        });

        const seeder = new FakerSeeder({
            configProvider: cfg({ auto: false, collections: { other: 2 } }),
            logger: noopLogger
        });
        seeder.setSchemas([wizards]);
        const db = new MockAdapter();

        await seeder.seed(db, false);

        expect((await db.getAll('wizards'))).toHaveLength(0);
        expect((await db.getAll('other'))).toHaveLength(2);
    });
});
