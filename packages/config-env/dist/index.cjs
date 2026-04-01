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
let dotenv = require("dotenv");
dotenv = __toESM(dotenv);
let _json_express_core = require("@json-express/core");
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
			const fullPath = path.default.join(cwd, file);
			if (fs.default.existsSync(fullPath)) {
				const parsed = dotenv.default.parse(fs.default.readFileSync(fullPath, "utf8"));
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
		this.config = (0, _json_express_core.buildNestedConfigFromEnv)(mergedRawEnv, "jex");
	}
	get(key, defaultValue) {
		return (0, _json_express_core.getNestedValue)(this.config, key, defaultValue);
	}
	has(key) {
		return (0, _json_express_core.getNestedValue)(this.config, key, void 0) !== void 0;
	}
	/** Helper to allow deep merging if the advanced config plugin is also loaded */
	getRawConfig() {
		return this.config;
	}
};
//#endregion
exports.EnvConfigProvider = EnvConfigProvider;
