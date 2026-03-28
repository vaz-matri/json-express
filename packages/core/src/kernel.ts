import { createContainer, asValue, AwilixContainer } from 'awilix';
import type {
    IDatabaseAdapter,
    ITransport,
    IApiGenerator,
    RouteDefinition
} from './types';

export class JsonExpressKernel {
    private container: AwilixContainer;

    constructor() {
        // 1. Initialize the Dependency Injection Container
        this.container = createContainer();
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

    // --- THE BOOT SEQUENCE ---

    public async boot(collections: Array<string>, port: number = 3000) {
        console.log('🚀 JSON Express Kernel initializing...');

        // 2. Resolve the registered plugins from the container
        const db = this.container.resolve<IDatabaseAdapter>('database');
        const apiGenerator = this.container.resolve<IApiGenerator>('apiGenerator');
        const transport = this.container.resolve<ITransport>('transport');

        if (!db || !apiGenerator || !transport) {
            throw new Error("❌ Missing core plugins! Ensure Database, ApiGenerator, and Transport are registered.");
        }

        // 3. Ask the API Generator to create abstract route definitions
        console.log(`⚙️  Generating API definitions for: ${collections.join(', ')}`);
        const routes = apiGenerator.generate(collections);

        // 4. Pass those generated routes to the Transport Server
        console.log(`🔗 Registering ${routes.length} routes with the transport layer...`);
        for (const route of routes) {
            transport.registerRoute(route);
        }

        // 5. Start the server!
        console.log(`🟢 Starting server on port ${port}...`);
        await transport.start(port);
    }
}
