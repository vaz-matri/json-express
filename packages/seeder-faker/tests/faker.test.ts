import { describe, it, expect } from 'vitest';
import { FakerSeeder } from '../src/index';
import type { IConfigProvider, IDatabaseAdapter } from '@json-express/core';

// Stub Database Adapter for testing
class MockAdapter implements IDatabaseAdapter {
    private store: Record<string, any[]> = {};

    async getAll(collection: string): Promise<any[]> {
        return this.store[collection] || [];
    }

    async create(collection: string, data: any): Promise<any> {
        if (!this.store[collection]) this.store[collection] = [];
        this.store[collection].push(data);
        return data;
    }

    // Unused interfaces in seeding
    async getById() { return null; }
    async search() { return []; }
    async update() { return null; }
    async delete() { return null; }
}

describe('Faker Seeder', () => {
    it('should generate requested mock objects via custom schema in an empty database', async () => {
        const configProvider: IConfigProvider = {
            get: (key: string, def?: any) => {
                if (key === 'faker') return {
                    count: 3,
                    collections: { 
                        artists: () => ({ name: 'Test Artist', stars: 5 })
                    }
                };
                return def;
            },
            has: () => true
        };

        const seeder = new FakerSeeder({ configProvider });
        const db = new MockAdapter();

        await seeder.seed(db, false); // isForce = false

        const artists = await db.getAll('artists');
        expect(artists).toHaveLength(3);
        expect(artists[0].name).toBe('Test Artist');
    });

    it('should ignore seeding if the collection is already populated and isForce is false', async () => {
        const configProvider: IConfigProvider = {
            get: (key: string, def?: any) => {
                if (key === 'faker') return {
                    count: 5,
                    collections: { artists: 5 }
                };
                return def;
            },
            has: () => true
        };

        const seeder = new FakerSeeder({ configProvider });
        const db = new MockAdapter();
        // Pre-populate so it shouldn't seed
        await db.create('artists', { name: 'Existing Artist' });

        await seeder.seed(db, false); // isForce = false

        const artists = await db.getAll('artists');
        expect(artists).toHaveLength(1);
        expect(artists[0].name).toBe('Existing Artist');
    });

    it('should override and overwrite existing records if isForce is true', async () => {
         const configProvider: IConfigProvider = {
            get: (key: string, def?: any) => {
                if (key === 'faker') return {
                    count: 2,
                    collections: { artists: 2 }
                };
                return def;
            },
            has: () => true
        };

        const seeder = new FakerSeeder({ configProvider });
        const db = new MockAdapter();
        await db.create('artists', { title: 'Pre-existing' });

        // isForce = true
        await seeder.seed(db, true); 

        const artists = await db.getAll('artists');
        // Original 1 + newly injected 2 = 3
        expect(artists).toHaveLength(3);
    });
});
