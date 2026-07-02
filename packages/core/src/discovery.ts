import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';
import { pathToFileURL } from 'url';

/**
 * Category matching anchored to the package-name conventions:
 *   @json-express/<category>-*          (first-party)
 *   json-express-<category>-*           (community, unscoped)
 *   @<scope>/json-express-<category>-*  (community, scoped)
 *
 * Anchoring matters: with bare substring matching, `@json-express/openapi-docs`
 * would land in the `api` bucket and anything containing `uuid-` in the `id` bucket.
 */
export const matchesCategory = (dep: string, category: string): boolean => {
    if (dep.startsWith(`@json-express/${category}-`)) return true;
    const unscoped = dep.startsWith('@') ? dep.slice(dep.indexOf('/') + 1) : dep;
    return unscoped.startsWith(`json-express-${category}-`);
};

/**
 * Picks the constructable export from a plugin module. Resolution ladder:
 *   1. default export (the documented convention)
 *   2. a named `plugin` / `Plugin` export
 *   3. first exported function — legacy heuristic, kept for back-compat but
 *      export-order-dependent, so it warns.
 * The `default.default` probe handles CJS builds loaded through dynamic
 * `import()`, where the module namespace nests one level deep.
 */
export const selectPluginExport = (mod: any, pluginName: string): new (...args: any[]) => any => {
    const candidates = [mod?.default?.default, mod?.default, mod?.plugin, mod?.Plugin];
    for (const candidate of candidates) {
        if (typeof candidate === 'function') return candidate;
    }

    const fallback = Object.values(mod ?? {}).find(v => typeof v === 'function') as any;
    if (fallback) {
        console.warn(
            `⚠️  Plugin '${pluginName}' has no default export — falling back to its first exported function ('${fallback.name}'). ` +
            `Plugin authors should add 'export default <PluginClass>' to make selection deterministic.`
        );
        return fallback;
    }

    throw new Error(`No constructable export found in plugin ${pluginName}`);
};

export const loadPluginInstance = async (cwd: string, pluginName: string, constructorArgs: any[] = []) => {
    let mod: any;
    try {
        const localRequire = createRequire(join(cwd, 'package.json'));
        const resolvedPath = localRequire.resolve(pluginName);
        mod = await import(pathToFileURL(resolvedPath).href);
    } catch (e) {
        mod = await import(pluginName);
    }

    const PluginClass = selectPluginExport(mod, pluginName);

    // Prefer a static async factory when the class ships one — required for
    // plugins whose setup is async (e.g. @json-express/config loads and
    // transpiles jex.config.ts before it can answer get()).
    if (typeof (PluginClass as any).init === 'function') {
        return await (PluginClass as any).init(...constructorArgs);
    }

    return new PluginClass(...constructorArgs);
};

/**
 * Locates a dependency's package directory. Resolves `<dep>/package.json`
 * first — that works even for packages with no usable entry point (presets),
 * provided their exports map allows it. Falls back to resolving the entry
 * point and walking up, for third-party packages that don't export their
 * manifest. Returns null when the package can't be located at all.
 */
const resolvePackageDir = (fromDir: string, dep: string): string | null => {
    const req = createRequire(join(fromDir, 'package.json'));

    try {
        return dirname(req.resolve(`${dep}/package.json`));
    } catch { /* exports map may not expose ./package.json — try the entry point */ }

    try {
        const entry = req.resolve(dep);
        let dir = dirname(entry);
        while (dir !== dirname(dir) && !existsSync(join(dir, 'package.json'))) {
            dir = dirname(dir);
        }
        return existsSync(join(dir, 'package.json')) ? dir : null;
    } catch {
        return null;
    }
};

/**
 * Crawls the project's dependency tree for json-express packages, following
 * transitive deps so meta-packages (`@json-express/boot`, `preset-*`) pull
 * their whole stack into discovery.
 */
export const discoverPluginsRecursively = (cwd: string): string[] => {
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

            const depDir = resolvePackageDir(pkgDir, dep);
            if (!depDir) {
                console.warn(`⚠️  Could not resolve '${dep}' — plugins it bundles (if any) will not be discovered.`);
                continue;
            }
            crawl(depDir);
        }
    };

    crawl(cwd);
    return Array.from(allDiscovered);
};
