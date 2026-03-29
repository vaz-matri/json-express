Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let fs = require("fs");
let path = require("path");
let _json_express_core = require("@json-express/core");
let _json_express_adapter_memory = require("@json-express/adapter-memory");
let _json_express_api_rest = require("@json-express/api-rest");
let _json_express_transport_express = require("@json-express/transport-express");
//#region src/index.ts
const startServer = async () => {
	const cwd = process.cwd();
	const files = (0, fs.readdirSync)(cwd, { withFileTypes: true }).filter((dirent) => dirent.isFile() && (0, path.extname)(dirent.name).toLowerCase() === ".json").map((dirent) => dirent.name);
	const initialData = {};
	let config = { port: 3e3 };
	for (const filename of files) {
		if (filename === "package.json" || filename === "package-lock.json" || filename === "tsconfig.json") continue;
		const fileContent = (0, fs.readFileSync)((0, path.join)(cwd, filename), "utf8");
		const parsed = JSON.parse(fileContent);
		if (filename === "config.json") {
			config = {
				...config,
				...parsed
			};
			continue;
		}
		const collectionName = filename.replace(".json", "");
		initialData[collectionName] = Array.isArray(parsed) ? parsed : [parsed];
	}
	const collections = Object.keys(initialData);
	if (collections.length === 0) {
		console.warn("⚠️ No valid JSON data files found to serve.");
		process.exit(1);
	}
	const kernel = new _json_express_core.JsonExpressKernel();
	const memoryDb = new _json_express_adapter_memory.MemoryDatabaseAdapter();
	memoryDb.loadData(initialData);
	const restApi = new _json_express_api_rest.RestApiGenerator({ database: memoryDb });
	const expressTransport = new _json_express_transport_express.ExpressTransport();
	kernel.registerDatabase(memoryDb);
	kernel.registerApiGenerator(restApi);
	kernel.registerTransport(expressTransport);
	await kernel.boot(collections, config.port);
};
//#endregion
exports.startServer = startServer;
