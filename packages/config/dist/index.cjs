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
fs = __toESM(fs);
let path = require("path");
path = __toESM(path);
let js_yaml = require("js-yaml");
js_yaml = __toESM(js_yaml);
let jiti = require("jiti");
let url = require("url");
let _json_express_core = require("@json-express/core");
//#region src/index.ts
const jiti$1 = (0, jiti.createJiti)(typeof __filename !== "undefined" ? __filename : (0, url.fileURLToPath)(require("url").pathToFileURL(__filename).href));
var AdvancedConfigProvider = class AdvancedConfigProvider {
	config = {};
	constructor(config) {
		this.config = config;
	}
	static async init(cwd = process.cwd(), env = process.env.NODE_ENV || "development", envConfigOverrides = {}) {
		const extensions = [
			"json",
			"yml",
			"yaml",
			"js",
			"cjs",
			"mjs",
			"ts"
		];
		const baseName = "jex.config";
		const loadConfig = async (name) => {
			for (const ext of extensions) {
				const filePath = path.default.join(cwd, `${name}.${ext}`);
				if (fs.default.existsSync(filePath)) return await this.parseFile(filePath, ext, env);
			}
			return {};
		};
		return new AdvancedConfigProvider((0, _json_express_core.deepMerge)(await loadConfig(baseName), await loadConfig(`${baseName}.${env}`), envConfigOverrides));
	}
	static async parseFile(filePath, ext, env) {
		try {
			if (["json"].includes(ext)) return JSON.parse(fs.default.readFileSync(filePath, "utf8"));
			if (["yml", "yaml"].includes(ext)) return js_yaml.default.load(fs.default.readFileSync(filePath, "utf8")) || {};
			if ([
				"js",
				"cjs",
				"mjs",
				"ts"
			].includes(ext)) {
				const mod = await jiti$1.import(filePath);
				const exported = mod.default || mod;
				if (typeof exported === "function") return exported({ env });
				return exported;
			}
		} catch (e) {
			console.error(`❌ [Config] Error parsing ${filePath}:`, e);
		}
		return {};
	}
	get(key, defaultValue) {
		return (0, _json_express_core.getNestedValue)(this.config, key, defaultValue);
	}
	has(key) {
		return (0, _json_express_core.getNestedValue)(this.config, key, void 0) !== void 0;
	}
};
//#endregion
exports.AdvancedConfigProvider = AdvancedConfigProvider;
