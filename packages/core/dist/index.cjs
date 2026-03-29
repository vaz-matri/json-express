Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let awilix = require("awilix");
//#region src/kernel.ts
var JsonExpressKernel = class {
	container;
	constructor() {
		this.container = (0, awilix.createContainer)();
	}
	registerDatabase(adapter) {
		this.container.register({ database: (0, awilix.asValue)(adapter) });
	}
	registerTransport(transport) {
		this.container.register({ transport: (0, awilix.asValue)(transport) });
	}
	registerApiGenerator(generator) {
		this.container.register({ apiGenerator: (0, awilix.asValue)(generator) });
	}
	async boot(collections, port = 3e3) {
		console.log("🚀 JSON Express Kernel initializing...");
		const db = this.container.resolve("database");
		const apiGenerator = this.container.resolve("apiGenerator");
		const transport = this.container.resolve("transport");
		if (!db || !apiGenerator || !transport) throw new Error("❌ Missing core plugins! Ensure Database, ApiGenerator, and Transport are registered.");
		console.log(`⚙️  Generating API definitions for: ${collections.join(", ")}`);
		const routes = apiGenerator.generate(collections);
		console.log(`🔗 Registering ${routes.length} routes with the transport layer...`);
		for (const route of routes) transport.registerRoute(route);
		console.log(`🟢 Starting server on port ${port}...`);
		await transport.start(port);
	}
};
//#endregion
exports.JsonExpressKernel = JsonExpressKernel;
