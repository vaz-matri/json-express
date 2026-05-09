import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { IConfigProvider, buildNestedConfigFromEnv, getNestedValue, setNestedValue } from '@json-express/core';

export class EnvConfigProvider implements IConfigProvider {
    private config: Record<string, any> = {};

    constructor(cwd: string = process.cwd(), env: string = process.env.NODE_ENV || 'development') {
        // Twelve-Factor Cascading Precedence (Lowest to Highest)
        const filesToLoad =[
            '.env',
            `.env.${env}`,
            '.env.local',
            `.env.${env}.local`
        ];

        let mergedRawEnv: Record<string, string> = {};

        // 1. Load files in order. Later files overwrite earlier ones.
        for (const file of filesToLoad) {
            const fullPath = path.join(cwd, file);
            if (fs.existsSync(fullPath)) {
                const parsed = dotenv.parse(fs.readFileSync(fullPath, 'utf8'));
                mergedRawEnv = { ...mergedRawEnv, ...parsed };
            }
        }

        // 2. Real System environment variables have the ultimate highest priority
        mergedRawEnv = { ...mergedRawEnv, ...(process.env as Record<string, string>) };

        // 3. Parse only "jex." or "jex__" prefixed vars into a nested object using Core utilities
        // ✅ FIX: Remove the array, just pass the string 'jex' (or nothing!)
        this.config = buildNestedConfigFromEnv(mergedRawEnv, 'jex');
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

    /** Helper to allow deep merging if the advanced config plugin is also loaded */
    public getRawConfig(): Record<string, any> {
        return this.config;
    }
}
