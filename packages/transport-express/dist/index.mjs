import express from "express";
//#region src/index.ts
var ExpressTransport = class {
	app;
	server = null;
	config;
	constructor({ configProvider } = {}) {
		this.app = express();
		this.config = configProvider;
		this.app.use(express.json());
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
export { ExpressTransport };
