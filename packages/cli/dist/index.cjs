Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region \0rolldown/runtime.js
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
	if (from && typeof from === "object" || typeof from === "function") for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key; i < n; i++) {
		key = keys[i];
		if (!__hasOwnProp.call(to, key) && key !== except) __defProp(to, key, {
			get: ((k) => from[k]).bind(null, key),
			enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
		});
	}
	return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", {
	value: mod,
	enumerable: true
}) : target, mod));
//#endregion
let fs = require("fs");
let path = require("path");
let prompts = require("prompts");
prompts = __toESM(prompts);
let _json_express_core = require("@json-express/core");
let _json_express_config_env = require("@json-express/config-env");
let _json_express_adapter_memory = require("@json-express/adapter-memory");
let _json_express_api_rest = require("@json-express/api-rest");
let _json_express_transport_express = require("@json-express/transport-express");
//#region src/index.ts
const startServer = async () => {
	const cwd = process.cwd();
	const configProvider = new _json_express_config_env.EnvConfigProvider(cwd);
	const pkgPath = (0, path.join)(cwd, "package.json");
	let installedDeps = [];
	if ((0, fs.existsSync)(pkgPath)) {
		const pkg = JSON.parse((0, fs.readFileSync)(pkgPath, "utf8"));
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
			const choice = (await (0, prompts.default)({
				type: "select",
				name: "choice",
				message: `Which plugin would you like to use for the ${category} layer?`,
				choices: available.map((a) => ({
					title: a,
					value: a
				}))
			})).choice;
			(0, fs.appendFileSync)((0, path.join)(cwd, ".env"), `\nJEX_${category.toUpperCase()}=${choice}\n`);
			console.log(`✅ Saved preference to .env\n`);
			return choice;
		}
		return defaultPlugin;
	};
	const activeAdapter = await resolvePlugin("adapter", availableAdapters, "@json-express/adapter-memory");
	const activeApi = await resolvePlugin("api", availableApis, "@json-express/api-rest");
	const activeTransport = await resolvePlugin("transport", availableTransports, "@json-express/transport-express");
	const loadPluginInstance = async (pluginName, constructorArgs = []) => {
		if (pluginName === "@json-express/adapter-memory") return new _json_express_adapter_memory.MemoryDatabaseAdapter(...constructorArgs);
		if (pluginName === "@json-express/api-rest") return new _json_express_api_rest.RestApiGenerator(constructorArgs[0]);
		if (pluginName === "@json-express/transport-express") return new _json_express_transport_express.ExpressTransport(...constructorArgs);
		let mod;
		try {
			mod = await import((0, path.join)(cwd, "node_modules", pluginName));
		} catch (e) {
			mod = await import(pluginName);
		}
		const PluginClass = Object.values(mod)[0];
		return new PluginClass(...constructorArgs);
	};
	const files = (0, fs.readdirSync)(cwd, { withFileTypes: true }).filter((dirent) => dirent.isFile() && (0, path.extname)(dirent.name).toLowerCase() === ".json" && !dirent.name.includes("config") && !dirent.name.includes("package") && !dirent.name.includes("tsconfig")).map((dirent) => dirent.name);
	const initialData = {};
	for (const filename of files) {
		const fileContent = (0, fs.readFileSync)((0, path.join)(cwd, filename), "utf8");
		const parsed = JSON.parse(fileContent);
		const collectionName = filename.replace(".json", "");
		initialData[collectionName] = Array.isArray(parsed) ? parsed : [parsed];
	}
	const collections = Object.keys(initialData);
	if (collections.length === 0) {
		console.warn("⚠️  No valid JSON data files found to serve.");
		process.exit(1);
	}
	const kernel = new _json_express_core.JsonExpressKernel();
	kernel.registerConfigProvider(configProvider);
	const db = await loadPluginInstance(activeAdapter, [{ configProvider }]);
	if (typeof db.loadData === "function") db.loadData(initialData);
	kernel.registerDatabase(db);
	const api = await loadPluginInstance(activeApi, [{
		database: db,
		configProvider
	}]);
	kernel.registerApiGenerator(api);
	const transport = await loadPluginInstance(activeTransport, [{ configProvider }]);
	kernel.registerTransport(transport);
	const port = configProvider.get("port", 3e3);
	await kernel.boot(collections, port);
};
//#endregion
exports.startServer = startServer;
