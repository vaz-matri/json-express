import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'fs';
import { join } from 'path';
import prompts from 'prompts';
import { discoverPluginsRecursively, matchesCategory } from '@json-express/core';

interface PluginCategory {
    key: string;
    label: string;
}

const CATEGORIES: PluginCategory[] = [
    { key: 'config',    label: 'Configuration provider' },
    { key: 'adapter',   label: 'Database adapter' },
    { key: 'api',       label: 'API generator' },
    { key: 'transport', label: 'HTTP transport' },
    { key: 'logger',    label: 'Logger' },
    { key: 'docs',      label: 'Documentation provider' },
    { key: 'id',        label: 'ID generator' },
    { key: 'email',     label: 'Email provider' },
    { key: 'kv',        label: 'KV store' },
    { key: 'queue',     label: 'Task queue' },
];

function setEnvKey(envPath: string, key: string, value: string) {
    const normalizedKey = `jex.${key}`;
    const newLine = `${normalizedKey}=${value}`;
    if (existsSync(envPath)) {
        const existing = readFileSync(envPath, 'utf8');
        const keyRegex = new RegExp(`^${normalizedKey.replace(/\./g, '\\.')}=.*$`, 'mi');
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

    // Same recursive discovery the runner uses — preset-bundled plugins
    // (e.g. everything inside @json-express/boot) show up in the wizard too.
    const installedDeps = discoverPluginsRecursively(cwd);

    if (installedDeps.length === 0) {
        console.error(`❌ No JSON Express plugins found in package.json dependencies.`);
        console.error(`   Install some first (e.g. 'npm install @json-express/boot') and re-run.`);
        process.exit(1);
    }

    const envPath = join(cwd, '.env');
    let savedCount = 0;
    let skippedCount = 0;

    for (const category of CATEGORIES) {
        const available = installedDeps.filter(d => matchesCategory(d, category.key));
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
        console.log(`  ✅ jex.${category.key}=${response.choice}`);
        savedCount++;
    }

    if (savedCount === 0) {
        console.log(`\nNothing to resolve — every installed category has exactly one plugin (${skippedCount} categor${skippedCount === 1 ? 'y' : 'ies'} auto-selected).`);
        return;
    }

    console.log(`\n🚀 Saved ${savedCount} choice${savedCount === 1 ? '' : 's'} to ${envPath}.`);
}
