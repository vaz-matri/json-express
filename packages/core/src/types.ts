/**
 * 1. The Generic Request & Response
 * We abstract this so our core doesn't care if it's Express, Fastify, or h3.
 */
export interface JsonRequest {
    method: string;
    path: string;
    body: any;
    query: Record<string, string | undefined>;
    params: Record<string, string | undefined>;
    headers: Record<string, string | string[] | undefined>;
}

export interface JsonResponse {
    statusCode?: number;
    body?: any;
    headers?: Record<string, string>;
}

/**
 * 2. Route Definition
 * The API Generator plugins will output an array of these,
 * and the Transport plugins will consume them to create actual server routes.
 */
export interface RouteDefinition {
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    handler: (req: JsonRequest) => Promise<JsonResponse>;
    middlewares?: string[]; // Array of middleware names to apply (e.g., ['auth', 'rate-limit'])
}

/**
 * 3. The Database Adapter Contract
 * Any database plugin (Memory, Mongo, Postgres) MUST implement these methods.
 */
export interface IDatabaseAdapter {
    getAll(collection: string): Promise<any[]>;

    getById(collection: string, id: string): Promise<any>;

    search(collection: string, query: Record<string, any>): Promise<any[]>;

    create(collection: string, data: any): Promise<any>;

    update(collection: string, id: string, data: any): Promise<any>;

    delete(collection: string, id: string): Promise<any>;
}

/**
 * 4. The Transport Server Contract
 * Any server plugin (Express, Fastify) MUST implement these methods.
 */
export interface ITransport {
    registerRoute(route: RouteDefinition): void;

    start(port: number): Promise<void>;

    stop(): Promise<void>;
}

/**
 * 5. The API Generator Contract
 * Transforms the Database operations into Route Definitions (REST or GraphQL).
 */
export interface IApiGenerator {
    generate(collections: string[]): RouteDefinition[];
}

/**
 * 6. The Middleware Contract
 * Hooks into the request/response lifecycle for Auth, Rate-Limiting, Validation, etc.
 */
export interface IMiddleware {
    name: string;

    handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse>;
}

/**
 * 7. The Configuration Provider Contract
 * Supplies configuration values to all other plugins during the boot sequence.
 */
export interface IConfigProvider {
    get<T>(key: string, defaultValue?: T): T;

    has(key: string): boolean;
}
