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
let express = require("express");
express = __toESM(express);
//#region src/index.ts
var ExpressTransport = class {
	app;
	server = null;
	config;
	constructor({ configProvider } = {}) {
		this.app = (0, express.default)();
		this.config = configProvider;
		this.app.use(express.default.json());
		if (this.config?.get("transport.express.logger", false)) this.app.use((req, res, next) => {
			console.log(`[Express] ${req.method} ${req.originalUrl}`);
			next();
		});
	}
	registerRoute(route) {
		const method = route.method.toLowerCase();
		this.app[method](route.path, async (req, res) => {
			try {
				const jsonRequest = {
					method: req.method,
					path: req.originalUrl || req.path,
					body: req.body,
					query: req.query,
					params: req.params,
					headers: req.headers
				};
				const jsonResponse = await route.handler(jsonRequest);
				if (jsonResponse.headers) Object.entries(jsonResponse.headers).forEach(([key, value]) => {
					res.setHeader(key, value);
				});
				res.status(jsonResponse.statusCode || 200).json(jsonResponse.body);
			} catch (error) {
				console.error(`❌ [ExpressTransport] Error on ${route.method} ${route.path}:`, error);
				res.status(500).json({ error: error.message || "Internal Server Error" });
			}
		});
	}
	start(port) {
		return new Promise((resolve) => {
			this.server = this.app.listen(port, () => {
				console.log(`🚀 [ExpressTransport] Server listening on http://localhost:${port}`);
				resolve();
			});
		});
	}
	stop() {
		return new Promise((resolve, reject) => {
			if (this.server) this.server.close((err) => {
				if (err) return reject(err);
				this.server = null;
				resolve();
			});
			else resolve();
		});
	}
};
//#endregion
exports.ExpressTransport = ExpressTransport;
