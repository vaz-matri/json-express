import { describe, it, expect } from 'vitest';
import { AuthMiddleware } from '../src/index';
import { FatalBootError } from '@json-express/core';
import type { IConfigProvider } from '@json-express/core';

const mockLogger: any = {
    info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, child: () => mockLogger,
};

// Config stub with a real defaults layer so registerDefaults + get interact correctly.
function makeConfig(values: Record<string, any>): IConfigProvider {
    const defaults: Record<string, any> = {};
    return {
        get: (key: string, def?: any) => (key in values ? values[key] : (key in defaults ? defaults[key] : def)),
        has: (key: string) => key in values,
        set: () => {},
        registerDefaults: (ns: string, d: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(d)) defaults[ns ? `${ns}.${k}` : k] = v;
        },
    };
}

const construct = (cfg: IConfigProvider) => new AuthMiddleware({ configProvider: cfg, logger: mockLogger });

describe('auth fail-closed', () => {
    it('vetoes boot in production when no verifier is configured', () => {
        const cfg = makeConfig({ mode: 'production' });
        expect(() => construct(cfg)).toThrow(FatalBootError);
    });

    it('remedy names both fixes (configure a verifier OR opt out)', () => {
        const cfg = makeConfig({ mode: 'production' });
        try {
            construct(cfg);
            throw new Error('expected veto');
        } catch (e: any) {
            expect(e).toBeInstanceOf(FatalBootError);
            expect(e.remedy).toMatch(/jex\.auth\.secret|jex\.auth\.jwksUri/);
            expect(e.remedy).toMatch(/jex\.auth\.required=false/);
        }
    });

    it('boots in production when a verifier IS configured', () => {
        const cfg = makeConfig({ mode: 'production', 'auth.secret': 'hs256-secret' });
        expect(() => construct(cfg)).not.toThrow();
    });

    it('does NOT veto in development with no verifier (dev ergonomics)', () => {
        const cfg = makeConfig({ mode: 'development' });
        expect(() => construct(cfg)).not.toThrow();
    });

    it('lets a public production API opt out with auth.required=false', () => {
        const cfg = makeConfig({ mode: 'production', 'auth.required': false });
        expect(() => construct(cfg)).not.toThrow();
    });

    it('vetoes when auth.required is explicitly true without a verifier, even in dev', () => {
        const cfg = makeConfig({ mode: 'development', 'auth.required': true });
        expect(() => construct(cfg)).toThrow(FatalBootError);
    });
});
