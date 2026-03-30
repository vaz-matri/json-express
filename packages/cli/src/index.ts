import { readdirSync, readFileSync, existsSync, appendFileSync } from 'fs';
import { extname, join } from 'path';
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
            const localPath = join(cwd, 'node_modules', pluginName);
            mod = await import(localPath);
        } catch (e) {
            // Fallback to standard resolution
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

    if (collections.length === 0) {
        console.warn('⚠️  No valid JSON data files found to serve.');
        process.exit(1);
    }

    // 4. Initialize the Kernel
    const kernel = new JsonExpressKernel();
    kernel.registerConfigProvider(configProvider);

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
    await kernel.boot(collections, port);
};
