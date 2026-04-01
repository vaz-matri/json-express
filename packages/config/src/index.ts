import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { createJiti } from 'jiti';
import { fileURLToPath } from 'url';
import { IConfigProvider, deepMerge, getNestedValue, setNestedValue } from '@json-express/core';

// ✅ Initialize Jiti v2
const jiti = createJiti(typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url));

export class AdvancedConfigProvider implements IConfigProvider {
    private config: Record<string, any> = {};

    // ✅ Make the constructor initialization async (or use a load() method)
    // Since constructors can't be async, the standard pattern is a static async factory method.
    private constructor(config: Record<string, any>) {
        this.config = config;
    }

    public static async init(
        cwd: string = process.cwd(),
        env: string = process.env.NODE_ENV || 'development',
        envConfigOverrides: Record<string, any> = {}
    ): Promise<AdvancedConfigProvider> {
        const extensions =['json', 'yml', 'yaml', 'js', 'cjs', 'mjs', 'ts'];
        const baseName = 'jex.config';

        const loadConfig = async (name: string) => {
            for (const ext of extensions) {
                const filePath = path.join(cwd, `${name}.${ext}`);
                if (fs.existsSync(filePath)) {
                    return await this.parseFile(filePath, ext, env);
                }
            }
            return {};
        };

        const baseConfig = await loadConfig(baseName);
        const modeConfig = await loadConfig(`${baseName}.${env}`);
        const mergedConfig = deepMerge(baseConfig, modeConfig, envConfigOverrides);

        return new AdvancedConfigProvider(mergedConfig);
    }

    private static async parseFile(filePath: string, ext: string, env: string): Promise<any> {
        try {
            if (['json'].includes(ext)) {
                return JSON.parse(fs.readFileSync(filePath, 'utf8'));
            }
            if (['yml', 'yaml'].includes(ext)) {
                return yaml.load(fs.readFileSync(filePath, 'utf8')) || {};
            }
            if (['js', 'cjs', 'mjs', 'ts'].includes(ext)) {
                // ✅ Use Jiti v2 async import
                const mod = await jiti.import(filePath);
                const exported: any = mod.default || mod;

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

    public set<T>(key: string, value: T): void {
        setNestedValue(this.config, key, value);
    }
}
