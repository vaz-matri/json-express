import { readdirSync, readFileSync } from 'fs';
import { extname, join } from 'path';
import { JsonExpressKernel } from '@json-express/core';

// Import our default official plugins
import { MemoryDatabaseAdapter } from '@json-express/adapter-memory';
import { RestApiGenerator } from '@json-express/api-rest';
import { ExpressTransport } from '@json-express/transport-express';

export const startServer = async () => {
    const cwd = process.cwd();

    // 1. Scan for JSON files
    const files = readdirSync(cwd, { withFileTypes: true })
        .filter(dirent => dirent.isFile() && extname(dirent.name).toLowerCase() === '.json')
        .map(dirent => dirent.name);

    const initialData: Record<string, any[]> = {};
    let config = { port: 3000 }; // Default config

    // 2. Parse the files
    for (const filename of files) {
        if (filename === 'package.json' || filename === 'package-lock.json' || filename === 'tsconfig.json') {
            continue;
        }

        const filePath = join(cwd, filename);
        const fileContent = readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(fileContent);

        if (filename === 'config.json') {
            config = { ...config, ...parsed };
            continue;
        }

        const collectionName = filename.replace('.json', '');
        initialData[collectionName] = Array.isArray(parsed) ? parsed : [parsed];
    }

    const collections = Object.keys(initialData);

    if (collections.length === 0) {
        console.warn('⚠️ No valid JSON data files found to serve.');
        process.exit(1);
    }

    // 3. Initialize the Kernel
    const kernel = new JsonExpressKernel();

    // 4. Instantiate & Configure Default Plugins
    const memoryDb = new MemoryDatabaseAdapter();
    memoryDb.loadData(initialData); // Load our parsed JSON into the DB

    const restApi = new RestApiGenerator({ database: memoryDb });
    const expressTransport = new ExpressTransport();

    // 5. Register Plugins to the Kernel
    kernel.registerDatabase(memoryDb);
    kernel.registerApiGenerator(restApi);
    kernel.registerTransport(expressTransport);

    // 6. Boot the system!
    await kernel.boot(collections, config.port);
};

// // If run directly (not imported)
// if (import.meta.url === `file://${process.argv[1]}`) {
//     startServer().catch(console.error);
// }
