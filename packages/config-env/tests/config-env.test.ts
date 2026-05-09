import { describe, it, expect, vi } from 'vitest';
import { EnvConfigProvider } from '../src/index';
import { join } from 'path';

describe('EnvConfigProvider (Integration with Fixtures)', () => {

    it('loads a basic .env file', () => {
        // Point the provider to the "basic" fixture folder
        const fixturePath = join(__dirname, 'fixtures/basic');
        const provider = new EnvConfigProvider(fixturePath);

        // Assuming basic/.env has jex.port=4000
        expect(provider.get('port')).toBe(4000);
    });

    it('cascades environments correctly (.env < .env.[mode] < .env.local)', () => {
        // Point the provider to the "cascading" fixture folder
        const fixturePath = join(__dirname, 'fixtures/cascading');

        // Simulate running in "production" mode
        const provider = new EnvConfigProvider(fixturePath, 'production');

        const rawConfig = provider.getRawConfig();

        // port should be 8080 (overridden by .env.local)
        expect(rawConfig.port).toBe(8080);

        // db.host should be 'aws-rds' (overridden by .env.production)
        expect(rawConfig.db.host).toBe('aws-rds');
    });

    it('prioritizes actual process.env variables over files', () => {
        const fixturePath = join(__dirname, 'fixtures/basic');

        // ✅ Correct key (double underscore) to test precedence
        vi.stubEnv('JEX__PORT', '9999');

        const provider = new EnvConfigProvider(fixturePath);

        // It should successfully read the OS variable and override the file
        expect(provider.get('port')).toBe(9999);

        vi.unstubAllEnvs();
    });

    it('strictly ignores single-underscore variables (JEX_PORT)', () => {
        const fixturePath = join(__dirname, 'fixtures/basic');

        // ❌ Invalid key (single underscore). The parser should ignore this!
        vi.stubEnv('JEX_PORT', '9999');

        const provider = new EnvConfigProvider(fixturePath);

        // It should ignore the 9999 and fallback to the 4000 inside the basic/.env file
        expect(provider.get('port')).toBe(4000);
        expect(provider.get('port')).not.toBe(9999);

        vi.unstubAllEnvs();
    });
});
