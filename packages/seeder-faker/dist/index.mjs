import { faker } from "@faker-js/faker";
//#region src/index.ts
var FakerSeeder = class {
	name = "faker";
	config;
	constructor({ configProvider }) {
		this.config = configProvider?.get("faker", {}) || {};
	}
	getDefaultSchema() {
		return {
			id: faker.string.uuid(),
			title: faker.word.words(3),
			createdAt: faker.date.recent().toISOString()
		};
	}
	async seed(database, isForce) {
		const collections = this.config.collections || {};
		const defaultCount = this.config.count || 10;
		for (const [collection, definition] of Object.entries(collections)) {
			if (!isForce) {
				const existingData = await database.getAll(collection);
				if (existingData && existingData.length > 0) {
					console.log(`⏭️  [FakerSeeder] Skipping collection '${collection}', already contains ${existingData.length} records.`);
					continue;
				}
			} else console.log(`⚠️  [FakerSeeder] Force mode activated for collection '${collection}'. Injecting new records.`);
			let count = defaultCount;
			let schemaGenerator = () => this.getDefaultSchema();
			if (typeof definition === "number") count = definition;
			else if (typeof definition === "function") schemaGenerator = definition;
			console.log(`🔨 [FakerSeeder] Generating ${count} mock records for '${collection}'...`);
			for (let i = 0; i < count; i++) {
				const mockRecord = schemaGenerator();
				await database.create(collection, mockRecord);
			}
		}
	}
};
//#endregion
export { FakerSeeder };
