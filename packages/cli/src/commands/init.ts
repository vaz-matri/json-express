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
    "@json-express/boot": "*"
  }
}
`;

const ENV_TEMPLATE = `# JSON Express configuration
# All keys are namespaced under JEX. Use '.' or '__' for nesting.

JEX.PORT=3000
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

    console.log('\nNext steps:');
    if (name) console.log(`   cd ${name}`);
    console.log('   npm install');
    console.log('   npm run serve');
}
