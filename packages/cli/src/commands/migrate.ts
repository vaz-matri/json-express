import {
    discoverPluginsRecursively,
    matchesCategory,
    loadPluginInstance,
    loadSchemasAndData,
    type IConfigProvider,
} from '@json-express/core';

/** Minimal logger for one-shot tooling — adapters expect a child()-able logger. */
const toolLogger: any = {
    info: (msg: string) => console.log(`  ${msg}`),
    warn: (msg: string) => console.warn(`  ⚠️  ${msg}`),
    error: (msg: string) => console.error(`  ❌ ${msg}`),
    debug: () => { },
    child: () => toolLogger,
};

export async function runMigrate(cwd: string) {
    console.log('\n🗃  JSON Express — migrate\n');

    // Same discovery the runner uses: no boot file, no wiring — the installed
    // packages and jex.* config fully determine what to migrate.
    const installedDeps = discoverPluginsRecursively(cwd);

    const configs = installedDeps.filter(d => matchesCategory(d, 'config'));
    let configProvider: IConfigProvider | undefined;
    if (configs.length > 0) {
        configProvider = await loadPluginInstance(cwd, configs[0], [cwd]) as IConfigProvider;
    }

    const adapters = installedDeps.filter(d => matchesCategory(d, 'adapter'));
    if (adapters.length === 0) {
        console.error('❌ No @json-express/adapter-* package installed — nothing to migrate.');
        process.exit(1);
    }

    let activeAdapter = adapters[0];
    if (adapters.length > 1) {
        const pick = configProvider?.get<string>('adapter');
        if (!pick || !adapters.includes(pick)) {
            console.error(`❌ Multiple adapters installed: ${adapters.join(', ')}.`);
            console.error('   Set jex.adapter=<package-name> in .env to choose one.');
            process.exit(1);
        }
        activeAdapter = pick;
    }

    try {
        const db = await loadPluginInstance(cwd, activeAdapter, [{ configProvider, logger: toolLogger }]);

        const { schemas } = await loadSchemasAndData(cwd);
        if (typeof db.setSchemas === 'function') db.setSchemas(schemas);

        if (typeof db.migrate !== 'function') {
            console.log(`✅ ${activeAdapter} does not require migration (no migrate method).`);
            process.exit(0);
        }

        console.log(`Migrating via ${activeAdapter} (${schemas.length} schema${schemas.length === 1 ? '' : 's'})...`);
        await db.migrate();
        if (typeof db.shutdown === 'function') await db.shutdown();
        console.log('\n✅ Migration completed successfully.');
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Migration failed:', error?.message ?? error);
        process.exit(1);
    }
}
