import { describe, it, expect } from 'vitest';
import { RestApiGenerator } from '../src/index';
import type { IConfigProvider, IDatabaseAdapter, ModelSchema } from '@json-express/core';


const mockLogger: any = {
    info: () => {},
    warn: () => {},
    error: () => {},
    debug: () => {},
    child: () => mockLogger
};

class StubAdapter implements IDatabaseAdapter {
    async getAll() { return []; }
    async getById() { throw new Error('not implemented'); }
    async search() { return []; }
    async create(_c: string, data: any) { return { id: 'x', ...data }; }
    async update(_c: string, id: string, data: any) { return { id, ...data }; }
    async delete(_c: string, id: string) { return { id }; }
}

function makeConfig(values: Record<string, any>): IConfigProvider {
    return {
        get: (k, d) => (k in values ? values[k] : d) as any,
        has: (k) => k in values,
        set: () => {},
    };
}

const protectedSchema: ModelSchema = {
    name: 'private',
    fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
    access: { read: 'admin', create: 'admin', update: 'admin', delete: 'admin' },
};

const publicSchema: ModelSchema = {
    name: 'public_things',
    fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
    access: { read: 'public', create: 'admin', update: 'admin', delete: 'admin' },
};

async function generate(config: IConfigProvider, schemas: ModelSchema[]) {
    const gen = new RestApiGenerator({  database: new StubAdapter(), configProvider: config , logger: mockLogger });
    gen.setSchemas(schemas);
    return gen.generate(schemas.map(s => s.name));
}

describe('api-rest — auth gate honors auth.secret AND auth.jwksUri', () => {
    it('attaches the auth middleware to protected routes when auth.secret is set', async () => {
        const routes = await generate(makeConfig({ 'auth.secret': 'hs256-secret' }), [protectedSchema]);
        const protectedReads = routes.filter(r => r.path.startsWith('/private') && r.method === 'GET');
        expect(protectedReads.length).toBeGreaterThan(0);
        for (const r of protectedReads) {
            expect(r.middlewares).toContain('auth');
        }
    });

    it('attaches the auth middleware to protected routes when ONLY auth.jwksUri is set (regression for JWKS bug)', async () => {
        const routes = await generate(
            makeConfig({ 'auth.jwksUri': 'https://issuer.example.test/.well-known/jwks.json' }),
            [protectedSchema]
        );
        const protectedReads = routes.filter(r => r.path.startsWith('/private') && r.method === 'GET');
        expect(protectedReads.length).toBeGreaterThan(0);
        for (const r of protectedReads) {
            expect(r.middlewares).toContain('auth');
        }
    });

    it('does NOT attach the auth middleware when neither auth key is set', async () => {
        const routes = await generate(makeConfig({}), [protectedSchema]);
        for (const r of routes) {
            expect(r.middlewares ?? []).not.toContain('auth');
        }
    });

    it('does NOT attach the auth middleware to read: public routes even when auth is configured', async () => {
        const routes = await generate(
            makeConfig({ 'auth.jwksUri': 'https://issuer.example.test/.well-known/jwks.json' }),
            [publicSchema]
        );
        const publicReads = routes.filter(r => r.path === '/public_things' && r.method === 'GET');
        expect(publicReads.length).toBeGreaterThan(0);
        for (const r of publicReads) {
            expect(r.middlewares ?? []).not.toContain('auth');
        }
        // …but mutating routes for the same collection still get gated by 'admin'
        const publicMutations = routes.filter(r => r.path.startsWith('/public_things') && r.method !== 'GET');
        for (const r of publicMutations) {
            expect(r.middlewares).toContain('auth');
        }
    });
});
