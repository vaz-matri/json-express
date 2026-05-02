#!/usr/bin/env node
import('../dist/index.cjs').then(module => {
    module.startServer().catch(err => {
        console.error("Fatal Error booting JSON Express:", err);
        process.exit(1);
    });
});
