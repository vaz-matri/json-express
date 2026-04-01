//#region ../core/dist/index.d.mts
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
/**
 * 7. The Configuration Provider Contract
 * Supplies configuration values to all other plugins during the boot sequence.
 */
interface IConfigProvider {
  get<T>(key: string, defaultValue?: T): T;
  has(key: string): boolean;
} //#endregion
//#region src/kernel.d.ts
//#endregion
//#region src/index.d.ts
declare class RestApiGenerator implements IApiGenerator {
  private db;
  private config?;
  constructor({
    database,
    configProvider
  }: {
    database: IDatabaseAdapter;
    configProvider?: IConfigProvider;
  });
  generate(collections: string[]): RouteDefinition[];
}
//#endregion
export { RestApiGenerator };