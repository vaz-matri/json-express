Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let awilix = require("awilix");
//#region src/kernel.ts
var JsonExpressKernel = class {
	container;
	constructor() {
		this.container = (0, awilix.createContainer)();
	}
	registerConfigProvider(provider) {
		this.container.register({ configProvider: (0, awilix.asValue)(provider) });
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
		const env = process.env.NODE_ENV || "development";
		this.container.register({ NODE_ENV: (0, awilix.asValue)(env) });
		let configProvider;
		try {
			configProvider = this.container.resolve("configProvider");
		} catch (e) {
			configProvider = {
				get: (key, def) => def,
				has: () => false
			};
			this.container.register({ configProvider: (0, awilix.asValue)(configProvider) });
		}
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
//#region src/config.ts
/**
* Deeply merges multiple objects.
* Arrays and primitives are overwritten. Objects are merged recursively.
* Precedence goes from left to right (last object wins).
*/
function deepMerge(...objects) {
	const isObject = (obj) => obj && typeof obj === "object" && !Array.isArray(obj);
	return objects.reduce((prev, obj) => {
		if (!isObject(prev) || !isObject(obj)) return obj !== void 0 ? obj : prev;
		const output = { ...prev };
		Object.keys(obj).forEach((key) => {
			if (isObject(obj[key])) if (!(key in prev)) output[key] = obj[key];
			else output[key] = deepMerge(prev[key], obj[key]);
			else output[key] = obj[key];
		});
		return output;
	}, {});
}
/**
* Retrieves a nested value from an object using dot notation.
*/
function getNestedValue(obj, path, defaultValue) {
	const keys = path.split(".");
	let current = obj;
	for (const key of keys) {
		if (current === void 0 || current === null) return defaultValue;
		current = current[key];
	}
	return current !== void 0 ? current : defaultValue;
}
/**
* Converts a flat Record (e.g. process.env) with JEX_ prefixes and dot notation into a nested object.
* Example: { "JEX_DATABASE.MAX_CONNECTIONS": "100" } => { database: { max_connections: 100 } }
*/
function buildNestedConfigFromEnv(envVars, prefix = "JEX_") {
	const config = {};
	for (const [key, value] of Object.entries(envVars)) {
		if (!key.startsWith(prefix) || value === void 0) continue;
		const parts = key.slice(prefix.length).toLowerCase().split(".");
		let current = config;
		for (let i = 0; i < parts.length - 1; i++) {
			const part = parts[i];
			if (!current[part]) current[part] = {};
			current = current[part];
		}
		let parsedValue = value;
		if (value === "true") parsedValue = true;
		else if (value === "false") parsedValue = false;
		else if (!isNaN(Number(value)) && value.trim() !== "") parsedValue = Number(value);
		current[parts[parts.length - 1]] = parsedValue;
	}
	return config;
}
//#endregion
exports.JsonExpressKernel = JsonExpressKernel;
exports.buildNestedConfigFromEnv = buildNestedConfigFromEnv;
exports.deepMerge = deepMerge;
exports.getNestedValue = getNestedValue;
