import express from "express";
//#region src/index.ts
var ExpressTransport = class {
	app;
	server = null;
	constructor() {
		this.app = express();
		this.app.use(express.json());
	}
	/**
	* Translates a generic RouteDefinition into an Express route
	*/
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
	/**
	* Starts the Express server
	*/
	start(port) {
		return new Promise((resolve) => {
			this.server = this.app.listen(port, () => {
				console.log(`🚀 [ExpressTransport] Server listening on http://localhost:${port}`);
				resolve();
			});
		});
	}
	/**
	* Stops the Express server safely
	*/
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
