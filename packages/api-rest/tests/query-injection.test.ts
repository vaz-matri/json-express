import { describe, it, expect } from 'vitest';
import { RestApiGenerator } from '../src/index';
import type { IConfigProvider, IDatabaseAdapter, JsonRequest, ModelSchema } from '@json-express/core';

const mockLogger: any = {
    info: () => {}, warn: () => {}, error: () => {}, debug: () => {}, child: () => mockLogger,
};

// Records exactly what filter each read path received, so we can assert operator
// objects never survive the api-rest → adapter boundary.
class SpyAdapter implements IDatabaseAdapter {
    public searchArgs: any[] = [];
    public getAllCalls = 0;
    async getAll() { this.getAllCalls++; return []; }
    async getById() { throw new Error('not implemented'); }
    async search(_c: string, query: any) { this.searchArgs.push(query); return []; }
    async create(_c: string, data: any) { return { id: 'x', ...data }; }
    async update(_c: string, id: string, data: any) { return { id, ...data }; }
    async delete(_c: string, id: string) { return { id }; }
}

const config: IConfigProvider = { get: (_k, d) => d as any, has: () => false, set: () => {} };

const schema: ModelSchema = {
    name: 'things',
    fields: { id: { type: 'id', options: {} } as any, status: { type: 'string', options: {} } as any },
    access: { read: 'public' },
};

function makeReq(query: Record<string, any>): JsonRequest {
    return { method: 'GET', path: '/things', body: undefined, query, params: {}, headers: {} } as any;
}

async function listHandler(db: SpyAdapter) {
    const gen = new RestApiGenerator({ database: db, configProvider: config, logger: mockLogger });
    gen.setSchemas([schema]);
    const routes = await gen.generate(['things']);
    const route = routes.find(r => r.method === 'GET' && r.path === '/things')!;
    return route.handler;
}

describe('api-rest — query injection is stripped before the adapter', () => {
    it('drops an operator-only filter (?status[$ne]=x) so it never reaches search()', async () => {
        const db = new SpyAdapter();
        const handler = await listHandler(db);
        await handler(makeReq({ status: { $ne: 'active' } }));

        // Sanitized to {}, so the handler takes the getAll path — the operator is gone.
        expect(db.searchArgs).toHaveLength(0);
        expect(db.getAllCalls).toBe(1);
    });

    it('passes only the flat scalar field, dropping a $where sibling', async () => {
        const db = new SpyAdapter();
        const handler = await listHandler(db);
        await handler(makeReq({ status: 'active', $where: 'sleep(1000)' }));

        expect(db.searchArgs).toHaveLength(1);
        expect(db.searchArgs[0]).toEqual({ status: 'active' });
        expect(db.searchArgs[0]).not.toHaveProperty('$where');
    });
});
