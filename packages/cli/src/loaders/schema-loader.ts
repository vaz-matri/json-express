import { readdirSync, readFileSync, existsSync } from 'fs';
import { extname, join, basename } from 'path';
import { createJiti } from 'jiti';
import { ModelSchema, defineModel, types, TypeDefinition } from '@json-express/core';

const jiti = createJiti(import.meta.url, { interopDefault: true });

function inferSchemaFromJson(name: string, data: any[]): ModelSchema {
    const fields: Record<string, TypeDefinition> = {};
    
    // Ensure every model has an ID by default
    fields.id = types.id();

    if (data.length > 0) {
        const firstRecord = data[0];
        
        for (const [key, value] of Object.entries(firstRecord)) {
            if (key === 'id') continue;

            if (typeof value === 'string') {
                // Basic date check
                if (!isNaN(Date.parse(value)) && value.includes('-')) {
                    fields[key] = types.date();
                } else {
                    fields[key] = types.string();
                }
            } else if (typeof value === 'number') {
                fields[key] = types.number();
            } else if (typeof value === 'boolean') {
                fields[key] = types.boolean();
            }
            // Note: complex objects/arrays remain un-typed for basic inference.
            // If users need relations, they should `export` to a TS file.
        }
    }
    
    return defineModel({ name, fields });
}

export async function loadSchemasAndData(cwd: string): Promise<{ schemas: ModelSchema[], initialData: Record<string, any[]> }> {
    const modelsDir = join(cwd, 'models');
    const dataDir = join(cwd, 'data');
    
    const schemas: ModelSchema[] = [];
    const initialData: Record<string, any[]> = {};

    // 1. Scan /models Directory (for .ts and .js)
    if (existsSync(modelsDir)) {
        const modelFiles = readdirSync(modelsDir, { withFileTypes: true })
            .filter(dir => dir.isFile() && (extname(dir.name) === '.ts' || extname(dir.name) === '.js'))
            .map(dir => dir.name);

        for (const filename of modelFiles) {
            const filePath = join(modelsDir, filename);
            try {
                // Jiti dynamically transpiles the TS schema on the fly
                const mod = await jiti.import(filePath) as any;
                const schema = mod.default || mod;
                
                if (schema && typeof schema === 'object' && schema.fields) {
                    // Override the name with the filename
                    schema.name = basename(filename, extname(filename));
                    schemas.push(schema);
                } else {
                    console.warn(`⚠️ Warning: ${filename} must export a valid defineModel() object as default.`);
                }
            } catch (e: any) {
                console.error(`❌ Failed to transpile ${filename}: ${e.message}`);
                process.exit(1);
            }
        }
    }

    // 2. Scan /data Directory (for .json) and root (for backwards compatibility fallback)
    const scanJson = (targetDir: string) => {
        if (!existsSync(targetDir)) return;
        const jsonFiles = readdirSync(targetDir, { withFileTypes: true })
            .filter(d => d.isFile() && extname(d.name).toLowerCase() === '.json' && !d.name.includes('package') && !d.name.includes('tsconfig'))
            .map(d => d.name);

        for (const filename of jsonFiles) {
            const collectionName = basename(filename, '.json');
            
            // If data was already loaded from /data, don't overwrite it from root
            if (initialData[collectionName]) continue;

            const fileContent = readFileSync(join(targetDir, filename), 'utf8');
            const parsed = JSON.parse(fileContent);
            const dataArray = Array.isArray(parsed) ? parsed : [parsed];
            initialData[collectionName] = dataArray;

            // If a TS schema DOES NOT exist for this collection, infer a virtual one instantly
            if (!schemas.some(s => s.name === collectionName)) {
                schemas.push(inferSchemaFromJson(collectionName, dataArray));
            }
        }
    };

    scanJson(dataDir);
    scanJson(cwd); // fallback for fast prototyping without folders

    return { schemas, initialData };
}
