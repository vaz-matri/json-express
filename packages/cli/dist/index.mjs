import { appendFileSync, existsSync, readFileSync, readdirSync } from "fs";
import { extname, join } from "path";
import prompts from "prompts";
import { JsonExpressKernel } from "@json-express/core";
import { EnvConfigProvider } from "@json-express/config-env";
import { MemoryDatabaseAdapter } from "@json-express/adapter-memory";
import { RestApiGenerator } from "@json-express/api-rest";
import { ExpressTransport } from "@json-express/transport-express";
//#region src/index.ts
const startServer = async () => {
	const cwd = process.cwd();
	const configProvider = new EnvConfigProvider(cwd);
	const pkgPath = join(cwd, "package.json");
	let installedDeps = [];
	if (existsSync(pkgPath)) {
		const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
		installedDeps = Object.keys({
			...pkg.dependencies,
			...pkg.devDependencies
		}).filter((dep) => dep.startsWith("@json-express/") || dep.includes("json-express-"));
	}
	const availableTransports = installedDeps.filter((d) => d.includes("transport-"));
	const availableAdapters = installedDeps.filter((d) => d.includes("adapter-"));
	const availableApis = installedDeps.filter((d) => d.includes("api-"));
	const resolvePlugin = async (category, available, defaultPlugin) => {
		const userPreference = configProvider.get(category);
		if (userPreference && available.includes(userPreference)) return userPreference;
		if (available.length === 1) return available[0];
		if (available.length > 1) {
			console.log(`\n⚠️  Conflict Detected: Multiple ${category} layers found!`);
			const choice = (await prompts({
				type: "select",
				name: "choice",
				message: `Which plugin would you like to use for the ${category} layer?`,
				choices: available.map((a) => ({
					title: a,
					value: a
				}))
			})).choice;
			appendFileSync(join(cwd, ".env"), `\nJEX_${category.toUpperCase()}=${choice}\n`);
			console.log(`✅ Saved preference to .env\n`);
			return choice;
		}
		return defaultPlugin;
	};
	const activeAdapter = await resolvePlugin("adapter", availableAdapters, "@json-express/adapter-memory");
	const activeApi = await resolvePlugin("api", availableApis, "@json-express/api-rest");
	const activeTransport = await resolvePlugin("transport", availableTransports, "@json-express/transport-express");
	const loadPluginInstance = async (pluginName, constructorArgs = []) => {
		if (pluginName === "@json-express/adapter-memory") return new MemoryDatabaseAdapter(...constructorArgs);
		if (pluginName === "@json-express/api-rest") return new RestApiGenerator(constructorArgs[0]);
		if (pluginName === "@json-express/transport-express") return new ExpressTransport(...constructorArgs);
		let mod;
		try {
			mod = await import(join(cwd, "node_modules", pluginName));
		} catch (e) {
			mod = await import(pluginName);
		}
		const PluginClass = Object.values(mod)[0];
		return new PluginClass(...constructorArgs);
	};
	const files = readdirSync(cwd, { withFileTypes: true }).filter((dirent) => dirent.isFile() && extname(dirent.name).toLowerCase() === ".json" && !dirent.name.includes("config") && !dirent.name.includes("package") && !dirent.name.includes("tsconfig")).map((dirent) => dirent.name);
	const initialData = {};
	for (const filename of files) {
		const fileContent = readFileSync(join(cwd, filename), "utf8");
		const parsed = JSON.parse(fileContent);
		const collectionName = filename.replace(".json", "");
		initialData[collectionName] = Array.isArray(parsed) ? parsed : [parsed];
	}
	const collections = Object.keys(initialData);
	if (collections.length === 0) {
		console.warn("⚠️  No valid JSON data files found to serve.");
		process.exit(1);
	}
	const kernel = new JsonExpressKernel();
	kernel.registerConfigProvider(configProvider);
	const db = await loadPluginInstance(activeAdapter);
	if (typeof db.loadData === "function") db.loadData(initialData);
	kernel.registerDatabase(db);
	const api = await loadPluginInstance(activeApi, [{ database: db }]);
	kernel.registerApiGenerator(api);
	const transport = await loadPluginInstance(activeTransport);
	kernel.registerTransport(transport);
	const port = configProvider.get("port", 3e3);
	await kernel.boot(collections, port);
};
//#endregion
export { startServer };
