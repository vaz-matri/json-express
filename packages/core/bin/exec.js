#!/usr/bin/env node
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if running from raw source (not installed via npm/pnpm)
const isLinked = !__dirname.includes('node_modules') && !__dirname.includes('.pnpm');

if (process.argv.includes('--dev')) {
    if (isLinked) {
        const args = process.argv.slice(2).filter(a => a !== '--dev');
        // Use Node's native watch feature to auto-restart the CLI when its own source changes!
        const child = spawn(process.execPath, ['--watch', __filename, ...args], { stdio: 'inherit' });
        
        child.on('close', code => {
            process.exit(code);
        });
    } else {
        console.warn('⚠️  --dev flag is ignored. It is only available when running from a locally linked repository.');
        import('../src/app.js').then(module => {
            module.default();
        });
    }
} else {
    import('../src/app.js').then(module => {
        module.default();
    });
}
