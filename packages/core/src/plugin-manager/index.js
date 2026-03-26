import { join } from 'path';
import { readFileSync, existsSync } from 'fs';

// Pluggable in-memory registry map
export const plugins = {
    'data-adapter': [],
    'auth': [],
    'route': []
};

/**
 * Searches the current working directory's package.json 
 * for dependencies starting with '@json-express/'
 */
function discoverLocalPlugins() {
    const cwd = process.cwd();
    const pkgPath = join(cwd, 'package.json');
    const discovered = [];

    if (existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };
            for (const dep in deps) {
                if (dep.startsWith('@json-express/') && dep !== '@json-express/core') {
                    discovered.push(dep);
                }
            }
        } catch (error) {
            console.error('⚠️  Failed to parse local package.json during plugin discovery', error.message);
        }
    }
    return discovered;
}

/**
 * Loads a discovered plugin. 
 * Relies on Node's standard module resolution to elegantly handle 
 * both globally installed and locally installed linked modules.
 */
async function loadPlugin(pluginName) {
    try {
        const pluginModule = await import(pluginName);
        const plugin = pluginModule.default;
        
        if (!plugin || !plugin.name || !plugin.type) {
            console.error(`⚠️  Plugin ${pluginName} does not export a valid interface.`);
            return;
        }

        if (plugins[plugin.type]) {
            plugins[plugin.type].push(plugin);
            console.log(`🔌 Loaded Plugin: ${plugin.name} (${plugin.type})`);
        } else {
            console.warn(`⚠️  Plugin ${plugin.name} declared unknown type: ${plugin.type}`);
        }
    } catch (error) {
        console.error(`⚠️  Failed to load discovered plugin <${pluginName}>. Is it securely installed?`, error.message);
    }
}

export async function initPlugins() {
    // Phase 1: Local Discovery
    const localPlugins = discoverLocalPlugins();
    
    // Determine unique plugins to load
    // Note: Future feature could read from `config.json` explicitly for global fallbacks if wanted
    const pluginsToLoad = [...new Set([...localPlugins])];

    for (const plugin of pluginsToLoad) {
        await loadPlugin(plugin);
    }
}

/**
 * Returns the currently active data-adapter plugin.
 * Prioritizes the most recently loaded adapter, but gracefully falls back to undefined.
 */
export function getActiveDataAdapter() {
    if (plugins['data-adapter'].length > 0) {
        // Return the last injected adapter
        return plugins['data-adapter'][plugins['data-adapter'].length - 1];
    }
    return null;
}

/**
 * Broadcasts the final parsed configuration to all loaded plugins.
 * Will critically halt the CLI if a newly loaded plugin throws a validation error.
 */
export function validatePluginConfigs(config) {
    for (const type in plugins) {
        for (const plugin of plugins[type]) {
            if (typeof plugin.validateConfig === 'function') {
                try {
                    plugin.validateConfig(config);
                } catch (err) {
                    console.error(`\n❌ Plugin Configuration Error [${plugin.name}]:\n   ${err.message}\n`);
                    process.exit(1);
                }
            }
        }
    }
}
