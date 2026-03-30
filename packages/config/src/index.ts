import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import jiti from 'jiti';
import { fileURLToPath } from 'url';
import { IConfigProvider, deepMerge, getNestedValue } from '@json-express/core';

// Initialize jiti to support on-the-fly .ts, .mjs, and .cjs transpilation
const _require = jiti(typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url));

export class AdvancedConfigProvider implements IConfigProvider {
    private config: Record<string, any> = {};

    constructor(
        cwd: string = process.cwd(),
        env: string = process.env.NODE_ENV || 'development',
        envConfigOverrides: Record<string, any> = {} // Allows merging .env files on top!
    ) {
        const extensions =['json', 'yml', 'yaml', 'js', 'cjs', 'mjs', 'ts'];
        const baseName = 'jex.config';

        const loadConfig = (name: string) => {
            for (const ext of extensions) {
                const filePath = path.join(cwd, `${name}.${ext}`);
                if (fs.existsSync(filePath)) {
                    return this.parseFile(filePath, ext, env);
                }
            }
            return {};
        };

        // 1. Load shared base configuration
        const baseConfig = loadConfig(baseName);

        // 2. Load environment-specific configuration (e.g., jex.config.production.json)
        const modeConfig = loadConfig(`${baseName}.${env}`);

        // 3. Deep merge: Base -> Mode -> Env Overrides (Ensuring .env always wins)
        this.config = deepMerge(baseConfig, modeConfig, envConfigOverrides);
    }

    private parseFile(filePath: string, ext: string, env: string): any {
        try {
            if (['json'].includes(ext)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            if (['yml', 'yaml'].includes(ext)) {
                return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
            }
            if (['js', 'cjs', 'mjs', 'ts'].includes(ext)) {
                const mod = _require(filePath);
                const exported = mod.default || mod;

                // If the user exports a function, execute it with context!
                if (typeof exported === 'function') {
                    return exported({ env });
                }
                return exported;
            }
        } catch (e) {
            console.error(`❌ [Config] Error parsing ${filePath}:`, e);
        }
        return {};
    }

    public get<T>(key: string, defaultValue?: T): T {
        return getNestedValue(this.config, key, defaultValue);
    }

    public has(key: string): boolean {
        return getNestedValue(this.config, key, undefined) !== undefined;
    }
}
