import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import prompts from 'prompts';

interface PluginCategory {
    key: string;
    label: string;
    substring: string;
}

const CATEGORIES: PluginCategory[] = [
    { key: 'config',    label: 'Configuration provider', substring: 'config-' },
    { key: 'adapter',   label: 'Database adapter',       substring: 'adapter-' },
    { key: 'api',       label: 'API generator',          substring: 'api-' },
    { key: 'transport', label: 'HTTP transport',         substring: 'transport-' },
    { key: 'logger',    label: 'Logger',                 substring: 'logger-' },
    { key: 'docs',      label: 'Documentation provider', substring: 'docs-' },
    { key: 'id',        label: 'ID generator',           substring: 'id-' },
    { key: 'email',     label: 'Email provider',         substring: 'email-' },
    { key: 'kv',        label: 'KV store',               substring: 'kv-' },
    { key: 'queue',     label: 'Task queue',             substring: 'queue-' },
];

function setEnvKey(envPath: string, key: string, value: string) {
    const normalizedKey = `JEX.${key.toUpperCase()}`;
    const newLine = `${normalizedKey}=${value}`;
    if (existsSync(envPath)) {
        const existing = readFileSync(envPath, 'utf8');
        const keyRegex = new RegExp(`^${normalizedKey.replace(/\./g, '\\.')}=.*$`, 'm');
        if (keyRegex.test(existing)) {
            writeFileSync(envPath, existing.replace(keyRegex, newLine), 'utf8');
            return;
        }
        appendFileSync(envPath, existing.endsWith('\n') ? `${newLine}\n` : `\n${newLine}\n`);
        return;
    }
    writeFileSync(envPath, `${newLine}\n`, 'utf8');
}

export async function runConfigure(cwd: string) {
    console.log('\n🔧 JSON Express — Plugin Configuration Wizard\n');

    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) {
        console.error(`❌ No package.json found in ${cwd}.`);
        process.exit(1);
    }

    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const installedDeps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
        .filter(dep => dep.startsWith('@json-express/') || dep.includes('json-express-'));

    if (installedDeps.length === 0) {
        console.error(`❌ No JSON Express plugins found in package.json dependencies.`);
        console.error(`   Install some first (e.g. 'npm install @json-express/boot') and re-run.`);
        process.exit(1);
    }

    const envPath = join(cwd, '.env');
    let savedCount = 0;
    let skippedCount = 0;

    for (const category of CATEGORIES) {
        const available = installedDeps.filter(d => d.includes(category.substring));
        if (available.length === 0) continue;

        if (available.length === 1) {
            console.log(`  • ${category.label}: ${available[0]} (only option)`);
            skippedCount++;
            continue;
        }

        const response = await prompts({
            type: 'select',
            name: 'choice',
            message: `Select ${category.label}:`,
            choices: available.map(a => ({ title: a, value: a })),
        });

        if (!response.choice) {
            console.log('\n🛑 Wizard cancelled — no further changes saved.');
            return;
        }

        setEnvKey(envPath, category.key, response.choice);
        console.log(`  ✅ JEX.${category.key.toUpperCase()}=${response.choice}`);
        savedCount++;
    }

    if (savedCount === 0) {
        console.log(`\nNothing to resolve — every installed category has exactly one plugin (${skippedCount} category${skippedCount === 1 ? '' : 'ies'} auto-selected).`);
        return;
    }

    console.log(`\n🚀 Saved ${savedCount} choice${savedCount === 1 ? '' : 's'} to ${envPath}.`);
}
