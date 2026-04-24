import { describe, it, expect } from 'vitest';
import { GraphQLApiGenerator } from '../src/index';
import type { IConfigProvider, IDatabaseAdapter, ModelSchema } from '@json-express/core';

// Minimal duck-typed "Zod-like" schema that always fails with a shaped error.
// api-graphql only requires { safeParse } — it does not import zod directly.
const failingSchema = {
    safeParse: (input: any) => ({
        success: false,
        error: { format: () => ({ _errors: ['title too short'] }) },
    }),
};

const passingSchema = {
    safeParse: (input: any) => ({ success: true, data: { ...input, normalized: true } }),
};

function makeConfig(rules: any[]): IConfigProvider {
    return {
        get: (key: string, def?: any) => (key === 'validation.rules' ? rules : def),
        has: () => false,
        set: () => {},
    };
}

class InMemoryAdapter implements IDatabaseAdapter {
    store: Record<string, any[]> = { albums: [{ id: 'alb-1', title: 'Abbey Road' }] };
    createdWith: any = null;
    async getAll(c: string) { return this.store[c] ?? []; }
    async getById(c: string, id: string) {
        const item = (this.store[c] ?? []).find((x) => String(x.id) === String(id));
        if (!item) throw new Error(`Not found: ${id}`);
        return item;
    }
    async search(c: string, q: Record<string, any>) {
        return (this.store[c] ?? []).filter((it) =>
            Object.entries(q).every(([k, v]) => String(it[k]) === String(v))
        );
    }
    async create(c: string, data: any) {
        this.createdWith = data;
        const item = { id: 'new-id', ...data };
        (this.store[c] ??= []).push(item);
        return item;
    }
    async update(c: string, id: string, data: any) {
        const item = await this.getById(c, id);
        return { ...item, ...data };
    }
    async delete(c: string, id: string) {
        const item = await this.getById(c, id);
        this.store[c] = this.store[c].filter((x) => x.id !== id);
        return item;
    }
    async isHealthy() { return true; }
}

const albumSchema: ModelSchema = {
    name: 'albums',
    fields: {
        id: { type: 'id', options: {} } as any,
        title: { type: 'string', options: { required: true } } as any,
        artistId: { type: 'string', options: {} } as any,
    },
};

async function invokePost(routes: any[], body: any, headers: Record<string, any> = {}) {
    const route = routes.find((r) => r.method === 'POST');
    return route.handler({ body, method: 'POST', path: route.path, query: {}, params: {}, headers });
}

const adminHeader = { 'x-user-payload': JSON.stringify({ sub: 'u-1', role: 'admin' }) };
const userHeader = { 'x-user-payload': JSON.stringify({ sub: 'u-2', role: 'user' }) };

describe('api-graphql — validation.rules enforcement', () => {
    it('rejects create mutations whose input fails the matched Zod rule', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({
            database: db,
            configProvider: makeConfig([
                { method: 'POST', path: '/albums', body: failingSchema },
            ]),
        });
        gen.setSchemas([albumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, {
            query: `mutation { createAlbum(input: { title: "ab", artistId: "art-1" }) { id } }`,
        });

        expect(res.statusCode).toBe(200);
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('BAD_USER_INPUT');
        expect(res.body.errors[0].extensions.details).toEqual({ _errors: ['title too short'] });
        expect(db.createdWith).toBeNull();
    });

    it('passes parsed.data (transformed input) to db.create when validation succeeds', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({
            database: db,
            configProvider: makeConfig([
                { method: 'POST', path: '/albums', body: passingSchema },
            ]),
        });
        gen.setSchemas([albumSchema]);
        const routes = await gen.generate(['albums']);

        await invokePost(routes, {
            query: `mutation { createAlbum(input: { title: "Kind of Blue", artistId: "art-3" }) { id } }`,
        });

        expect(db.createdWith).toMatchObject({
            title: 'Kind of Blue',
            artistId: 'art-3',
            normalized: true,
        });
    });

    it('skips validation when no rule matches the collection path', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({
            database: db,
            configProvider: makeConfig([
                { method: 'POST', path: '/other-collection', body: failingSchema },
            ]),
        });
        gen.setSchemas([albumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, {
            query: `mutation { createAlbum(input: { title: "x", artistId: "y" }) { id } }`,
        });

        expect(res.body.errors).toBeUndefined();
        expect(db.createdWith).not.toBeNull();
    });
});

describe('api-graphql — NOT_FOUND mapping', () => {
    it('update on missing id throws GraphQLError with code NOT_FOUND', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([albumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, {
            query: `mutation { updateAlbum(id: "ghost", input: { title: "x", artistId: "y" }) { id } }`,
        });

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('delete on missing id throws GraphQLError with code NOT_FOUND', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([albumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, {
            query: `mutation { deleteAlbum(id: "ghost") { id } }`,
        });

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });
});

const protectedAlbumSchema: ModelSchema = {
    name: 'albums',
    fields: {
        id: { type: 'id', options: {} } as any,
        title: { type: 'string', options: {} } as any,
        artistId: { type: 'string', options: {} } as any,
    },
    access: {
        read: 'public',
        create: 'admin',
        update: 'admin',
        delete: ['admin', 'editor'],
    },
};

describe('api-graphql — RBAC enforcement', () => {
    it('public read allows anonymous list query', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ albums { id title } }` });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums.length).toBe(1);
    });

    it('protected create returns UNAUTHENTICATED without payload', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, {
            query: `mutation { createAlbum(input: { title: "x", artistId: "y" }) { id } }`,
        });

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
        expect(db.createdWith).toBeNull();
    });

    it('protected create returns FORBIDDEN with non-matching role', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `mutation { createAlbum(input: { title: "x", artistId: "y" }) { id } }` },
            userHeader
        );

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('FORBIDDEN');
        expect(db.createdWith).toBeNull();
    });

    it('protected create succeeds with matching role', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `mutation { createAlbum(input: { title: "Kind of Blue", artistId: "art-3" }) { id title } }` },
            adminHeader
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.createAlbum.title).toBe('Kind of Blue');
    });

    it('array role rule allows any matching role (editor for delete)', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const editorHeader = { 'x-user-payload': JSON.stringify({ sub: 'u-3', role: 'editor' }) };
        const res = await invokePost(
            routes,
            { query: `mutation { deleteAlbum(id: "alb-1") { id } }` },
            editorHeader
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.deleteAlbum.id).toBe('alb-1');
    });
});
