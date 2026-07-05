import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import createJiti from 'jiti';
import { fileURLToPath } from 'url';
import { IConfigProvider, deepMerge, getNestedValue, setNestedValue, normalizeConfigKeys } from '@json-express/core';

// ✅ Initialize Jiti v2
const jiti = createJiti(typeof __filename !== 'undefined' ? __filename : fileURLToPath(import.meta.url));

export class AdvancedConfigProvider implements IConfigProvider {
    private config: Record<string, any> = {};
    // Plugin-contributed fail-closed defaults — lowest precedence, below `config`.
    private defaults: Record<string, any> = {};

    // ✅ Make the constructor initialization async (or use a load() method)
    // Since constructors can't be async, the standard pattern is a static async factory method.
    private constructor(config: Record<string, any>, env: string = process.env.NODE_ENV || 'development') {
        this.config = config;
        // `mode` defaults FROM NODE_ENV (see EnvConfigProvider); explicit jex.mode wins.
        this.registerDefaults('', { mode: env });
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
        // Lowercase-normalize so user-written camelCase file keys share one key
        // space with the (already lowercased) env-derived config.
        const mergedConfig = normalizeConfigKeys(deepMerge(baseConfig, modeConfig, envConfigOverrides));

        return new AdvancedConfigProvider(mergedConfig, env);
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
                const mod = jiti(filePath) as any;
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
        const fromConfig = getNestedValue(this.config, key, undefined);
        if (fromConfig !== undefined) return fromConfig;
        const fromDefaults = getNestedValue(this.defaults, key, undefined);
        if (fromDefaults !== undefined) return fromDefaults;
        return defaultValue as T;
    }

    public has(key: string): boolean {
        return getNestedValue(this.config, key, undefined) !== undefined;
    }

    public set<T>(key: string, value: T): void {
        setNestedValue(this.config, key, value);
    }

    public registerDefaults(namespace: string, defaults: Record<string, unknown>): void {
        for (const [key, value] of Object.entries(defaults)) {
            setNestedValue(this.defaults, namespace ? `${namespace}.${key}` : key, value);
        }
    }
}

export default AdvancedConfigProvider;
