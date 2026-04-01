import { readdirSync, readFileSync, existsSync, appendFileSync } from 'fs';
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

export const startServer = async () => {
    const cwd = process.cwd();

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
    const availablePlugins = installedDeps.filter(d => d.includes('plugin-'));

    // --- Parse CLI Execution Flags ---
    const isForceSeed = process.argv.includes('--seeder');
    const isSmartSeed = process.argv.includes('--seed');

    // --- Interactive Conflict Resolution Helper ---
    const resolvePlugin = async (category: string, available: string[], defaultPlugin: string) => {
        // 1. Check if user already explicitly defined a preference in .env
        const userPreference = configProvider.get<string>(category);
        if (userPreference && available.includes(userPreference)) return userPreference;

        // 2. If exactly one custom plugin is installed, silently override the default!
        if (available.length === 1) return available[0];

        // 3. If multiple plugins exist, pause and prompt the user (Fail Fast safely)
        if (available.length > 1) {
            console.log(`\n⚠️  Conflict Detected: Multiple ${category} layers found!`);
            const response = await prompts({
                type: 'select',
                name: 'choice',
                message: `Which plugin would you like to use for the ${category} layer?`,
                choices: available.map(a => ({ title: a, value: a }))
            });

            const choice = response.choice;

            // Auto-write the preference to their .env file so it doesn't prompt them again
            appendFileSync(join(cwd, '.env'), `\nJEX_${category.toUpperCase()}=${choice}\n`);
            console.log(`✅ Saved preference to .env\n`);

            return choice;
        }

        // 4. Fallback to bundled defaults
        return defaultPlugin;
    };

    const activeAdapter = await resolvePlugin('adapter', availableAdapters, '@json-express/adapter-memory');
    const activeApi = await resolvePlugin('api', availableApis, '@json-express/api-rest');
    const activeTransport = await resolvePlugin('transport', availableTransports, '@json-express/transport-express');

    // --- Dynamic Import Helper ---
    const loadPluginInstance = async (pluginName: string, constructorArgs: any[] =[]) => {
        // Use static imports for defaults to ensure fast booting when not overridden
        if (pluginName === '@json-express/adapter-memory') return new MemoryDatabaseAdapter(...constructorArgs);
        if (pluginName === '@json-express/api-rest') return new RestApiGenerator(constructorArgs[0]);
        if (pluginName === '@json-express/transport-express') return new ExpressTransport(...constructorArgs);

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
        const PluginClass = Object.values(mod)[0] as any;
        return new PluginClass(...constructorArgs);
    };

    // 3. Scan for JSON Data files (excluding configs)
    const files = readdirSync(cwd, { withFileTypes: true })
        .filter(dirent =>
            dirent.isFile() &&
            extname(dirent.name).toLowerCase() === '.json' &&
            !dirent.name.includes('config') &&
            !dirent.name.includes('package') &&
            !dirent.name.includes('tsconfig')
        )
        .map(dirent => dirent.name);

    const initialData: Record<string, any[]> = {};
    for (const filename of files) {
        const fileContent = readFileSync(join(cwd, filename), 'utf8');
        const parsed = JSON.parse(fileContent);
        const collectionName = filename.replace('.json', '');
        initialData[collectionName] = Array.isArray(parsed) ? parsed : [parsed];
    }

    const collections = Object.keys(initialData);

    // ✅ Inject Seeder collections to prevent Empty Dataset crash
    const fakerConfig = configProvider.get<any>('faker.collections', {});
    for (const key of Object.keys(fakerConfig)) {
        if (!collections.includes(key)) {
            collections.push(key);
        }
    }

    if (collections.length === 0) {
        console.warn('⚠️  No valid JSON data files found to serve.');
        process.exit(1);
    }

    // 4. Initialize the Kernel
    const kernel = new JsonExpressKernel();
    kernel.registerConfigProvider(configProvider);

    // ✅ Load and register all discovered Middlewares
    for (const mwName of availableMiddlewares) {
        try {
            const mw = await loadPluginInstance(mwName, [{ configProvider }]);
            kernel.registerMiddleware(mw);
            console.log(`🔌 Registered middleware: ${mwName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load middleware ${mwName}:`, e?.message || e);
        }
    }

    // ✅ Load and register all discovered Seeders
    for (const seederName of availableSeeders) {
        try {
            const seeder = await loadPluginInstance(seederName, [{ configProvider }]);
            kernel.registerSeeder(seeder);
            console.log(`🔌 Registered seeder: ${seederName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load seeder ${seederName}:`, e?.message || e);
        }
    }

    // ✅ Load and register all discovered Lifecycle Plugins
    for (const pluginName of availablePlugins) {
        try {
            const plugin = await loadPluginInstance(pluginName, [{ configProvider }]);
            kernel.registerPlugin(plugin);
            console.log(`🔌 Registered lifecycle plugin: ${pluginName}`);
        } catch (e: any) {
            console.error(`❌ Failed to load plugin ${pluginName}:`, e?.message || e);
        }
    }

    // 5. Instantiate, Configure & Register Plugins
    // ✅ Pass configProvider to the Adapter
    const db = await loadPluginInstance(activeAdapter, [{ configProvider }]);

    if (typeof db.loadData === 'function') {
        db.loadData(initialData);
    }
    kernel.registerDatabase(db);

    // ✅ Pass database AND configProvider to the API Generator
    const api = await loadPluginInstance(activeApi, [{ database: db, configProvider }]);
    kernel.registerApiGenerator(api);

    // ✅ Pass configProvider to the Transport Server
    const transport = await loadPluginInstance(activeTransport,[{ configProvider }]);
    kernel.registerTransport(transport);

    // 6. Boot the system!
    // We now read the port directly from the Environment Config Provider
    const port = configProvider.get<number>('port', 3000);
    await kernel.boot(collections, port, { enable: isSmartSeed || isForceSeed, force: isForceSeed });
};
