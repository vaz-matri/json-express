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
    IEmailProvider
} from './types';
import { ConsoleLogger } from './logger';
import { randomUUID } from 'crypto';
import { composeMiddlewares } from './pipeline';

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
    private logger: ILogger;

    constructor() {
        // 1. Initialize Default Logger
        this.logger = new ConsoleLogger();

        // 2. Initialize the Dependency Injection Container
        this.container = createContainer();

        // 3. Register the default ID Generator immediately
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
        this.logger = logger;
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

    // --- ROUTE REGISTRATION ---

    public registerRoute(route: RouteDefinition) {
        if (route.middlewares && route.middlewares.length > 0) {
            const assignedMiddlewares = route.middlewares.map(name => {
                const mw = this.middlewares.get(name);
                if (!mw) {
                    throw new Error(`❌ Middleware '${name}' is required by route ${route.path} but was not registered.`);
                }
                return mw;
            });
            route.handler = composeMiddlewares(route.handler, assignedMiddlewares);
        }

        this.routes.push(route);

        const transport = this.container.resolve<ITransport>('transport');
        transport.registerRoute(route);
    }

    // --- THE BOOT SEQUENCE ---

    public async boot(collections: Array<string>, port: number = 3000, seedOptions?: { enable?: boolean, force?: boolean }) {
        console.log('🚀 JSON Express Kernel initializing...');

        // 1. Establish Environment Context
        const env = process.env.NODE_ENV || 'development'
        this.container.register({ NODE_ENV: asValue(env) })

        // Ensure logger is registered in the container as 'logger' for other plugins to resolve
        if (!this.container.hasRegistration('logger')) {
            this.container.register({ logger: asValue(this.logger) });
        }

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

        // 2. Resolve the registered plugins from the container
        const db = this.container.resolve<IDatabaseAdapter>('database');
        const apiGenerator = this.container.resolve<IApiGenerator>('apiGenerator');
        const transport = this.container.resolve<ITransport>('transport');

        if (!db || !apiGenerator || !transport) {
            throw new Error("❌ Missing core plugins! Ensure Database, ApiGenerator, and Transport are registered.");
        }

        // 2.5 Hand the database adapter the runtime context for model hooks
        if (typeof db.setHookContext === 'function') {
            const email = this.container.hasRegistration('emailProvider')
                ? this.container.resolve<IEmailProvider>('emailProvider')
                : undefined;
            db.setHookContext({ db, email, logger: this.logger });
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
            if (docProvider) {
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

        console.log('🛑 Kernel shutdown complete.');
    }
}
