import { readFileSync, readdirSync } from "fs";
import { extname, join } from "path";
import { JsonExpressKernel } from "@json-express/core";
import { MemoryDatabaseAdapter } from "@json-express/adapter-memory";
import { RestApiGenerator } from "@json-express/api-rest";
import { ExpressTransport } from "@json-express/transport-express";
//#region src/index.ts
const startServer = async () => {
	const cwd = process.cwd();
	const files = readdirSync(cwd, { withFileTypes: true }).filter((dirent) => dirent.isFile() && extname(dirent.name).toLowerCase() === ".json").map((dirent) => dirent.name);
	const initialData = {};
	let config = { port: 3e3 };
	for (const filename of files) {
		if (filename === "package.json" || filename === "package-lock.json" || filename === "tsconfig.json") continue;
		const fileContent = readFileSync(join(cwd, filename), "utf8");
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
	const kernel = new JsonExpressKernel();
	const memoryDb = new MemoryDatabaseAdapter();
	memoryDb.loadData(initialData);
	const restApi = new RestApiGenerator({ database: memoryDb });
	const expressTransport = new ExpressTransport();
	kernel.registerDatabase(memoryDb);
	kernel.registerApiGenerator(restApi);
	kernel.registerTransport(expressTransport);
	await kernel.boot(collections, config.port);
};
//#endregion
export { startServer };
