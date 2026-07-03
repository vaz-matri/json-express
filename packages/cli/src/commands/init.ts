import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';
import prompts from 'prompts';

// ---------------------------------------------------------------------------
// Catalogs — what `jex init` can scaffold. Versions pin the current major so
// generated apps survive future majors.
// ---------------------------------------------------------------------------

const V = '^2';

interface Preset {
    value: string;
    title: string;
    description: string;
    deps: Record<string, string>;
    /** Extra "Next steps" lines (e.g. template extraction). */
    nextSteps?: string[];
}

// preset-mock-server is excluded until it leaves private/WIP status.
const PRESETS: Preset[] = [
    {
        value: 'boot',
        title: 'boot — default stack',
        description: 'memory DB, Express, REST, console logger, light docs',
        deps: { '@json-express/boot': V },
    },
    {
        value: 'identity',
        title: 'identity — default stack + full auth',
        description: 'boot + /auth/* endpoints, JWT, users collection, email verification',
        deps: { '@json-express/boot': V, '@json-express/preset-identity': V },
        nextSteps: ['Set jex.auth.secret in .env before serving.'],
    },
    {
        value: 'ecommerce',
        title: 'ecommerce — default stack + shop models',
        description: 'boot + product/order model & data templates',
        deps: { '@json-express/boot': V, '@json-express/preset-ecommerce': V },
        nextSteps: ['npx json-express --preset-init   # extract the model/data templates'],
    },
];

/** Per-category choices for the manual→custom path. `null` = skip category. */
const CUSTOM_CATALOG: Array<{ key: string; label: string; required: boolean; options: string[] }> = [
    { key: 'adapter',   label: 'Database adapter', required: true,  options: ['adapter-memory', 'adapter-json', 'adapter-postgres', 'adapter-mongodb'] },
    { key: 'api',       label: 'API paradigm',     required: true,  options: ['api-rest', 'api-graphql'] },
    { key: 'transport', label: 'HTTP transport',   required: true,  options: ['transport-express', 'transport-fastify'] },
    { key: 'logger',    label: 'Logger',           required: true,  options: ['logger-console', 'logger-pino'] },
    { key: 'docs',      label: 'API docs',         required: false, options: ['docs-light', 'docs-swagger'] },
    { key: 'kv',        label: 'KV store',         required: false, options: ['kv-memory', 'kv-redis'] },
    { key: 'queue',     label: 'Task queue',       required: false, options: ['queue-memory', 'queue-bullmq'] },
    { key: 'email',     label: 'Email provider',   required: false, options: ['email-console'] },
];

const CUSTOM_EXTRAS: Array<{ pkg: string; hint: string }> = [
    { pkg: 'middleware-auth',       hint: 'JWT auth for generated routes' },
    { pkg: 'middleware-validation', hint: 'enforce model validation blocks (Zod)' },
    { pkg: 'plugin-health',         hint: '/health + /info endpoints' },
    { pkg: 'plugin-devcert',        hint: 'local HTTPS in development' },
];

/** Commented .env hints for packages that need configuration before first boot. */
const ENV_HINTS: Record<string, string[]> = {
    '@json-express/adapter-postgres': ['# jex.adapter-postgres.connectionString=postgres://postgres:postgres@localhost:5432/app'],
    '@json-express/adapter-mongodb': ['# jex.adapter-mongodb.connectionString=mongodb://localhost:27017/app'],
    '@json-express/kv-redis': ['# jex.kv-redis.connectionString=redis://localhost:6379'],
    '@json-express/queue-bullmq': ['# jex.queue-bullmq.connectionString=redis://localhost:6379'],
    '@json-express/middleware-auth': ['# jex.auth.secret=change-me'],
    '@json-express/preset-identity': ['# jex.auth.secret=change-me'],
};

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------

const packageJsonTemplate = (name: string, deps: Record<string, string>) => JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    scripts: { serve: 'json-express' },
    dependencies: Object.fromEntries(Object.entries(deps).sort(([a], [b]) => a.localeCompare(b))),
}, null, 2) + '\n';

const envTemplate = (deps: Record<string, string>) => {
    const hints = Object.keys(deps).flatMap(d => ENV_HINTS[d] ?? []);
    return [
        '# JSON Express configuration',
        "# All keys are namespaced under jex. Use '.' or '__' for nesting (case-insensitive).",
        '',
        'jex.port=3000',
        ...(hints.length ? ['', '# Required/likely keys for your installed packages:', ...hints] : []),
        '',
    ].join('\n');
};

const SAMPLE_DATA = `[
  { "id": "1", "title": "Hello, JSON Express!", "createdAt": "2025-01-01" }
]
`;

const AGENTS_MD_TEMPLATE = `# AGENTS.md — how to work on this app

This is a **JSON Express** app (the agent-first backend framework). The one rule that
overrides everything: **never write application code**. No index file, no imports of
\`JsonExpressKernel\`, no wiring, no Express/Fastify code. The server comes from the
\`json-express\` bin (\`npm run serve\`).

## The only surfaces you may change

| Surface | What goes there |
|---|---|
| \`data/<collection>.json\` | Structure — records; CRUD endpoints are generated per file |
| \`models/<collection>.ts\` | Behavior — \`defineModel\` / \`defineRoutes\`: fields, validation, hooks, access rules, custom endpoints |
| \`.env\` | Configuration — \`jex.*\` keys (case-insensitive); keys are package-scoped |
| \`package.json\` deps | Capabilities — install \`@json-express/*\` packages; discovery is automatic |

## The decision ladder (first match wins)

\`data/\` → \`models/\` → install a package → author the missing package and upstream it.
Never solve any requirement with an app-level code file — that option does not exist.

## Where the docs live

- Each installed package documents itself: \`node_modules/@json-express/<pkg>/llms.txt\`
  (its \`jex.*\` keys and what it unlocks in \`models/\`).
- Full guide (workflow, ecosystem index, plugin authoring):
  \`node_modules/@json-express/core/skills/json-express/SKILL.md\`
- The running server self-describes: \`GET /\` (collections) and \`GET /docs/json\` (routes).

## Commands

\`\`\`
npm run serve                  # start the server
npx json-express --seed        # start + seed empty collections (needs a seeder-* package)
npx jex export <collection>    # generate a typed model from existing JSON data
npx jex migrate                # run DB migrations for the active adapter
\`\`\`
`;

const CLAUDE_MD_TEMPLATE = `# CLAUDE.md

@AGENTS.md
`;

// ---------------------------------------------------------------------------
// Flow
// ---------------------------------------------------------------------------

export interface InitOptions {
    /** Skip prompts and scaffold the boot default (also used when not a TTY). */
    yes?: boolean;
    /** Skip prompts and scaffold a named preset: boot | identity | ecommerce. */
    preset?: string;
}

const cancelled = (): never => {
    console.log('\n🛑 init cancelled — nothing written.');
    process.exit(1);
};

async function chooseDeps(opts: InitOptions): Promise<{ deps: Record<string, string>; nextSteps: string[] }> {
    // Non-interactive paths first: --preset, --yes, or no TTY.
    if (opts.preset) {
        const preset = PRESETS.find(p => p.value === opts.preset);
        if (!preset) {
            console.error(`❌ Unknown preset '${opts.preset}'. Available: ${PRESETS.map(p => p.value).join(', ')}`);
            process.exit(1);
        }
        return { deps: preset.deps, nextSteps: preset.nextSteps ?? [] };
    }
    if (opts.yes || !process.stdout.isTTY) {
        return { deps: PRESETS[0].deps, nextSteps: [] };
    }

    const { mode } = await prompts({
        type: 'select',
        name: 'mode',
        message: 'How do you want to start?',
        choices: [
            { title: 'From a preset', description: 'a curated stack, one dependency', value: 'preset' },
            { title: 'Manual setup', description: 'default stack or pick every layer yourself', value: 'manual' },
        ],
    });
    if (!mode) cancelled();

    if (mode === 'preset') {
        const { preset } = await prompts({
            type: 'select',
            name: 'preset',
            message: 'Pick a preset:',
            choices: PRESETS.map(p => ({ title: p.title, description: p.description, value: p.value })),
        });
        if (!preset) cancelled();
        const chosen = PRESETS.find(p => p.value === preset)!;
        return { deps: chosen.deps, nextSteps: chosen.nextSteps ?? [] };
    }

    // Manual → default or custom
    const { manual } = await prompts({
        type: 'select',
        name: 'manual',
        message: 'Manual setup:',
        choices: [
            { title: 'Default stack', description: '@json-express/boot (memory DB, Express, REST)', value: 'default' },
            { title: 'Custom', description: 'choose adapter, API, transport, logger, extras', value: 'custom' },
        ],
    });
    if (!manual) cancelled();
    if (manual === 'default') return { deps: PRESETS[0].deps, nextSteps: [] };

    // Custom: one pick per category (+ optional extras).
    // config-env is always included — a config provider is mandatory.
    const deps: Record<string, string> = {
        '@json-express/core': V,
        '@json-express/config-env': V,
    };

    for (const category of CUSTOM_CATALOG) {
        const choices = category.options.map(o => ({ title: o, value: `@json-express/${o}` }));
        if (!category.required) choices.push({ title: '(none)', value: '' });

        const { pick } = await prompts({
            type: 'select',
            name: 'pick',
            message: `${category.label}:`,
            choices,
        });
        if (pick === undefined) cancelled();
        if (pick) deps[pick] = V;
    }

    const { extras } = await prompts({
        type: 'multiselect',
        name: 'extras',
        message: 'Extras (space to toggle):',
        choices: CUSTOM_EXTRAS.map(e => ({ title: e.pkg, description: e.hint, value: `@json-express/${e.pkg}` })),
        hint: '- enter to confirm',
    });
    if (extras === undefined) cancelled();
    for (const extra of extras as string[]) deps[extra] = V;

    return { deps, nextSteps: [] };
}

export async function runInit(cwd: string, name?: string, opts: InitOptions = {}) {
    console.log('\n🛠  JSON Express — init\n');

    const targetDir = name ? resolve(cwd, name) : cwd;
    const projectName = name || basename(cwd);

    const pkgPath = join(targetDir, 'package.json');
    if (existsSync(pkgPath)) {
        console.error(`❌ ${pkgPath} already exists. Refusing to overwrite.`);
        process.exit(1);
    }

    const { deps, nextSteps } = await chooseDeps(opts);

    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    writeFileSync(pkgPath, packageJsonTemplate(projectName, deps), 'utf8');
    console.log(`✅ Created package.json (${projectName})`);

    const dataDir = join(targetDir, 'data');
    if (!existsSync(dataDir)) mkdirSync(dataDir);
    const modelsDir = join(targetDir, 'models');
    if (!existsSync(modelsDir)) mkdirSync(modelsDir);

    const samplePath = join(dataDir, 'posts.json');
    if (!existsSync(samplePath)) {
        writeFileSync(samplePath, SAMPLE_DATA, 'utf8');
        console.log(`✅ Created data/posts.json (sample collection)`);
    }

    const envPath = join(targetDir, '.env');
    if (!existsSync(envPath)) {
        writeFileSync(envPath, envTemplate(deps), 'utf8');
        console.log(`✅ Created .env`);
    }

    // Agent entry point: AI coding agents read AGENTS.md (and Claude Code reads
    // CLAUDE.md, which imports it) — this is how a fresh app teaches an agent the
    // no-app-code rules before it writes anything.
    const agentsPath = join(targetDir, 'AGENTS.md');
    if (!existsSync(agentsPath)) {
        writeFileSync(agentsPath, AGENTS_MD_TEMPLATE, 'utf8');
        console.log(`✅ Created AGENTS.md (agent instructions)`);
    }
    const claudePath = join(targetDir, 'CLAUDE.md');
    if (!existsSync(claudePath)) {
        writeFileSync(claudePath, CLAUDE_MD_TEMPLATE, 'utf8');
        console.log(`✅ Created CLAUDE.md (imports AGENTS.md)`);
    }

    console.log('\nNext steps:');
    if (name) console.log(`   cd ${name}`);
    console.log('   npm install');
    for (const step of nextSteps) console.log(`   ${step}`);
    console.log('   npm run serve');
}
