import { faker } from '@faker-js/faker';
import type { ISeeder, IDatabaseAdapter, IConfigProvider, ILogger } from '@json-express/core';

export interface FakerConfig {
    mode?: 'auto' | 'manual';
    count?: number;
    collections?: Record<string, number | (() => any)>;
}

export class FakerSeeder implements ISeeder {
    public readonly name = 'faker';
    private config: FakerConfig;
    private logger: ILogger;

    constructor({ configProvider, logger }: { configProvider?: IConfigProvider, logger: ILogger }) {
        this.config = configProvider?.get<FakerConfig>('faker', {}) || {};
        this.logger = logger.child({ component: 'Faker' });
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
                    this.logger.info(`Skipping collection '${collection}', already contains ${existingData.length} records.`, { collection, count: existingData.length });
                    continue;
                }
            } else {
                this.logger.warn(`Force mode activated for collection '${collection}'. Injecting new records.`, { collection });
            }

            let count = defaultCount;
            let schemaGenerator = () => this.getDefaultSchema();

            if (typeof definition === 'number') {
                count = definition;
            } else if (typeof definition === 'function') {
                schemaGenerator = definition as () => any;
            } 

            // Generate and insert
            this.logger.info(`Generating ${count} mock records for '${collection}'...`, { collection, targetCount: count });
            for (let i = 0; i < count; i++) {
                const mockRecord = schemaGenerator();
                await database.create(collection, mockRecord);
            }
        }
    }
}
