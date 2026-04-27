import { readdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from 'fs';
import { extname, join } from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import prompts from 'prompts';
import { JsonExpressKernel } from '@json-express/core';
import { EnvConfigProvider } from '@json-express/config-env';

// Fallback "Batteries-Included" Defaults
import { MemoryDatabaseAdapter } from '@json-express/adapter-memory';
import { RestApiGenerator } from '@json-express/api-rest';
import { ExpressTransport } from '@json-express/transport-express';
import { ConsoleLogger } from '@json-express/logger-console';
import { LightDocProvider } from '@json-express/docs-light';
import { loadSchemasAndData } from './loaders/schema-loader';
import { runExportSchema } from './commands/export';

export const startServer = async () => {
    const cwd = process.cwd();

    // 0. Intercept CLI Commands (e.g., Export Schema)
    if (process.argv[2] === 'export') {
        const collection = process.argv[3];
        runExportSchema(cwd, collection);
        return;
    }

    // 1. Initialize Configuration Phase
    const configProvider = new EnvConfigProvider(cwd);

    // 2. Auto-Discovery Engine (Strict Execution Boundary: Local package.json)
    const pkgPath = join(cwd, 'package.json');
    let installedDeps: string[] =[];

    if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        installedDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
            .filter(dep => dep.startsWith('@json-express/') || dep.includes('json-express-'));
    }

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

    // --- Parse CLI Execution Flags ---
    const isForceSeed = process.argv.includes('--seeder');
    const isSmartSeed = process.argv.includes('--seed');
    const isConfigure = process.argv.includes('--configure');

    // --- .env Key Overwriter (prevents duplicate lines on repeated --configure runs) ---
    const setEnvKey = (key: string, value: string) => {
        const envPath = join(cwd, '.env');
        const normalizedKey = `JEX.${key.toUpperCase()}`;
        const newLine = `${normalizedKey}=${value}`;

        if (existsSync(envPath)) {
            const existing = readFileSync(envPath, 'utf8');
            const keyRegex = new RegExp(`^${normalizedKey}=.*$`, 'm');
            if (keyRegex.test(existing)) {
                // Overwrite existing key in-place
                writeFileSync(envPath, existing.replace(keyRegex, newLine), 'utf8');
                return;
            }
        }
        // Append if key doesn't exist yet
        appendFileSync(envPath, `\n${newLine}\n`);
    };

    // --- Interactive Plugin Resolution (with --configure support) ---
    if (isConfigure) {
        console.log('\n🔧 JSON Express — Plugin Configuration Wizard\n');
    }

    const resolvePlugin = async (category: string, available: string[], defaultPlugin: string) => {
        // FIX: Allow defaultPlugin as a valid .env override even when a custom plugin is installed
        const userPreference = configProvider.get<string>(category);
        if (!isConfigure && userPreference && (available.includes(userPreference) || userPreference === defaultPlugin)) {
            return userPreference;
        }

        // In --configure mode OR when multiple plugins exist, always prompt
        const shouldPrompt = isConfigure || available.length > 1;
        if (shouldPrompt) {
            // Build the full choice list: default first, then installed (deduped)
            const allChoices = [defaultPlugin, ...available.filter(a => a !== defaultPlugin)];

            if (!isConfigure) {
                console.log(`\n⚠️  Conflict Detected: Multiple ${category} layers found!`);
            }

            const response = await prompts({
                type: 'select',
                name: 'choice',
                message: `Select ${category} plugin:`,
                choices: allChoices.map(a => ({
                    title: a === defaultPlugin ? `${a} (default)` : a,
                    value: a
                }))
            });

            const choice = response.choice || defaultPlugin;
            setEnvKey(category, choice);
            console.log(`✅ Saved: JEX.${category.toUpperCase()}=${choice}\n`);
            return choice;
        }

        // Exactly one custom plugin installed — silently override the default
        if (available.length === 1) return available[0];

        // Fallback to bundled default
        return defaultPlugin;
    };

    const activeAdapter = await resolvePlugin('adapter', availableAdapters, '@json-express/adapter-memory');
    const activeApi = await resolvePlugin('api', availableApis, '@json-express/api-rest');
    const activeTransport = await resolvePlugin('transport', availableTransports, '@json-express/transport-express');
    const activeLogger = await resolvePlugin('logger', availableLoggers, '@json-express/logger-console');
    const activeDocs = await resolvePlugin('docs', availableDocs, '@json-express/docs-light');

    if (isConfigure) {
        console.log('🚀 Configuration saved. Booting server...\n');
    }

    // --- Dynamic Import Helper ---
    const loadPluginInstance = async (pluginName: string, constructorArgs: any[] =[]) => {
        // Use static imports for defaults to ensure fast booting when not overridden
        if (pluginName === '@json-express/adapter-memory') return new MemoryDatabaseAdapter(constructorArgs[0]);
        if (pluginName === '@json-express/api-rest') return new RestApiGenerator(constructorArgs[0]);
        if (pluginName === '@json-express/transport-express') return new ExpressTransport(constructorArgs[0]);
        if (pluginName === '@json-express/logger-console') return new ConsoleLogger();
        if (pluginName === '@json-express/docs-light') return new LightDocProvider(constructorArgs[0]);

        // Dynamically import custom plugins (Ensures local node_modules precedence)
        let mod;
        try {
            // 1. Create a resolver tightly scoped to the user's execution directory
            const localRequire = createRequire(join(cwd, 'package.json'));

            // 2. Resolve the exact entrypoint file path using the package's exports
            const resolvedPath = localRequire.resolve(pluginName);

            // 3. Import it using a rock-solid file:// URL (Cross-Platform)
            mod = await import(pathToFileURL(resolvedPath).href);
        } catch (e) {
            // Fallback to standard resolution (e.g. if plugin is globally bundled)
            mod = await import(pluginName);
        }

        // Pluck the exported Class and instantiate it
        // We look for the first function/class and ignore non-constructable exports like __esModule
        const exports = Object.values(mod);
        const PluginClass = exports.find(v => typeof v === 'function') as any;

        if (!PluginClass) {
            throw new Error(`No constructable export found in plugin ${pluginName}`);
        }

        return new PluginClass(...constructorArgs);
    };

    // 3. Centralized Schema Loader (Scans /models and /data)
    const { schemas, initialData } = await loadSchemasAndData(cwd);
    
    // The collections list now comes directly from the instantiated schemas
    const collections = schemas.map(s => s.name);

    // ✅ Inject Seeder collections to prevent Empty Dataset crash
    const fakerConfig = configProvider.get<any>('faker.collections', {});
    for (const key of Object.keys(fakerConfig)) {
        if (!collections.includes(key)) {
            collections.push(key);
        }
    }

    if (collections.length === 0) {
        console.warn('⚠️  No valid Model Schemas or JSON data files found to serve. Try dropping a JSON file into /data.');
        process.exit(1);
    }

    // 4. Initialize the Kernel
    const kernel = new JsonExpressKernel();
    kernel.registerConfigProvider(configProvider);
    
    // Push the parsed schemas into the Kernel Context so plugins can dynamically read them later
    kernel.context.set('schemas', schemas);

    // 4.1 Resolve and Register Logger (Registered FIRST to catch all other logs)
    const loggerInstance = await loadPluginInstance(activeLogger, [{ configProvider }]);
    kernel.registerLogger(loggerInstance);

    // 4.2 Resolve ID Generator (Fall back to Kernel's default if not installed)
    let idGeneratorInstance = kernel.container.resolve('idGenerator');
    if (availableIds.length > 0) {
        const activeId = await resolvePlugin('id', availableIds, availableIds[0]);
        idGeneratorInstance = await loadPluginInstance(activeId, [{ configProvider, logger: loggerInstance }]);
        kernel.registerIdGenerator(idGeneratorInstance);
        console.log(`🔌 Registered ID generator: ${activeId}`);
    }

    // ✅ Load and register all discovered Middlewares
    for (const mwName of availableMiddlewares) {
        try {
            const mw = await loadPluginInstance(mwName, [{ configProvider, logger: loggerInstance }]);
            kernel.registerMiddleware(mw);
            console.log(`🔌 Registered middleware: ${mwName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load middleware ${mwName}:`, e?.message || e);
        }
    }

    // ✅ Load and register all discovered Seeders
    for (const seederName of availableSeeders) {
        try {
            const seeder = await loadPluginInstance(seederName, [{ configProvider, logger: loggerInstance }]);
            kernel.registerSeeder(seeder);
            console.log(`🔌 Registered seeder: ${seederName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load seeder ${seederName}:`, e?.message || e);
        }
    }

    // ✅ Load and register the resolved Documentation Provider
    try {
        const docs = await loadPluginInstance(activeDocs, [{ configProvider, logger: loggerInstance }]);
        kernel.registerDocProvider(docs);
        console.log(`🔌 Registered documentation provider: ${activeDocs}`);
    } catch (e: any) {
        console.error(`❌ Failed to load documentation provider ${activeDocs}:`, e?.message || e);
    }

    // ✅ Resolve and register the Email Provider (opt-in — no default)
    if (availableEmails.length > 0) {
        try {
            const activeEmail = await resolvePlugin('email', availableEmails, availableEmails[0]);
            const emailInstance = await loadPluginInstance(activeEmail, [{ configProvider, logger: loggerInstance }]);
            kernel.registerEmailProvider(emailInstance);
            console.log(`🔌 Registered email provider: ${activeEmail}`);
        } catch (e: any) {
            console.error(`❌ Failed to load email provider:`, e?.message || e);
        }
    }

    // ✅ Resolve and register the KV Store (opt-in — no default)
    if (availableKvStores.length > 0) {
        try {
            const activeKv = await resolvePlugin('kv', availableKvStores, availableKvStores[0]);
            const kvInstance = await loadPluginInstance(activeKv, [{ configProvider, logger: loggerInstance }]);
            kernel.registerKvStore(kvInstance);
            console.log(`🔌 Registered KV store: ${activeKv}`);
        } catch (e: any) {
            console.error(`❌ Failed to load KV store:`, e?.message || e);
        }
    }

    // ✅ Resolve and register the Task Queue (opt-in — no default)
    if (availableQueues.length > 0) {
        try {
            const activeQueue = await resolvePlugin('queue', availableQueues, availableQueues[0]);
            const queueInstance = await loadPluginInstance(activeQueue, [{ configProvider, logger: loggerInstance }]);
            kernel.registerQueue(queueInstance);
            console.log(`🔌 Registered task queue: ${activeQueue}`);
        } catch (e: any) {
            console.error(`❌ Failed to load task queue:`, e?.message || e);
        }
    }

    // ✅ Load and register all discovered Lifecycle Plugins
    const registeredPlugins: any[] = [];
    for (const pluginName of availablePlugins) {
        try {
            const plugin = await loadPluginInstance(pluginName, [{ configProvider, logger: loggerInstance }]);
            kernel.registerPlugin(plugin);
            registeredPlugins.push(plugin);
            console.log(`🔌 Registered lifecycle plugin: ${pluginName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, e?.message || e);
        }
    }

    // ✅ Gather plugin-contributed schemas (e.g. plugin-identity ships users/roles).
    // User-defined schemas win on collision — silently skip the plugin's version.
    for (const plugin of registeredPlugins) {
        if (typeof plugin.provideSchemas !== 'function') continue;
        const provided = plugin.provideSchemas();
        if (!Array.isArray(provided)) continue;
        for (const schema of provided) {
            if (schemas.some(existing => existing.name === schema.name)) {
                console.warn(`⚠️  Plugin '${plugin.name}' contributes schema '${schema.name}' but it already exists — keeping user-defined version.`);
                continue;
            }
            schemas.push(schema);
            if (!collections.includes(schema.name)) {
                collections.push(schema.name);
            }
            console.log(`🧬 Plugin '${plugin.name}' contributed schema: ${schema.name}`);
        }
    }

    // 5. Instantiate, Configure & Register Plugins
    // ✅ Pass configProvider and idGenerator to the Adapter
    const db = await loadPluginInstance(activeAdapter, [{
        configProvider,
        logger: loggerInstance,
        idGenerator: idGeneratorInstance
    }]);

    if (typeof db.loadData === 'function') {
        db.loadData(initialData);
    }
    if (typeof db.setSchemas === 'function') {
        db.setSchemas(schemas);
    }
    kernel.registerDatabase(db);

    // ✅ Pass database AND configProvider to the API Generator
    const api = await loadPluginInstance(activeApi, [{ database: db, configProvider, logger: loggerInstance }]);
    if (typeof api.setSchemas === 'function') {
        api.setSchemas(schemas);
    }
    kernel.registerApiGenerator(api);

    // ✅ Pass configProvider to the Transport Server
    const transport = await loadPluginInstance(activeTransport,[{ configProvider, logger: loggerInstance }]);
    kernel.registerTransport(transport);

    // Boot the system!
    // We now read the port directly from the Environment Config Provider
    const port = configProvider.get<number>('port', 3000);

    // --- GRACEFUL TEARDOWN CAPTURE ---
    let isShuttingDown = false;
    const handleShutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        console.log('\n'); // Clean newline after ^C
        await kernel.shutdown();
        process.exit(0);
    };

    process.on('SIGINT', handleShutdown);
    process.on('SIGTERM', handleShutdown);

    await kernel.boot(collections, port, { enable: isSmartSeed || isForceSeed, force: isForceSeed });
};
