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
declare class ExpressTransport implements ITransport {
  private app;
  private server;
  private config?;
  constructor({
    configProvider
  }?: {
    configProvider?: IConfigProvider;
  });
  registerRoute(route: RouteDefinition): void;
  start(port: number): Promise<void>;
  stop(): Promise<void>;
}
//#endregion
export { ExpressTransport };