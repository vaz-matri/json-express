import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { basename, join, resolve } from 'path';

const PACKAGE_JSON_TEMPLATE = (name: string) => `{
  "name": "${name}",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "serve": "json-express"
  },
  "dependencies": {
    "@json-express/boot": "^2"
  }
}
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

const ENV_TEMPLATE = `# JSON Express configuration
# All keys are namespaced under jex. Use '.' or '__' for nesting.

jex.port=3000
`;

const SAMPLE_DATA = `[
  { "id": "1", "title": "Hello, JSON Express!", "createdAt": "2025-01-01" }
]
`;

export function runInit(cwd: string, name?: string) {
    console.log('\n🛠  JSON Express — init\n');

    const targetDir = name ? resolve(cwd, name) : cwd;
    const projectName = name || basename(cwd);

    if (!existsSync(targetDir)) {
        mkdirSync(targetDir, { recursive: true });
    }

    const pkgPath = join(targetDir, 'package.json');
    if (existsSync(pkgPath)) {
        console.error(`❌ ${pkgPath} already exists. Refusing to overwrite.`);
        process.exit(1);
    }

    writeFileSync(pkgPath, PACKAGE_JSON_TEMPLATE(projectName), 'utf8');
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
        writeFileSync(envPath, ENV_TEMPLATE, 'utf8');
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
    console.log('   npm run serve');
}
