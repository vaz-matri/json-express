Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let _faker_js_faker = require("@faker-js/faker");
//#region src/index.ts
var FakerSeeder = class {
	name = "faker";
	config;
	constructor({ configProvider }) {
		this.config = configProvider?.get("faker", {}) || {};
	}
	getDefaultSchema() {
		return {
			id: _faker_js_faker.faker.string.uuid(),
			title: _faker_js_faker.faker.word.words(3),
			createdAt: _faker_js_faker.faker.date.recent().toISOString()
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
exports.FakerSeeder = FakerSeeder;
