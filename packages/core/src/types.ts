import type { JsonExpressKernel } from './kernel';
import type { ModelSchema, HookContext } from './schema/model';

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
    traceId?: string;
    protocol?: string;    // 'http' | 'https'
    hostname?: string;    // e.g. 'localhost' or 'my-app.com'
    originalUrl?: string; // full URI including any prefix
}

export interface JsonResponse {
    statusCode?: number;
    body?: any;
    headers?: Record<string, string>;
    latency?: number;
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
    metadata?: Record<string, any>; // Arbitrary metadata attached to the route (e.g. schemas, auth rules)
}

/**
 * 3. The Database Adapter Contract
 * Any database plugin (Memory, Mongo, Postgres) MUST implement these methods.
 * @agent-instruction When writing an adapter, ensure writes are atomic. If a unique constraint is violated, you MUST throw a JsonExpressError with a 409 status code.
 */
export interface QueryOptions {
    expand?: string[];
    embed?: string[];
}

export interface IDatabaseAdapter {
    setSchemas?(schemas: ModelSchema[]): void;

    /**
     * Receive the runtime context that will be handed to model hooks
     * (`beforeCreate`, `afterCreate`). The kernel calls this once during boot,
     * after all plugins have registered, so the adapter can pass `db`, the
     * optional email provider, and a logger into hooks without touching the
     * IoC container itself.
     */
    setHookContext?(ctx: HookContext): void;

    getAll<T = any>(collection: string, options?: QueryOptions): Promise<T[]>;

    getById<T = any>(collection: string, id: string, options?: QueryOptions): Promise<T>;

    search<T = any>(collection: string, query: Record<string, any>, options?: QueryOptions): Promise<T[]>;

    create<T = any>(collection: string, data: any): Promise<T>;

    update<T = any>(collection: string, id: string, data: any): Promise<T>;

    delete<T = any>(collection: string, id: string): Promise<T>;

    isHealthy?(): Promise<boolean>;

    /**
     * Optional method for adapters that need explicit schema migration (e.g. SQL databases).
     */
    migrate?(): Promise<void>;
}

/**
 * 4. The Transport Server Contract
 * Any server plugin (Express, Fastify) MUST implement these methods.
 * @agent-instruction Do not implement business logic or routing internals here. Just translate the generic JsonRequest and JsonResponse to native framework objects.
 */
export interface ITransport {
    registerRoute(route: RouteDefinition): void;

    /**
     * Bind the underlying server to `port`.
     *
     * **Contract**: this Promise MUST reject if the server cannot bind (e.g. `EADDRINUSE`,
     * `EACCES`, port out of range). Never resolve and then crash asynchronously, and never
     * silently fall back to a different port — the deployment platform owns the port
     * contract, and a half-started server breaks load balancers, health checks, and
     * service-mesh routing.
     *
     * On failure, log a structured error (port + cause + remediation hint) before rejecting
     * so the operator has actionable output in the kernel's "Fatal Error booting" line.
     *
     * Conformance is exercised by `runTransportComplianceTests` in `@json-express/core`.
     */
    start(port: number): Promise<void>;

    stop(): Promise<void>;
}

/**
 * 5. The API Generator Contract
 * Transforms the Database operations into Route Definitions (REST or GraphQL).
 * @agent-instruction Do not bind to HTTP directly. Output pure RouteDefinition arrays for the transport to consume.
 */
export interface IApiGenerator {
    setSchemas?(schemas: ModelSchema[]): void;
    generate(collections: string[]): RouteDefinition[] | Promise<RouteDefinition[]>;
}

/**
 * 6. The Middleware Contract
 * Hooks into the request/response lifecycle for Auth, Rate-Limiting, Validation, etc.
 *
 * Middlewares MAY implement `setSchemas?` to receive the project's loaded model
 * schemas before any request is served. The runner calls this once during boot,
 * schemas before any request is served. Used by `middleware-validation` to build a
 * route → validators lookup from each model's `validation` block.
 * @agent-instruction When writing custom middleware, do not use `res.send`. You MUST return a Promise<JsonResponse> or call `next()`.
 */
export interface IMiddleware {
    name: string;
    setSchemas?(schemas: ModelSchema[]): void;
    handle(req: JsonRequest, next: () => Promise<JsonResponse>): Promise<JsonResponse>;
}

/**
 * 7. The Configuration Provider Contract
 * Supplies configuration values to all other plugins during the boot sequence.
 * @agent-instruction Only read from the configProvider, never process.env directly inside plugins.
 */
export interface IConfigProvider {
    get<T>(key: string, defaultValue?: T): T;

    has(key: string): boolean;

    /**
     * Mutates the active configuration dynamically at runtime.
     */
    set<T>(key: string, value: T): void;
}

/**
 * 8. The Seeder Contract
 * Generates initial data dynamically.
 *
 * Seeders MAY implement `setSchemas?` to receive the project's loaded model
 * schemas before `seed()` runs — this enables auto-deriving fake data shapes
 * and resolving foreign-key relations without requiring the user to spell out
 * a generator per collection. The kernel calls `setSchemas` once during boot,
 * after plugin-contributed schemas have been merged, so the seeder sees the
 * exact same schema set as the database adapter and API generator.
 * @agent-instruction Seeders should only insert data if the `isForce` flag is true or the database is entirely empty.
 */
export interface ISeeder {
    name: string;
    setSchemas?(schemas: ModelSchema[]): void;
    seed(database: IDatabaseAdapter, isForce: boolean): Promise<void>;
}

/**
 * 9. The Plugin Contract
 * Attaches generic behaviors to the kernel before boot
 * @agent-instruction Never use global singletons. Register any exported services or middleware directly into the kernel's IoC container via the configProvider.
 */
export interface IPlugin {
    name: string;
    /**
     * Optional: contribute additional schemas to the project before the
     * database/api generators receive them. Called by the CLI synchronously
     * after user-defined schemas are loaded; user-defined names win on
     * collision (the plugin's contribution is silently skipped with a warning).
     */
    provideSchemas?(): ModelSchema[];
    onRegister?(kernel: JsonExpressKernel, configProvider: IConfigProvider): Promise<void>;
    onBoot(kernel: JsonExpressKernel, configProvider: IConfigProvider): Promise<void>;
    onReady?(kernel: JsonExpressKernel, configProvider: IConfigProvider): Promise<void>;
    onShutdown?(kernel: JsonExpressKernel, configProvider: IConfigProvider): Promise<void>;
}
/**
 * 10. The Logger Contract
 * Provides a standardized way for all plugins to output logs.
 * @agent-instruction Never use `console.log` directly in plugins. Always use the injected `ILogger` instance.
 */
export interface ILogger {
    info(message: string, context?: any): void;
    warn(message: string, context?: any): void;
    error(message: string, context?: any): void;
    debug(message: string, context?: any): void;

    /**
     * Creates a child logger with additional context (standard in Pino/Winston).
     */
    child(context: any): ILogger;
}

/**
 * 11. The Documentation Provider Contract
 * Allows plugins to provide a "Home Page" or "Swagger UI" for the API.
 *
 * Doc providers MAY implement `setSchemas?` to receive the project's loaded
 * model schemas before any documentation request is served. The kernel calls
 * `setSchemas` once during boot, after plugin-contributed schemas have been
 * merged, so the doc provider sees the exact same schema set as the database
 * adapter and API generator. This is the source of truth for resource names,
 * field shapes, and access rules — doc providers should prefer it over
 * reverse-engineering the same information from `RouteDefinition[]` paths.
 * @agent-instruction Derive all OpenAPI/Swagger specs from the `setSchemas` payload, not the route definitions.
 */
export interface IDocProvider {
    setSchemas?(schemas: ModelSchema[]): void;
    renderTitle(): string;
    renderDocumentation(routes: RouteDefinition[], path: string, req: JsonRequest): string; // Returns HTML
    /**
     * Returns a professional boot-time log message with a clickable link.
     */
    getDocumentationMessage(port: number, path: string): string;
    getManifest(routes: RouteDefinition[], req: JsonRequest): any;            // Returns JSON
}

/**
 * 12. The ID Generator Contract
 * Provides unique identifiers for newly created records.
 */
export interface IIdGenerator {
    generate(): string | number;
}

/**
 * 13. The Email Provider Contract
 * Sends transactional email on behalf of plugins (e.g. verification + password reset).
 * The default implementation (`@json-express/email-console`) logs the message
 * instead of sending — keeping local dev free of SMTP credentials.
 * @agent-instruction Do not implement custom SMTP logic inside business hooks. Always use the injected `IEmailProvider`.
 */
export interface EmailMessage {
    to: string | string[];
    /** Falls back to the provider's configured default `from` if omitted. */
    from?: string;
    subject: string;
    /** At least one of `text` or `html` must be set. Providers should accept either. */
    text?: string;
    html?: string;
    replyTo?: string;
    headers?: Record<string, string>;
}

export interface IEmailProvider {
    send(message: EmailMessage): Promise<void>;
    /** Optional health check, mirrors `IDatabaseAdapter.isHealthy`. */
    isHealthy?(): Promise<boolean>;
}

/**
 * 14. The Key-Value Store Contract
 * High-performance ephemeral storage with TTL semantics. Used for short-lived
 * tokens (refresh / verification / password-reset), rate-limit counters, and
 * other transient state that should not pollute the relational database.
 * @agent-instruction Use this for ephemeral/temporary data only (like OTPs or rate limits). Never for persistent business data.
 */
export interface KvSetOptions {
    /** Time-To-Live in milliseconds */
    ttlMs?: number;
}

export interface IKvStore {
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, options?: KvSetOptions): Promise<void>;
    delete(key: string): Promise<void>;
    /** Optional health check */
    isHealthy?(): Promise<boolean>;
}

/**
 * 15. The Distributed Task Queue Contract
 * Moves long-running tasks (emails, data crunching, heavy webhooks) off the
 * main HTTP thread to dedicated background workers.
 * @agent-instruction Ensure all job payloads are fully JSON serializable. Do not pass classes or functions into `enqueue()`.
 */
export interface JobOptions {
    /** Run after X milliseconds */
    delay?: number;
    /** Distributed cron schedule */
    cron?: string;
}

export interface IQueueAdapter {
    /** Pushes a job onto the queue (Non-blocking) */
    enqueue(queueName: string, jobName: string, payload: any, options?: JobOptions): Promise<string>;

    /** Registers a worker to process jobs off the queue */
    registerWorker(queueName: string, handler: (job: { name: string, payload: any }) => Promise<void>): void;
}
