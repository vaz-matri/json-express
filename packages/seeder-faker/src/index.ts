import { faker } from '@faker-js/faker';
import type { ISeeder, IDatabaseAdapter, IConfigProvider } from '@json-express/core';

export interface FakerConfig {
    mode?: 'auto' | 'manual';
    count?: number;
    collections?: Record<string, number | (() => any)>;
}

export class FakerSeeder implements ISeeder {
    public readonly name = 'faker';
    private config: FakerConfig;

    constructor({ configProvider }: { configProvider?: IConfigProvider }) {
        this.config = configProvider?.get<FakerConfig>('faker', {}) || {};
    }

    private getDefaultSchema() {
        return {
            id: faker.string.uuid(),
            title: faker.word.words(3),
            createdAt: faker.date.recent().toISOString()
        };
    }

    public async seed(database: IDatabaseAdapter, isForce: boolean): Promise<void> {
        const collections = this.config.collections || {};
        const defaultCount = this.config.count || 10;

        for (const [collection, definition] of Object.entries(collections)) {
            // Check if collection has data
            if (!isForce) {
                const existingData = await database.getAll(collection);
                if (existingData && existingData.length > 0) {
                    console.log(`⏭️  [FakerSeeder] Skipping collection '${collection}', already contains ${existingData.length} records.`);
                    continue;
                }
            } else {
                console.log(`⚠️  [FakerSeeder] Force mode activated for collection '${collection}'. Injecting new records.`);
            }

            let count = defaultCount;
            let schemaGenerator = () => this.getDefaultSchema();

            if (typeof definition === 'number') {
                count = definition;
            } else if (typeof definition === 'function') {
                schemaGenerator = definition as () => any;
            } 

            // Generate and insert
            console.log(`🔨 [FakerSeeder] Generating ${count} mock records for '${collection}'...`);
            for (let i = 0; i < count; i++) {
                const mockRecord = schemaGenerator();
                await database.create(collection, mockRecord);
            }
        }
    }
}
