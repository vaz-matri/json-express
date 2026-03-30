Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/index.ts
var RestApiGenerator = class {
	db;
	config;
	constructor({ database, configProvider }) {
		this.db = database;
		this.config = configProvider;
	}
	generate(collections) {
		const routes = [];
		const rawPrefix = this.config?.get("api.rest.prefix", "") ?? "";
		const prefix = rawPrefix.endsWith("/") ? rawPrefix.slice(0, -1) : rawPrefix;
		for (const collection of collections) {
			const basePath = `${prefix}/${collection}`;
			const itemPath = `${prefix}/${collection}/:id`;
			routes.push({
				method: "GET",
				path: basePath,
				handler: async (req) => {
					return {
						statusCode: 200,
						body: Object.keys(req.query).length > 0 ? await this.db.search(collection, req.query) : await this.db.getAll(collection)
					};
				}
			});
			routes.push({
				method: "GET",
				path: itemPath,
				handler: async (req) => {
					const id = req.params["id"];
					if (!id) return {
						statusCode: 400,
						body: { error: "Missing resource ID." }
					};
					const record = await this.db.getById(collection, id);
					if (!record) return {
						statusCode: 404,
						body: { error: `Resource '${id}' not found in '${collection}'.` }
					};
					return {
						statusCode: 200,
						body: record
					};
				}
			});
			routes.push({
				method: "POST",
				path: basePath,
				handler: async (req) => {
					if (!req.body || typeof req.body !== "object") return {
						statusCode: 400,
						body: { error: "Request body must be a JSON object." }
					};
					return {
						statusCode: 201,
						body: await this.db.create(collection, req.body)
					};
				}
			});
			routes.push({
				method: "PATCH",
				path: itemPath,
				handler: async (req) => {
					const id = req.params["id"];
					if (!id) return {
						statusCode: 400,
						body: { error: "Missing resource ID." }
					};
					if (!req.body || typeof req.body !== "object") return {
						statusCode: 400,
						body: { error: "Request body must be a JSON object." }
					};
					const updated = await this.db.update(collection, id, req.body);
					if (!updated) return {
						statusCode: 404,
						body: { error: `Resource '${id}' not found in '${collection}'.` }
					};
					return {
						statusCode: 200,
						body: updated
					};
				}
			});
			routes.push({
				method: "DELETE",
				path: itemPath,
				handler: async (req) => {
					const id = req.params["id"];
					if (!id) return {
						statusCode: 400,
						body: { error: "Missing resource ID." }
					};
					if (!await this.db.delete(collection, id)) return {
						statusCode: 404,
						body: { error: `Resource '${id}' not found in '${collection}'.` }
					};
					return {
						statusCode: 200,
						body: { message: `Resource '${id}' deleted from '${collection}'.` }
					};
				}
			});
		}
		return routes;
	}
};
//#endregion
exports.RestApiGenerator = RestApiGenerator;
