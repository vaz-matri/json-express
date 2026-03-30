import fs from "fs";
import path from "path";
import yaml from "js-yaml";
import { createJiti } from "jiti";
import { fileURLToPath } from "url";
import { deepMerge, getNestedValue } from "@json-express/core";
//#region src/index.ts
const jiti = createJiti(typeof __filename !== "undefined" ? __filename : fileURLToPath(import.meta.url));
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
				const filePath = path.join(cwd, `${name}.${ext}`);
				if (fs.existsSync(filePath)) return await this.parseFile(filePath, ext, env);
			}
			return {};
		};
		return new AdvancedConfigProvider(deepMerge(await loadConfig(baseName), await loadConfig(`${baseName}.${env}`), envConfigOverrides));
	}
	static async parseFile(filePath, ext, env) {
		try {
			if (["json"].includes(ext)) return JSON.parse(fs.readFileSync(filePath, "utf8"));
			if (["yml", "yaml"].includes(ext)) return yaml.load(fs.readFileSync(filePath, "utf8")) || {};
			if ([
				"js",
				"cjs",
				"mjs",
				"ts"
			].includes(ext)) {
				const mod = await jiti.import(filePath);
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
		return getNestedValue(this.config, key, defaultValue);
	}
	has(key) {
		return getNestedValue(this.config, key, void 0) !== void 0;
	}
};
//#endregion
export { AdvancedConfigProvider };
