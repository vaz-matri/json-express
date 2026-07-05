import { createContainer, asValue, AwilixContainer } from 'awilix';
import type {
    IDatabaseAdapter,
    ITransport,
    IApiGenerator,
    RouteDefinition,
    IConfigProvider,
    IMiddleware,
    ISeeder,
    IPlugin,
    ILogger,
    IDocProvider,
    IIdGenerator,
    IEmailProvider,
    IKvStore,
    IQueueAdapter,
    CapabilityRequirement
} from './types';
import { randomUUID } from 'crypto';
import { composeMiddlewares } from './pipeline';
import { FatalBootError } from './errors';

class DefaultIdGenerator implements IIdGenerator {
    generate(): string {
        return randomUUID();
    }
}

export class JsonExpressKernel {
    public container: AwilixContainer;
    public context: Map<string, any> = new Map();
    public readonly routes: RouteDefinition[] = [];
    private middlewares: Map<string, IMiddleware> = new Map();
    private seeders: ISeeder[] = [];
    private plugins: IPlugin[] = [];

    constructor() {
        this.container = createContainer();
        this.container.register({
            idGenerator: asValue(new DefaultIdGenerator())
        });
    }

    public registerConfigProvider(provider: IConfigProvider) {
        this.container.register({ configProvider: asValue(provider) })
    }

    public registerIdGenerator(generator: IIdGenerator) {
        this.container.register({ idGenerator: asValue(generator) });
    }

    // --- REGISTRATION METHODS ---

    public registerDatabase(adapter: IDatabaseAdapter) {
        this.container.register({ database: asValue(adapter) });
    }

    public registerTransport(transport: ITransport) {
        this.container.register({ transport: asValue(transport) });
    }

    public registerApiGenerator(generator: IApiGenerator) {
        this.container.register({ apiGenerator: asValue(generator) });
    }

    public registerLogger(logger: ILogger) {
        this.container.register({ logger: asValue(logger) });
    }

    public registerMiddleware(middleware: IMiddleware) {
        this.middlewares.set(middleware.name, middleware);
        this.container.register({ [`middleware:${middleware.name}`]: asValue(middleware) });
    }

    public registerSeeder(seeder: ISeeder) {
        this.seeders.push(seeder);
        this.container.register({ [`seeder:${seeder.name}`]: asValue(seeder) });
    }

    public registerPlugin(plugin: IPlugin) {
        this.plugins.push(plugin);
        this.container.register({ [`plugin:${plugin.name}`]: asValue(plugin) });
    }

    public registerDocProvider(provider: IDocProvider) {
        this.container.register({ docProvider: asValue(provider) });
    }

    public registerEmailProvider(provider: IEmailProvider) {
        this.container.register({ emailProvider: asValue(provider) });
    }

    public registerKvStore(store: IKvStore) {
        this.container.register({ kvStore: asValue(store) });
    }

    public registerQueue(queue: IQueueAdapter) {
        this.container.register({ queue: asValue(queue) });
    }

    // --- ROUTE REGISTRATION ---

    public registerRoute(route: RouteDefinition) {
        // Global middlewares (e.g. rate limiting) run on EVERY route, ordered first so they
        // can't be bypassed by a route that doesn't name them. Merge them ahead of any
        // per-route middlewares, de-duplicated.
        const globalNames = [...this.middlewares.entries()]
            .filter(([, mw]) => mw.global)
            .map(([name]) => name);
        const effectiveNames = [...globalNames, ...(route.middlewares ?? [])]
            .filter((name, i, arr) => arr.indexOf(name) === i);

        if (effectiveNames.length > 0) {
            const assignedMiddlewares = effectiveNames.map(name => {
                const mw = this.middlewares.get(name);
                if (!mw) {
                    throw new Error(`❌ Middleware '${name}' is required by route ${route.path} but was not registered.`);
                }
                return mw;
            });
            route.handler = composeMiddlewares(route.handler, assignedMiddlewares);
            route.middlewares = effectiveNames;
        }

        this.routes.push(route);

        const transport = this.container.resolve<ITransport>('transport');
        transport.registerRoute(route);
    }

    // --- CAPABILITY VALIDATION ---

    /**
     * Match every declared `requires` against the union of all `provides` across
     * registered plugins and middlewares. A hard requirement with no provider aborts
     * boot via FatalBootError so a security-load-bearing dependency (e.g. identity →
     * rate limiting) can never be silently missing.
     */
    private validateCapabilities() {
        const declarers: Array<{ name: string; provides?: string[]; requires?: CapabilityRequirement[] }> = [
            ...this.plugins,
            ...this.middlewares.values(),
        ];

        const provided = new Set<string>();
        for (const d of declarers) {
            for (const cap of d.provides ?? []) provided.add(cap);
        }

        for (const d of declarers) {
            for (const req of d.requires ?? []) {
                if (!provided.has(req.capability)) {
                    throw new FatalBootError(
                        `'${d.name}' requires the '${req.capability}' capability, but no installed package provides it.`,
                        `${req.reason} Install a package that provides '${req.capability}' ` +
                        `(e.g. @json-express/middleware-${req.capability}).`
                    );
                }
            }
        }
    }

    // --- THE BOOT SEQUENCE ---

    public async boot(collections: Array<string>, port: number = 3000, seedOptions?: { enable?: boolean, force?: boolean }) {
        console.log('🚀 JSON Express Kernel initializing...');

        // 1. Establish Environment Context
        const env = process.env.NODE_ENV || 'development'
        this.container.register({ NODE_ENV: asValue(env) })

        if (!this.container.hasRegistration('logger')) {
            throw new Error("❌ No logger registered! Call kernel.registerLogger(...) before boot(), or install an @json-express/logger-* plugin.");
        }
        const logger = this.container.resolve<ILogger>('logger');

        // Resolve ConfigProvider or provide an empty fallback
        let configProvider: IConfigProvider
        try {
            configProvider = this.container.resolve<IConfigProvider>('configProvider')
        } catch (e) {
            configProvider = {
                get: (key, def) => def as any,
                has: () => false,
                set: () => {}
            }
            this.container.register({ configProvider: asValue(configProvider) })
        }

        // 1.5 Execute the onRegister (setup) phase for all plugins
        for (const plugin of this.plugins) {
            if (plugin.onRegister) {
                console.log(`🧩 Firing plugin register hook: ${plugin.name}`);
                await plugin.onRegister(this, configProvider);
            }
        }

        // 1.6 Validate declared capability requirements. Runs after ALL onRegister so
        // load order can't cause a false negative. Unmet hard requirements are a
        // FatalBootError (the runner formats + exits) — never a silent boot.
        this.validateCapabilities();

        // 2. Resolve the registered plugins from the container
        const db = this.container.resolve<IDatabaseAdapter>('database');
        const apiGenerator = this.container.resolve<IApiGenerator>('apiGenerator');
        const transport = this.container.resolve<ITransport>('transport');

        if (!db || !apiGenerator || !transport) {
            throw new Error("❌ Missing core plugins! Ensure Database, ApiGenerator, and Transport are registered.");
        }

        // 2.5 Compose the runtime context once; hand it to the database adapter
        // (model hooks) and the API generator (custom endpoint handlers) alike.
        const email = this.container.hasRegistration('emailProvider')
            ? this.container.resolve<IEmailProvider>('emailProvider')
            : undefined;
        const kvStore = this.container.hasRegistration('kvStore')
            ? this.container.resolve<IKvStore>('kvStore')
            : undefined;
        const queue = this.container.hasRegistration('queue')
            ? this.container.resolve<IQueueAdapter>('queue')
            : undefined;
        const hookContext = { db, email, kvStore, queue, logger };
        if (typeof db.setHookContext === 'function') {
            db.setHookContext(hookContext);
        }
        if (typeof apiGenerator.setHookContext === 'function') {
            apiGenerator.setHookContext(hookContext);
        }
        // Hand the same context to any middleware that opts in — lets a middleware pick up
        // shared providers (e.g. rate limiting reaching for kvStore) before routes compose.
        for (const mw of this.middlewares.values()) {
            if (typeof mw.setHookContext === 'function') {
                mw.setHookContext(hookContext);
            }
        }

        // 3. Ask the API Generator to create abstract route definitions
        const generatedRoutes = await apiGenerator.generate(collections);

        // 4. Pass those generated routes through the kernel's central registry
        for (const route of generatedRoutes) {
            this.registerRoute(route);
        }

        // 4.5 Execute Seeders if explicitly enabled by CLI or configuration
        if (seedOptions?.enable && this.seeders.length > 0) {
            console.log(`🌱 Executing ${this.seeders.length} seeders...`);
            for (const seeder of this.seeders) {
                await seeder.seed(db, seedOptions.force || false);
            }
        }

        // 4.9 Execute Lifecycle Plugins (e.g., HTTPS Devcert, Loggers) before booting the server
        for (const plugin of this.plugins) {
            console.log(`🧩 Firing plugin boot hook: ${plugin.name}`);
            await plugin.onBoot(this, configProvider);
        }

        // 5. Start the server!
        // 5.1 If a DocProvider is present, register the "Self-Documenting" routes
        try {
            const docProvider = this.container.resolve<IDocProvider>('docProvider');
            // Docs mount by default when a provider is installed, but can be turned off with
            // jex.docs.enabled=false — so a production deploy can hide its API schema without
            // uninstalling the docs package.
            const docsEnabled = configProvider.get<unknown>('docs.enabled', true);
            const docsOff = docsEnabled === false || docsEnabled === 'false';
            if (docProvider && !docsOff) {
                // Read the path from config (defaulting to /docs)
                const rawDocsPath = configProvider.get<string>('docs.path', '/docs');
                // Ensure no trailing slash
                const docsPath = rawDocsPath.endsWith('/') ? rawDocsPath.slice(0, -1) : rawDocsPath;

                // HTML Home Page
                this.registerRoute({
                    method: 'GET',
                    path: docsPath,
                    handler: async (req) => ({
                        statusCode: 200,
                        headers: { 'Content-Type': 'text/html' },
                        body: docProvider.renderDocumentation(this.routes, docsPath, req)
                    })
                });

                // JSON Manifest
                this.registerRoute({
                    method: 'GET',
                    path: `${docsPath}/json`,
                    handler: async (req) => ({
                        statusCode: 200,
                        body: docProvider.getManifest(this.routes, req)
                    })
                });

                console.log(docProvider.getDocumentationMessage(port, docsPath));
            }
        } catch (e) {
            // Silently skip if no docProvider is registered
        }

        // 5.2 Welcome route — only when nothing else claims GET / (user routes win).
        // Gives the server a self-describing index and a 2xx root for health probes
        // and tooling that polls the base URL for readiness.
        if (!this.routes.some(r => r.method.toUpperCase() === 'GET' && r.path === '/')) {
            const docsMounted = this.container.hasRegistration('docProvider');
            this.registerRoute({
                method: 'GET',
                path: '/',
                handler: async () => ({
                    statusCode: 200,
                    body: {
                        framework: 'json-express',
                        collections,
                        ...(docsMounted ? { docs: configProvider.get<string>('docs.path', '/docs') } : {})
                    }
                })
            });
        }

        console.log(`🟢 Starting server on port ${port}...`);
        await transport.start(port);

        // 6. Execute the onReady phase for all plugins
        for (const plugin of this.plugins) {
            if (plugin.onReady) {
                console.log(`🧩 Firing plugin ready hook: ${plugin.name}`);
                await plugin.onReady(this, configProvider);
            }
        }
    }

    // --- GRACEFUL TEARDOWN ---

    public async shutdown() {
        console.log('🛑 Initiating JSON Express Kernel shutdown sequence...');

        let configProvider: IConfigProvider;
        try {
            configProvider = this.container.resolve<IConfigProvider>('configProvider');
        } catch (e) {
            configProvider = { get: (key, def) => def as any, has: () => false, set: () => {} };
        }

        for (const plugin of this.plugins) {
            if (plugin.onShutdown) {
                console.log(`🧩 Firing plugin shutdown hook: ${plugin.name}`);
                await plugin.onShutdown(this, configProvider);
            }
        }

        try {
            const transport = this.container.resolve<ITransport>('transport');
            console.log('🔌 Stopping Transport Layer...');
            await transport.stop();
        } catch (e) {
            // Silently ignore if transport isn't resolved
        }

        // Tear down provider connections AFTER the transport stops, so in-flight
        // requests never observe half-closed backends. Duck-typed: only providers
        // exposing shutdown(). Failures are logged, never abort the teardown.
        for (const key of ['queue', 'kvStore', 'emailProvider', 'database'] as const) {
            if (!this.container.hasRegistration(key)) continue;
            const provider = this.container.resolve<any>(key);
            if (typeof provider?.shutdown !== 'function') continue;
            try {
                console.log(`🔌 Shutting down provider: ${key}...`);
                await provider.shutdown();
            } catch (e: any) {
                console.error(`⚠️  Provider '${key}' failed to shut down cleanly:`, e?.message ?? e);
            }
        }

        console.log('🛑 Kernel shutdown complete.');
    }
}
