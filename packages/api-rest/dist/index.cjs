Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region src/index.ts
var RestApiGenerator = class {
	db;
	/**
	* Awilix will automatically inject the active database adapter here.
	* It could be Mongo, Postgres, or the local Memory adapter — this class
	* doesn't need to know, as long as IDatabaseAdapter is fulfilled.
	*/
	constructor({ database }) {
		this.db = database;
	}
	/**
	* Iterates over all discovered collections and generates standard
	* RESTful RouteDefinitions (GET, POST, PATCH, DELETE) for each.
	*
	* For a collection named "albums", this produces:
	*   GET    /albums          → db.getAll / db.search (if query params present)
	*   GET    /albums/:id      → db.getById
	*   POST   /albums          → db.create
	*   PATCH  /albums/:id      → db.update
	*   DELETE /albums/:id      → db.delete
	*/
	generate(collections) {
		const routes = [];
		for (const collection of collections) {
			const basePath = `/${collection}`;
			const itemPath = `/${collection}/:id`;
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
