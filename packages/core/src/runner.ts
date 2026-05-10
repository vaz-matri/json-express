import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import { JsonExpressKernel } from './kernel';
import { loadSchemasAndData } from './schema-loader';
import type { IConfigProvider } from './types';

const fatal = (lines: string[]): never => {
    for (const l of lines) console.error(l);
    process.exit(1);
};

const loadPluginInstance = async (cwd: string, pluginName: string, constructorArgs: any[] = []) => {
    let mod: any;
    try {
        const localRequire = createRequire(join(cwd, 'package.json'));
        const resolvedPath = localRequire.resolve(pluginName);
        mod = await import(pathToFileURL(resolvedPath).href);
    } catch (e) {
        mod = await import(pluginName);
    }

    const exports = Object.values(mod);
    const PluginClass = exports.find(v => typeof v === 'function') as any;

    if (!PluginClass) {
        throw new Error(`No constructable export found in plugin ${pluginName}`);
    }

    return new PluginClass(...constructorArgs);
};

const resolveActive = (
    category: string,
    available: string[],
    configProvider: IConfigProvider | null,
    options: { required?: boolean } = {}
): string | null => {
    const userPreference = configProvider?.get<string>(category);
    if (userPreference && available.includes(userPreference)) {
        return userPreference;
    }

    if (available.length === 1) return available[0];

    if (available.length === 0) {
        if (options.required) {
            fatal([
                `❌ No '@json-express/${category}-*' plugin installed.`,
                `   Install one (e.g. '@json-express/${category}-...') or run 'npm install @json-express/boot' for the default stack.`
            ]);
        }
        return null;
    }

    fatal([
        `❌ Multiple '@json-express/${category}-*' plugins installed: ${available.join(', ')}.`,
        `   Set jex.${category}=<package-name> in .env to choose one.`
    ]);
    return null;
};

const discoverPluginsRecursively = (cwd: string): string[] => {
    const visited = new Set<string>();
    const allDiscovered = new Set<string>();

    const crawl = (pkgDir: string) => {
        const pkgPath = join(pkgDir, 'package.json');
        if (!existsSync(pkgPath)) return;

        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
            .filter(dep => dep.startsWith('@json-express/') || dep.includes('json-express-'));

        for (const dep of deps) {
            if (visited.has(dep)) continue;
            visited.add(dep);
            allDiscovered.add(dep);

            try {
                // Resolve where this plugin actually lives in node_modules
                const req = createRequire(join(pkgDir, 'package.json'));
                const resolvedEntry = req.resolve(dep);

                // Walk up the tree to find this plugin's package.json directory
                let currentDir = dirname(resolvedEntry);
                while (currentDir !== '/' && !existsSync(join(currentDir, 'package.json'))) {
                    currentDir = dirname(currentDir);
                }

                // Recursively crawl its dependencies
                crawl(currentDir);
            } catch (e) {
                // Silently ignore if a package fails to resolve
            }
        }
    };

    crawl(cwd);
    return Array.from(allDiscovered);
};

export const startServer = async () => {
    const cwd = process.cwd();

    // 1. Auto-Discovery: Dynamically crawl local and transitive json-express plugins
    const installedDeps = discoverPluginsRecursively(cwd);

    // 2. Discover and instantiate the Config Provider FIRST so jex.* values
    //    can drive plugin selection in subsequent steps.
    const availableConfigs = installedDeps.filter(d => d.includes('config-'));
    if (availableConfigs.length === 0) {
        fatal([
            `❌ No '@json-express/config-*' plugin installed.`,
            `   Install '@json-express/config-env' or run 'npm install @json-express/boot' for the default stack.`
        ]);
    }

    let configPluginName: string;
    if (availableConfigs.length === 1) {
        configPluginName = availableConfigs[0];
    } else {
        const envPick = process.env['jex.config'] || process.env['jex_config'] || process.env['jex__config'];
        if (envPick && availableConfigs.includes(envPick)) {
            configPluginName = envPick;
        } else {
            fatal([
                `❌ Multiple '@json-express/config-*' plugins installed: ${availableConfigs.join(', ')}.`,
                `   Set jex.config=<package-name> in the environment to choose one.`
            ]);
            return;
        }
    }
    const configProvider = await loadPluginInstance(cwd, configPluginName, [cwd]) as IConfigProvider;

    // 3. Bucket the rest of the discovered plugins by category prefix
    const availableTransports = installedDeps.filter(d => d.includes('transport-'));
    const availableAdapters = installedDeps.filter(d => d.includes('adapter-'));
    const availableApis = installedDeps.filter(d => d.includes('api-'));
    const availableMiddlewares = installedDeps.filter(d => d.includes('middleware-'));
    const availableSeeders = installedDeps.filter(d => d.includes('seeder-'));
    const availableLoggers = installedDeps.filter(d => d.includes('logger-'));
    const availableDocs = installedDeps.filter(d => d.includes('docs-'));
    const availableIds = installedDeps.filter(d => d.includes('id-'));
    const availableEmails = installedDeps.filter(d => d.includes('email-'));
    const availableKvStores = installedDeps.filter(d => d.includes('kv-'));
    const availableQueues = installedDeps.filter(d => d.includes('queue-'));
    const availablePlugins = installedDeps.filter(d => d.includes('plugin-'));

    const isAppendSeed = process.argv.includes('--seed-append');
    const isSmartSeed = process.argv.includes('--seed');

    // 4. Resolve the active plugin per category (non-interactive)
    const activeAdapter = resolveActive('adapter', availableAdapters, configProvider, { required: true })!;
    const activeApi = resolveActive('api', availableApis, configProvider, { required: true })!;
    const activeTransport = resolveActive('transport', availableTransports, configProvider, { required: true })!;
    const activeLogger = resolveActive('logger', availableLoggers, configProvider, { required: true })!;
    const activeDocs = resolveActive('docs', availableDocs, configProvider, { required: false });

    // 5. Centralized Schema Loader (Scans /models and /data)
    const { schemas, initialData } = await loadSchemasAndData(cwd);
    const collections = schemas.map(s => s.name);

    const fakerConfig = configProvider.get<any>('faker.collections', {});
    for (const key of Object.keys(fakerConfig)) {
        if (!collections.includes(key)) {
            collections.push(key);
        }
    }

    if (collections.length === 0) {
        console.warn('⚠️  No valid Model Schemas or JSON data files found to serve. Try dropping JSON files into /data.');
        process.exit(1);
    }

    // 6. Initialize the Kernel
    const kernel = new JsonExpressKernel();
    kernel.registerConfigProvider(configProvider);
    kernel.context.set('schemas', schemas);

    // 6.1 Logger (registered first to capture all subsequent boot logs)
    const loggerInstance = await loadPluginInstance(cwd, activeLogger, [{ configProvider }]);
    kernel.registerLogger(loggerInstance);

    // 6.2 ID generator (opt-in; kernel ships a UUID default)
    let idGeneratorInstance: any = kernel.container.resolve('idGenerator');
    if (availableIds.length > 0) {
        const activeId = resolveActive('id', availableIds, configProvider)!;
        idGeneratorInstance = await loadPluginInstance(cwd, activeId, [{ configProvider, logger: loggerInstance }]);
        kernel.registerIdGenerator(idGeneratorInstance);
        console.log(`🔌 Registered ID generator: ${activeId}`);
    }

    // 6.3 Middlewares
    const registeredMiddlewares: any[] = [];
    for (const mwName of availableMiddlewares) {
        try {
            const mw = await loadPluginInstance(cwd, mwName, [{ configProvider, logger: loggerInstance }]);
            kernel.registerMiddleware(mw);
            registeredMiddlewares.push(mw);
            console.log(`🔌 Registered middleware: ${mwName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load middleware ${mwName}:`, e?.message || e);
        }
    }

    // 6.4 Seeders
    const registeredSeeders: any[] = [];
    for (const seederName of availableSeeders) {
        try {
            const seeder = await loadPluginInstance(cwd, seederName, [{ configProvider, logger: loggerInstance }]);
            kernel.registerSeeder(seeder);
            registeredSeeders.push(seeder);
            console.log(`🔌 Registered seeder: ${seederName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load seeder ${seederName}:`, e?.message || e);
        }
    }

    // 6.5 Documentation provider (opt-in)
    if (activeDocs) {
        try {
            const docs = await loadPluginInstance(cwd, activeDocs, [{ configProvider, logger: loggerInstance }]);
            kernel.registerDocProvider(docs);
            console.log(`🔌 Registered documentation provider: ${activeDocs}`);
        } catch (e: any) {
            console.error(`❌ Failed to load documentation provider ${activeDocs}:`, e?.message || e);
        }
    }

    // 6.6 Email provider (opt-in)
    if (availableEmails.length > 0) {
        try {
            const activeEmail = resolveActive('email', availableEmails, configProvider)!;
            const emailInstance = await loadPluginInstance(cwd, activeEmail, [{ configProvider, logger: loggerInstance }]);
            kernel.registerEmailProvider(emailInstance);
            console.log(`🔌 Registered email provider: ${activeEmail}`);
        } catch (e: any) {
            console.error(`❌ Failed to load email provider:`, e?.message || e);
        }
    }

    // 6.7 KV store (opt-in)
    if (availableKvStores.length > 0) {
        try {
            const activeKv = resolveActive('kv', availableKvStores, configProvider)!;
            const kvInstance = await loadPluginInstance(cwd, activeKv, [{ configProvider, logger: loggerInstance }]);
            kernel.registerKvStore(kvInstance);
            console.log(`🔌 Registered KV store: ${activeKv}`);
        } catch (e: any) {
            console.error(`❌ Failed to load KV store:`, e?.message || e);
        }
    }

    // 6.8 Task queue (opt-in)
    if (availableQueues.length > 0) {
        try {
            const activeQueue = resolveActive('queue', availableQueues, configProvider)!;
            const queueInstance = await loadPluginInstance(cwd, activeQueue, [{ configProvider, logger: loggerInstance }]);
            kernel.registerQueue(queueInstance);
            console.log(`🔌 Registered task queue: ${activeQueue}`);
        } catch (e: any) {
            console.error(`❌ Failed to load task queue:`, e?.message || e);
        }
    }

    // 6.9 Lifecycle plugins
    const registeredPlugins: any[] = [];
    for (const pluginName of availablePlugins) {
        try {
            const plugin = await loadPluginInstance(cwd, pluginName, [{ configProvider, logger: loggerInstance }]);
            kernel.registerPlugin(plugin);
            registeredPlugins.push(plugin);
            console.log(`🔌 Registered lifecycle plugin: ${pluginName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, e?.message || e);
        }
    }

    // Plugin-contributed schemas (user-defined wins on collision)
    for (const plugin of registeredPlugins) {
        if (typeof plugin.provideSchemas !== 'function') continue;
        const provided = plugin.provideSchemas();
        if (!Array.isArray(provided)) continue;
        for (const schema of provided) {
            const existingIdx = schemas.findIndex(existing => existing.name === schema.name);
            if (existingIdx !== -1) {
                const existing = schemas[existingIdx];
                if ((existing as any).__inferred) {
                    schemas[existingIdx] = schema;
                    console.log(`🧬 Plugin '${plugin.name}' contributed schema: ${schema.name} (replaced JSON inferred schema)`);
                } else {
                    console.warn(`⚠️  Plugin '${plugin.name}' contributes schema '${schema.name}' but it already exists — keeping user-defined version.`);
                }
                continue;
            }
            schemas.push(schema);
            if (!collections.includes(schema.name)) {
                collections.push(schema.name);
            }
            console.log(`🧬 Plugin '${plugin.name}' contributed schema: ${schema.name}`);
        }
    }

    // 7. Adapter, API generator, transport
    const db = await loadPluginInstance(cwd, activeAdapter, [{
        configProvider,
        logger: loggerInstance,
        idGenerator: idGeneratorInstance
    }]);

    if (typeof db.loadData === 'function') db.loadData(initialData);
    if (typeof db.setSchemas === 'function') db.setSchemas(schemas);
    kernel.registerDatabase(db);

    const api = await loadPluginInstance(cwd, activeApi, [{ database: db, configProvider, logger: loggerInstance }]);
    if (typeof api.setSchemas === 'function') api.setSchemas(schemas);
    kernel.registerApiGenerator(api);

    // Hand the same schema set to seeders that opt-in via setSchemas — must
    // run after plugin-contributed schemas have been merged so seeders see
    // the exact same set as db/api.
    for (const seeder of registeredSeeders) {
        if (typeof seeder.setSchemas === 'function') seeder.setSchemas(schemas);
    }

    // Hand schemas to middlewares that opt-in via setSchemas.
    // `middleware-validation` builds its route → validators lookup here.
    for (const mw of registeredMiddlewares) {
        if (typeof mw.setSchemas === 'function') mw.setSchemas(schemas);
    }

    // Doc providers receive the same schema set so they can document resources
    // authoritatively (names, fields, access rules) rather than reverse-engineering
    // from route paths. Resolved from the container because registerDocProvider
    // ran earlier in step 6.5, before plugin-contributed schemas were merged.
    if (kernel.container.hasRegistration('docProvider')) {
        const docProvider = kernel.container.resolve<any>('docProvider');
        if (typeof docProvider?.setSchemas === 'function') docProvider.setSchemas(schemas);
    }

    const transport = await loadPluginInstance(cwd, activeTransport, [{ configProvider, logger: loggerInstance }]);
    kernel.registerTransport(transport);

    // 8. Boot
    const port = configProvider.get<number>('port', 3000);

    let isShuttingDown = false;
    const handleShutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log('\n');
        await kernel.shutdown();
        process.exit(0);
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);

    await kernel.boot(collections, port, { enable: isSmartSeed || isAppendSeed, force: isAppendSeed });
};
