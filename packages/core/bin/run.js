#!/usr/bin/env node
const args = process.argv.slice(2);
const presetArg = args.find(a => a.startsWith('--preset-init'));

import('../dist/index.cjs').then(module => {
    if (presetArg) {
        module.runPresetInit(process.cwd(), presetArg).catch(err => {
            console.error("Fatal Error extracting preset:", err);
            process.exit(1);
        });
    } else {
        module.startServer().catch(err => {
            console.error("Fatal Error booting JSON Express:", err);
            process.exit(1);
        });
    }
});
