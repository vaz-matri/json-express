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
let jsonwebtoken = require("jsonwebtoken");
jsonwebtoken = __toESM(jsonwebtoken);
//#region src/index.ts
var AuthMiddleware = class {
	name = "auth";
	secret = null;
	excludePaths = [];
	constructor({ configProvider }) {
		if (!configProvider) return;
		this.secret = configProvider.get("auth.secret", null);
		const rawExclude = configProvider.get("auth.exclude", []);
		if (Array.isArray(rawExclude)) this.excludePaths = rawExclude;
		else if (typeof rawExclude === "string") this.excludePaths = rawExclude.split(",").map((s) => s.trim()).filter(Boolean);
	}
	async handle(req, next) {
		if (!this.secret) {
			console.warn("⚠️ [AuthMiddleware] JEX__AUTH__SECRET is missing. Authentication bypassed completely.");
			return next();
		}
		if (this.excludePaths.some((path) => req.path.startsWith(path))) return next();
		const authHeader = req.headers["authorization"];
		if (!authHeader || Array.isArray(authHeader) || !authHeader.startsWith("Bearer ")) return {
			statusCode: 401,
			body: { error: "Unauthorized: Missing or invalid Bearer token." }
		};
		const token = authHeader.split(" ")[1];
		try {
			const decoded = jsonwebtoken.default.verify(token, this.secret);
			req.headers["x-user-payload"] = JSON.stringify(decoded);
			return next();
		} catch (error) {
			return {
				statusCode: 403,
				body: { error: "Forbidden: Invalid or expired token." }
			};
		}
	}
};
//#endregion
exports.AuthMiddleware = AuthMiddleware;
