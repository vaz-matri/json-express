import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { buildNestedConfigFromEnv, getNestedValue } from "@json-express/core";
//#region src/index.ts
var EnvConfigProvider = class {
	config = {};
	constructor(cwd = process.cwd(), env = process.env.NODE_ENV || "development") {
		const filesToLoad = [
			".env",
			`.env.${env}`,
			".env.local",
			`.env.${env}.local`
		];
		let mergedRawEnv = {};
		for (const file of filesToLoad) {
			const fullPath = path.join(cwd, file);
			if (fs.existsSync(fullPath)) {
				const parsed = dotenv.parse(fs.readFileSync(fullPath, "utf8"));
				mergedRawEnv = {
					...mergedRawEnv,
					...parsed
				};
			}
		}
		mergedRawEnv = {
			...mergedRawEnv,
			...process.env
		};
		this.config = buildNestedConfigFromEnv(mergedRawEnv, "JEX_");
	}
	get(key, defaultValue) {
		return getNestedValue(this.config, key, defaultValue);
	}
	has(key) {
		return getNestedValue(this.config, key, void 0) !== void 0;
	}
	/** Helper to allow deep merging if the advanced config plugin is also loaded */
	getRawConfig() {
		return this.config;
	}
};
//#endregion
export { EnvConfigProvider };
