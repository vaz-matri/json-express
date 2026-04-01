import { describe, it, expect } from 'vitest';
import { buildNestedConfigFromEnv, deepMerge, getNestedValue } from '../src/config';

describe('Config Utilities', () => {

    describe('buildNestedConfigFromEnv (Relaxed Binding)', () => {

        // 1. The Matrix: Testing case-insensitivity and boundaries (. vs __)
        const portTestCases = [[{ 'JEX.PORT': '4000' }],
            [{ 'JEX__PORT': '4000' }],[{ 'jex.port': '4000' }],[{ 'jEx__pOrT': '4000' }],
            [{ 'JEX.port': '4000' }]
        ];

        it.each(portTestCases)('parses %o correctly into { port: 4000 }', (envMock) => {
            const result = buildNestedConfigFromEnv(envMock, 'jex');

            // Notice it asserts the value is a NUMBER, testing our auto-casting logic!
            expect(result).toEqual({ port: 4000 });
        });

        // 2. Testing Deep Nesting and Multi-word keys
        it('parses deep nesting and multi-word keys correctly', () => {
            const envMock = {
                'JEX.TRANSPORT.EXPRESS.LOGGER': 'true',
                'JEX__DATABASE__MAX_CONNECTIONS': '100',
                'jex.api__rest.prefix': '/api/v1',
                'SOME_OTHER_VAR': 'ignore_me' // Should be completely ignored
            };

            const result = buildNestedConfigFromEnv(envMock, 'jex');

            expect(result).toEqual({
                transport: {
                    express: {
                        logger: true // Auto-casted to boolean
                    }
                },
                database: {
                    max_connections: 100 // Multi-word kept intact with _, auto-casted to number
                },
                api: {
                    rest: {
                        prefix: '/api/v1' // Kept as string
                    }
                }
            });
        });
    });

    describe('deepMerge', () => {
        it('merges configurations with strict right-to-left precedence', () => {
            const defaultConfigs = { port: 3000, db: { host: 'localhost', user: 'admin' } };
            const trackedConfigs = { db: { host: 'remote-db' } }; // Overrides host
            const envConfigs = { port: 8080 }; // Overrides port

            const result = deepMerge(defaultConfigs, trackedConfigs, envConfigs);

            expect(result).toEqual({
                port: 8080,
                db: {
                    host: 'remote-db',
                    user: 'admin' // Preserved from defaults
                }
            });
        });
    });

    describe('getNestedValue', () => {
        it('safely retrieves nested values or falls back to default', () => {
            const config = { transport: { express: { port: 4000 } } };

            expect(getNestedValue(config, 'transport.express.port')).toBe(4000);
            expect(getNestedValue(config, 'transport.fastify.port', 3000)).toBe(3000); // Fallback
        });
    });
});
