import { existsSync, cpSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { createRequire } from 'module';

export const runPresetInit = async (cwd: string, flagArg?: string) => {
    let targetPreset = flagArg?.includes('=') ? flagArg.split('=')[1] : undefined;

    const localRequire = createRequire(join(cwd, 'package.json'));
    
    const pkgPath = join(cwd, 'package.json');
    if (!existsSync(pkgPath)) {
        console.error('❌ No package.json found in current directory.');
        process.exit(1);
    }
    
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const deps = Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })
        .filter(dep => dep.startsWith('@json-express/') || dep.includes('json-express-'));
        
    const resolvePackageRoot = (dep: string) => {
        try {
            const resolved = localRequire.resolve(dep);
            let currentDir = dirname(resolved);
            while (currentDir !== '/' && !existsSync(join(currentDir, 'package.json'))) {
                currentDir = dirname(currentDir);
            }
            return currentDir;
        } catch (e) {
            return null;
        }
    };

    const presetsWithTemplates: string[] = [];
    
    for (const dep of deps) {
        const root = resolvePackageRoot(dep);
        if (root && existsSync(join(root, 'templates'))) {
            presetsWithTemplates.push(dep);
        }
    }
    
    if (presetsWithTemplates.length === 0) {
        console.error(`❌ No preset packages with templates found in your dependencies.`);
        process.exit(1);
    }
    
    if (!targetPreset && presetsWithTemplates.length > 1) {
        console.error(`❌ Multiple presets found. Please specify which one to extract:`);
        console.error(`   json-express --preset-init=<preset-name>`);
        console.error(`   Installed: ${presetsWithTemplates.join(', ')}`);
        process.exit(1);
    }
    
    targetPreset = targetPreset || presetsWithTemplates[0];
    
    if (!presetsWithTemplates.includes(targetPreset)) {
         console.error(`❌ Preset '${targetPreset}' is not installed or has no templates.`);
         process.exit(1);
    }

    const presetRoot = resolvePackageRoot(targetPreset)!;
    const templatesDir = join(presetRoot, 'templates');
    
    console.log(`📦 Extracting templates from ${targetPreset}...`);
    cpSync(templatesDir, cwd, { recursive: true, force: false, errorOnExist: false });
    console.log(`✅ Templates copied successfully! Check your ./models and ./data directories.`);
};
