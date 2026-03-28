// packages/api-rest/src/index.ts
import type {
    IApiGenerator,
    IDatabaseAdapter,
    RouteDefinition,
    JsonRequest,
    JsonResponse
} from '@json-express/core';

export class RestApiGenerator implements IApiGenerator {
    private db: IDatabaseAdapter;

    /**
     * Awilix will automatically inject the active database adapter here.
     * It could be Mongo, Postgres, or the local Memory adapter — this class
     * doesn't need to know, as long as IDatabaseAdapter is fulfilled.
     */
    constructor({ database }: { database: IDatabaseAdapter }) {
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
    public generate(collections: string[]): RouteDefinition[] {
        const routes: RouteDefinition[] = [];

        for (const collection of collections) {
            const basePath = `/${collection}`;
            const itemPath = `/${collection}/:id`;

            // --- GET /collection ---
            // If query parameters are present, performs a filtered search.
            // Otherwise, returns all records.
            routes.push({
                method: 'GET',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const hasQuery = Object.keys(req.query).length > 0;

                    const data = hasQuery
                        ? await this.db.search(collection, req.query as Record<string, any>)
                        : await this.db.getAll(collection);

                    return { statusCode: 200, body: data };
                }
            });

            // --- GET /collection/:id ---
            routes.push({
                method: 'GET',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    if (!id) {
                        return { statusCode: 400, body: { error: 'Missing resource ID.' } };
                    }

                    const record = await this.db.getById(collection, id);
                    if (!record) {
                        return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                    }

                    return { statusCode: 200, body: record };
                }
            });

            // --- POST /collection ---
            routes.push({
                method: 'POST',
                path: basePath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    if (!req.body || typeof req.body !== 'object') {
                        return { statusCode: 400, body: { error: 'Request body must be a JSON object.' } };
                    }

                    const created = await this.db.create(collection, req.body);
                    return { statusCode: 201, body: created };
                }
            });

            // --- PATCH /collection/:id ---
            routes.push({
                method: 'PATCH',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    if (!id) {
                        return { statusCode: 400, body: { error: 'Missing resource ID.' } };
                    }
                    if (!req.body || typeof req.body !== 'object') {
                        return { statusCode: 400, body: { error: 'Request body must be a JSON object.' } };
                    }

                    const updated = await this.db.update(collection, id, req.body);
                    if (!updated) {
                        return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                    }

                    return { statusCode: 200, body: updated };
                }
            });

            // --- DELETE /collection/:id ---
            routes.push({
                method: 'DELETE',
                path: itemPath,
                handler: async (req: JsonRequest): Promise<JsonResponse> => {
                    const id = req.params['id'];
                    if (!id) {
                        return { statusCode: 400, body: { error: 'Missing resource ID.' } };
                    }

                    const deleted = await this.db.delete(collection, id);
                    if (!deleted) {
                        return { statusCode: 404, body: { error: `Resource '${id}' not found in '${collection}'.` } };
                    }

                    return { statusCode: 200, body: { message: `Resource '${id}' deleted from '${collection}'.` } };
                }
            });
        }

        return routes;
    }
}
