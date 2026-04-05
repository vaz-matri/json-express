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
    IDocProvider
} from './types';
import { ConsoleLogger } from './logger';
import { composeMiddlewares } from './pipeline';

export class JsonExpressKernel {
    private container: AwilixContainer;
    private middlewares: Map<string, IMiddleware> = new Map();
    private seeders: ISeeder[] = [];
    private plugins: IPlugin[] = [];
    private logger: ILogger;

    constructor() {
        // 1. Initialize Default Logger
        this.logger = new ConsoleLogger();

        // 2. Initialize the Dependency Injection Container
        this.container = createContainer();
    }

    public registerConfigProvider(provider: IConfigProvider) {
        this.container.register({ configProvider: asValue(provider) })
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

        // 2. Resolve the registered plugins from the container
        const db = this.container.resolve<IDatabaseAdapter>('database');
        const apiGenerator = this.container.resolve<IApiGenerator>('apiGenerator');
        const transport = this.container.resolve<ITransport>('transport');

        if (!db || !apiGenerator || !transport) {
            throw new Error("❌ Missing core plugins! Ensure Database, ApiGenerator, and Transport are registered.");
        }

        // 3. Ask the API Generator to create abstract route definitions
        const routes = apiGenerator.generate(collections);

        // 4. Pass those generated routes to the Transport Server
        for (const route of routes) {
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
            transport.registerRoute(route);
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
                transport.registerRoute({
                    method: 'GET',
                    path: docsPath,
                    handler: async () => ({
                        statusCode: 200,
                        headers: { 'Content-Type': 'text/html' },
                        body: docProvider.renderDocumentation(routes)
                    })
                });

                // JSON Manifest
                transport.registerRoute({
                    method: 'GET',
                    path: `${docsPath}/json`,
                    handler: async () => ({
                        statusCode: 200,
                        body: docProvider.getManifest(routes)
                    })
                });

                console.log(docProvider.getDocumentationMessage(port, docsPath));
            }
        } catch (e) {
            // Silently skip if no docProvider is registered
        }

        console.log(`🟢 Starting server on port ${port}...`);
        await transport.start(port);
    }
}
