//#region src/types.d.ts
/**
 * 1. The Generic Request & Response
 * We abstract this so our core doesn't care if it's Express, Fastify, or h3.
 */
interface JsonRequest {
  method: string;
  path: string;
  body: any;
  query: Record<string, string | undefined>;
  params: Record<string, string | undefined>;
  headers: Record<string, string | string[] | undefined>;
}
interface JsonResponse {
  statusCode?: number;
  body?: any;
  headers?: Record<string, string>;
}
/**
 * 2. Route Definition
 * The API Generator plugins will output an array of these,
 * and the Transport plugins will consume them to create actual server routes.
 */
interface RouteDefinition {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  handler: (req: JsonRequest) => Promise<JsonResponse>;
  middlewares?: string[];
}
/**
 * 3. The Database Adapter Contract
 * Any database plugin (Memory, Mongo, Postgres) MUST implement these methods.
 */
interface IDatabaseAdapter {
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
interface ITransport {
  registerRoute(route: RouteDefinition): void;
  start(port: number): Promise<void>;
  stop(): Promise<void>;
}
/**
 * 5. The API Generator Contract
 * Transforms the Database operations into Route Definitions (REST or GraphQL).
 */
interface IApiGenerator {
  generate(collections: string[]): RouteDefinition[];
}
/**
 * 6. The Middleware Contract
 * Hooks into the request/response lifecycle for Auth, Rate-Limiting, Validation, etc.
 */
interface IMiddleware {
  name: string;
  handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse>;
}
/**
 * 7. The Configuration Provider Contract
 * Supplies configuration values to all other plugins during the boot sequence.
 */
interface IConfigProvider {
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
}
/**
 * 8. The Seeder Contract
 * Generates initial data dynamically
 */
interface ISeeder {
  name: string;
  seed(database: IDatabaseAdapter, isForce: boolean): Promise<void>;
}
//#endregion
//#region src/kernel.d.ts
declare class JsonExpressKernel {
  private container;
  private middlewares;
  private seeders;
  constructor();
  registerConfigProvider(provider: IConfigProvider): void;
  registerDatabase(adapter: IDatabaseAdapter): void;
  registerTransport(transport: ITransport): void;
  registerApiGenerator(generator: IApiGenerator): void;
  registerMiddleware(middleware: IMiddleware): void;
  registerSeeder(seeder: ISeeder): void;
  boot(collections: Array<string>, port?: number, seedOptions?: {
    enable?: boolean;
    force?: boolean;
  }): Promise<void>;
}
//#endregion
//#region src/config.d.ts
/**
 * Deeply merges multiple objects.
 * Arrays and primitives are overwritten. Objects are merged recursively.
 * Precedence goes from left to right (last object wins).
 */
declare function deepMerge(...objects: any[]): any;
/**
 * Retrieves a nested value from an object using dot notation.
 */
declare function getNestedValue(obj: any, path: string, defaultValue?: any): any;
/**
 * Converts a flat Record (e.g. process.env) with JEX_ prefixes and dot notation into a nested object.
 * Example: { "JEX_DATABASE.MAX_CONNECTIONS": "100" } => { database: { max_connections: 100 } }
 */
declare function buildNestedConfigFromEnv(envVars: Record<string, string | undefined>, namespace?: string): Record<string, any>;
//#endregion
//#region src/pipeline.d.ts
/**
 * Composes an array of IMiddleware instances into a single execution chain
 * wrapping the final route handler.
 *
 * @param handler The original core route handler from the API Generator.
 * @param middlewares An array of ordered middleware instances to execute.
 * @returns A wrapped handler with the exact same signature.
 */
declare function composeMiddlewares(handler: (req: JsonRequest) => Promise<JsonResponse>, middlewares: IMiddleware[]): (req: JsonRequest) => Promise<JsonResponse>;
//#endregion
export { IApiGenerator, IConfigProvider, IDatabaseAdapter, IMiddleware, ISeeder, ITransport, JsonExpressKernel, JsonRequest, JsonResponse, RouteDefinition, buildNestedConfigFromEnv, composeMiddlewares, deepMerge, getNestedValue };