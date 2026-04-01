import { ZodSchema } from "zod";

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
} //#endregion
//#region src/kernel.d.ts
//#endregion
//#region src/index.d.ts
interface ValidationRule {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | '*';
  path: string | RegExp;
  body?: ZodSchema<any>;
  query?: ZodSchema<any>;
}
declare class ValidationMiddleware implements IMiddleware {
  readonly name = "validation";
  private rules;
  constructor({
    configProvider
  }: {
    configProvider?: IConfigProvider;
  });
  private matchPath;
  private matchMethod;
  handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse>;
}
//#endregion
export { ValidationMiddleware, ValidationRule };