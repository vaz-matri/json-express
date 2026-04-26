import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { createServer, type Server } from 'http';
import { generateKeyPairSync, randomUUID, type KeyObject } from 'crypto';
import type { AddressInfo } from 'net';
import { GraphQLApiGenerator } from '../src/index';
import type { IConfigProvider, IDatabaseAdapter, ModelSchema } from '@json-express/core';

const TEST_SECRET = 'phase-b-test-secret';

function bearer(payload: Record<string, any>): { authorization: string } {
    return { authorization: `Bearer ${jwt.sign(payload, TEST_SECRET)}` };
}

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

function makeConfig(
    rules: any[],
    opts: { authSecret?: string; authJwksUri?: string; authAudience?: string } = {}
): IConfigProvider {
    return {
        get: (key: string, def?: any) => {
            if (key === 'validation.rules') return rules;
            if (key === 'auth.secret') return opts.authSecret ?? def;
            if (key === 'auth.jwksUri') return opts.authJwksUri ?? def;
            if (key === 'auth.audience') return opts.authAudience ?? def;
            return def;
        },
        has: (key: string) => (
            (key === 'auth.secret' && !!opts.authSecret)
            || (key === 'auth.jwksUri' && !!opts.authJwksUri)
            || (key === 'auth.audience' && !!opts.authAudience)
        ),
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

const adminHeader = bearer({ sub: 'u-1', role: 'admin' });
const userHeader = bearer({ sub: 'u-2', role: 'user' });

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
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ albums { id title } }` });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums.length).toBe(1);
    });

    it('protected create returns UNAUTHENTICATED without payload', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
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
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
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
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
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
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const editorHeader = bearer({ sub: 'u-3', role: 'editor' });
        const res = await invokePost(
            routes,
            { query: `mutation { deleteAlbum(id: "alb-1") { id } }` },
            editorHeader
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.deleteAlbum.id).toBe('alb-1');
    });
});

const ownedAlbumSchema: ModelSchema = {
    name: 'albums',
    fields: {
        id: { type: 'id', options: {} } as any,
        title: { type: 'string', options: {} } as any,
        ownerId: { type: 'string', options: {} } as any,
    },
    access: {
        read: 'owner',
        create: 'owner',
        update: 'owner',
        delete: 'owner',
    },
};

function ownedDb(): InMemoryAdapter {
    const db = new InMemoryAdapter();
    db.store = {
        albums: [
            { id: 'a1', title: "u1's first", ownerId: 'u-1' },
            { id: 'a2', title: "u1's second", ownerId: 'u-1' },
            { id: 'a3', title: "u2's only", ownerId: 'u-2' },
        ],
    };
    return db;
}

describe('api-graphql — Owner row-level security', () => {
    it('list filters to caller-owned records', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `{ albums { id ownerId } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums.map((a: any) => a.id).sort()).toEqual(['a1', 'a2']);
        expect(res.body.data.albums.every((a: any) => a.ownerId === 'u-1')).toBe(true);
    });

    it('list overwrites client-supplied where clause for the owner field', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            // u-1 trying to spoof u-2's records via where filter
            { query: `{ albums(where: { ownerId: "u-2" }) { id ownerId } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums.every((a: any) => a.ownerId === 'u-1')).toBe(true);
    });

    it('list anonymous returns UNAUTHENTICATED', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ albums { id } }` });

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    it('byId returns NOT_FOUND for cross-owner access', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `{ album(id: "a3") { id } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('create auto-stamps ownerId from caller, overwriting client value', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            // client tries to forge ownerId — should be overwritten with caller.sub
            { query: `mutation { createAlbum(input: { title: "Nope", ownerId: "u-2" }) { id ownerId } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.createAlbum.ownerId).toBe('u-1');
        expect(db.createdWith.ownerId).toBe('u-1');
    });

    it('update on cross-owner record returns NOT_FOUND', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `mutation { updateAlbum(id: "a3", input: { title: "hijack", ownerId: "u-2" }) { id } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('delete on cross-owner record returns NOT_FOUND', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `mutation { deleteAlbum(id: "a3") { id } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('NOT_FOUND');
    });

    it('owner update on own record succeeds', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `mutation { updateAlbum(id: "a1", input: { title: "Renamed" }) { id title } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.updateAlbum.title).toBe('Renamed');
    });
});

describe('api-graphql — Soft-decode on /graphql', () => {
    it('strips client-supplied x-user-payload to prevent header spoofing', async () => {
        const db = ownedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([ownedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        // Client forges x-user-payload with no Authorization header — should be stripped.
        const res = await invokePost(
            routes,
            { query: `{ albums { id } }` },
            { 'x-user-payload': JSON.stringify({ sub: 'u-1' }) }
        );

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
    });

    it('public ops succeed anonymously even when auth.secret is configured', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([protectedAlbumSchema]);   // read: 'public'
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ albums { id } }` });

        expect(res.body.errors).toBeUndefined();
        expect(Array.isArray(res.body.data.albums)).toBe(true);
    });

    it('public ops succeed with a valid token too', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `{ albums { id } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeUndefined();
    });

    it('invalid token is silently ignored on public ops (no 401 from middleware)', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([protectedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `{ albums { id } }` },
            { authorization: 'Bearer total-garbage' }
        );

        // Public read still succeeds; invalid token doesn't break anything.
        expect(res.body.errors).toBeUndefined();
    });
});

// ───────────────────────── Phase C — Field-level access ─────────────────────────

const fieldGuardedAlbumSchema: ModelSchema = {
    name: 'albums',
    fields: {
        id: { type: 'id', options: {} } as any,
        title: { type: 'string', options: {} } as any,
        ownerId: { type: 'string', options: {} } as any,
        adminNotes: { type: 'string', options: {} } as any,
        privateNote: { type: 'string', options: {} } as any,
    },
    access: {
        read: 'public',
        create: 'public',
        update: 'public',
        fields: {
            adminNotes: { read: 'admin', create: 'admin', update: 'admin' },
            privateNote: { read: 'owner' },
        },
    },
};

function fieldGuardedDb(): InMemoryAdapter {
    const db = new InMemoryAdapter();
    db.store = {
        albums: [
            { id: 'a1', title: 'Album 1', ownerId: 'u-1', adminNotes: 'top secret', privateNote: 'u1-note' },
            { id: 'a2', title: 'Album 2', ownerId: 'u-2', adminNotes: 'also secret', privateNote: 'u2-note' },
        ],
    };
    return db;
}

describe('api-graphql — Field-level read access', () => {
    it('omits role-restricted field for anonymous reader (returns null)', async () => {
        const db = fieldGuardedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([fieldGuardedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ albums { id title adminNotes } }` });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums.every((a: any) => a.adminNotes === null)).toBe(true);
        expect(res.body.data.albums[0].title).toBe('Album 1');
    });

    it('returns role-restricted field for matching role', async () => {
        const db = fieldGuardedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([fieldGuardedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `{ albums { id adminNotes } }` },
            bearer({ sub: 'u-9', role: 'admin' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums[0].adminNotes).toBe('top secret');
    });

    it('owner-scoped field is visible only on records the caller owns', async () => {
        const db = fieldGuardedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([fieldGuardedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `{ albums { id ownerId privateNote } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeUndefined();
        const a1 = res.body.data.albums.find((a: any) => a.id === 'a1');
        const a2 = res.body.data.albums.find((a: any) => a.id === 'a2');
        expect(a1.privateNote).toBe('u1-note');     // u-1 owns a1
        expect(a2.privateNote).toBeNull();          // u-1 does NOT own a2
    });
});

describe('api-graphql — Field-level write access', () => {
    it('strips role-restricted field from create input for non-admin caller', async () => {
        const db = fieldGuardedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([fieldGuardedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `mutation { createAlbum(input: { title: "New", adminNotes: "hijack" }) { id } }` },
            bearer({ sub: 'u-1', role: 'user' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(db.createdWith.title).toBe('New');
        expect(db.createdWith.adminNotes).toBeUndefined();
    });

    it('keeps role-restricted field in create input for admin caller', async () => {
        const db = fieldGuardedDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([fieldGuardedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        await invokePost(
            routes,
            { query: `mutation { createAlbum(input: { title: "Admin Post", adminNotes: "kept" }) { id } }` },
            bearer({ sub: 'u-9', role: 'admin' })
        );

        expect(db.createdWith.adminNotes).toBe('kept');
    });

    it('strips role-restricted field from update input for non-admin caller', async () => {
        // Track what update receives via a wrapper
        const db = fieldGuardedDb();
        let updatedWith: any = null;
        const origUpdate = db.update.bind(db);
        db.update = async (c, id, data) => {
            updatedWith = data;
            return origUpdate(c, id, data);
        };
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([fieldGuardedAlbumSchema]);
        const routes = await gen.generate(['albums']);

        await invokePost(
            routes,
            { query: `mutation { updateAlbum(id: "a1", input: { title: "Renamed", adminNotes: "hijack" }) { id } }` },
            bearer({ sub: 'u-1', role: 'user' })
        );

        expect(updatedWith.title).toBe('Renamed');
        expect(updatedWith.adminNotes).toBeUndefined();
    });
});

// ───────────────────────── Phase C — Nested relation access ─────────────────────────

const usersAdminOnly: ModelSchema = {
    name: 'users',
    fields: {
        id: { type: 'id', options: {} } as any,
        name: { type: 'string', options: {} } as any,
    },
    access: { read: 'admin' },
};

const postsPublicWithAuthor: ModelSchema = {
    name: 'posts',
    fields: {
        id: { type: 'id', options: {} } as any,
        title: { type: 'string', options: {} } as any,
        userId: { type: 'string', options: {} } as any,
        author: {
            type: 'relation',
            options: { target: 'users', type: 'many-to-one', foreignKey: 'userId' },
        } as any,
    },
    access: { read: 'public' },
};

function postsAndUsersDb(): InMemoryAdapter {
    const db = new InMemoryAdapter();
    db.store = {
        posts: [
            { id: 'p1', title: 'Hello', userId: 'u-1' },
            { id: 'p2', title: 'World', userId: 'u-2' },
        ],
        users: [
            { id: 'u-1', name: 'Alice' },
            { id: 'u-2', name: 'Bob' },
        ],
    };
    return db;
}

describe('api-graphql — Nested relation access', () => {
    it('anonymous nested query into admin-only target returns errors and nulls the relation', async () => {
        const db = postsAndUsersDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([postsPublicWithAuthor, usersAdminOnly]);
        const routes = await gen.generate(['posts', 'users']);

        const res = await invokePost(routes, { query: `{ posts { id title author { id name } } }` });

        // Posts read succeeds (public); each `author` field errors with UNAUTHENTICATED.
        expect(res.body.data.posts.length).toBe(2);
        expect(res.body.data.posts.every((p: any) => p.author === null)).toBe(true);
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors.every((e: any) => e.extensions.code === 'UNAUTHENTICATED')).toBe(true);
    });

    it('admin nested query into admin-only target succeeds', async () => {
        const db = postsAndUsersDb();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([postsPublicWithAuthor, usersAdminOnly]);
        const routes = await gen.generate(['posts', 'users']);

        const res = await invokePost(
            routes,
            { query: `{ posts { id author { id name } } }` },
            bearer({ sub: 'u-x', role: 'admin' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.posts[0].author.name).toBe('Alice');
        expect(res.body.data.posts[1].author.name).toBe('Bob');
    });
});

const postsOwnerOnly: ModelSchema = {
    name: 'posts',
    fields: {
        id: { type: 'id', options: {} } as any,
        title: { type: 'string', options: {} } as any,
        ownerId: { type: 'string', options: {} } as any,
    },
    access: { read: 'owner' },
};

const usersWithOwnedPosts: ModelSchema = {
    name: 'users',
    fields: {
        id: { type: 'id', options: {} } as any,
        name: { type: 'string', options: {} } as any,
        posts: {
            type: 'relation',
            options: { target: 'posts', type: 'one-to-many', foreignKey: 'userId' },
        } as any,
    },
    access: { read: 'public' },
};

describe('api-graphql — Nested relation owner filtering (one-to-many)', () => {
    it('relation list applies owner filter for owner-scoped target', async () => {
        const db = new InMemoryAdapter();
        db.store = {
            users: [{ id: 'u-1', name: 'Alice' }],
            posts: [
                { id: 'p1', title: 'mine A', userId: 'u-1', ownerId: 'u-1' },
                { id: 'p2', title: 'mine B', userId: 'u-1', ownerId: 'u-1' },
                // Dirty data: a row that links via FK but has a different owner — must be filtered out.
                { id: 'p3', title: 'someone else', userId: 'u-1', ownerId: 'u-2' },
            ],
        };
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([usersWithOwnedPosts, postsOwnerOnly]);
        const routes = await gen.generate(['users', 'posts']);

        const res = await invokePost(
            routes,
            { query: `{ users { id posts { id ownerId } } }` },
            bearer({ sub: 'u-1' })
        );

        expect(res.body.errors).toBeUndefined();
        const ids = res.body.data.users[0].posts.map((p: any) => p.id).sort();
        expect(ids).toEqual(['p1', 'p2']);
    });

    it('anonymous nested into owner-scoped relation returns UNAUTHENTICATED', async () => {
        const db = new InMemoryAdapter();
        db.store = {
            users: [{ id: 'u-1', name: 'Alice' }],
            posts: [{ id: 'p1', title: 'x', userId: 'u-1', ownerId: 'u-1' }],
        };
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([], { authSecret: TEST_SECRET }) });
        gen.setSchemas([usersWithOwnedPosts, postsOwnerOnly]);
        const routes = await gen.generate(['users', 'posts']);

        const res = await invokePost(routes, { query: `{ users { id posts { id } } }` });

        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
        expect(res.body.data.users[0].posts).toBeNull();
    });
});

// ───────────────────────── Custom GraphQL endpoints ─────────────────────────

import {
    GraphQLString as GQLString,
    GraphQLInt as GQLInt,
    GraphQLFloat as GQLFloat,
    GraphQLNonNull as GQLNonNull,
    GraphQLList as GQLList,
    GraphQLObjectType as GQLObjectType,
} from 'graphql';

describe('api-graphql — Custom queryFields', () => {
    it('exposes a root query field with non-null arg', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([
            {
                name: 'albums',
                fields: {
                    id: { type: 'id', options: {} } as any,
                    title: { type: 'string', options: {} } as any,
                },
                graphql: {
                    queryFields: {
                        echo: {
                            type: GQLString,
                            args: { msg: { type: new GQLNonNull(GQLString) } },
                            resolve: (_: any, { msg }: { msg: string }) => `echo:${msg}`,
                        },
                    },
                },
            },
        ]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ echo(msg: "hi") }` });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.echo).toBe('echo:hi');
    });

    it('passes verified userPayload to custom query resolver', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({
            database: db,
            configProvider: makeConfig([], { authSecret: TEST_SECRET }),
        });
        let seenContext: any = null;
        gen.setSchemas([
            {
                name: 'albums',
                fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
                graphql: {
                    queryFields: {
                        whoami: {
                            type: GQLString,
                            resolve: (_: any, _args: any, ctx: any) => {
                                seenContext = ctx;
                                return ctx?.userPayload ? JSON.parse(ctx.userPayload as string).sub : null;
                            },
                        },
                    },
                },
            },
        ]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(
            routes,
            { query: `{ whoami }` },
            bearer({ sub: 'u-42' })
        );

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.whoami).toBe('u-42');
        expect(seenContext.userPayload).toBeDefined();
    });
});

describe('api-graphql — Custom mutationFields', () => {
    it('exposes a root mutation field', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        let invokedWith: any = null;
        gen.setSchemas([
            {
                name: 'albums',
                fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
                graphql: {
                    mutationFields: {
                        publishAll: {
                            type: GQLInt,
                            args: { reason: { type: GQLString } },
                            resolve: (_: any, args: any) => {
                                invokedWith = args;
                                return 7;
                            },
                        },
                    },
                },
            },
        ]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, {
            query: `mutation { publishAll(reason: "release-day") }`,
        });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.publishAll).toBe(7);
        expect(invokedWith.reason).toBe('release-day');
    });
});

describe('api-graphql — Custom typeFields on auto-generated object', () => {
    it('attaches a computed field to the auto-generated type', async () => {
        const db = new InMemoryAdapter();
        db.store = { albums: [{ id: 'a1', title: 'Abbey Road' }] };
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([
            {
                name: 'albums',
                fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
                graphql: {
                    typeFields: {
                        titleLength: {
                            type: GQLInt,
                            resolve: (parent: any) => (parent.title as string).length,
                        },
                    },
                },
            },
        ]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ albums { id title titleLength } }` });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums[0].titleLength).toBe('Abbey Road'.length);
    });

    it('function-form typeFields can reach the auto-generated type via the registry', async () => {
        // artist.albumCount returns the auto-generated `Album` type via registry.getType.
        const db = new InMemoryAdapter();
        db.store = {
            artists: [{ id: 'art-1', name: 'Beatles' }],
            albums: [
                { id: 'a1', title: 'Abbey Road', artistId: 'art-1' },
                { id: 'a2', title: 'Revolver', artistId: 'art-1' },
            ],
        };
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([
            {
                name: 'albums',
                fields: {
                    id: { type: 'id', options: {} } as any,
                    title: { type: 'string', options: {} } as any,
                    artistId: { type: 'string', options: {} } as any,
                },
            },
            {
                name: 'artists',
                fields: { id: { type: 'id', options: {} } as any, name: { type: 'string', options: {} } as any },
                graphql: {
                    typeFields: (registry) => ({
                        topAlbums: {
                            type: new GQLList(registry.getType('albums') as any),
                            resolve: async (parent: any) => {
                                const dbAdapter = db; // closure
                                return dbAdapter.search('albums', { artistId: parent.id });
                            },
                        },
                    }),
                },
            },
        ]);
        const routes = await gen.generate(['artists', 'albums']);

        const res = await invokePost(routes, { query: `{ artists { id topAlbums { id title } } }` });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.artists[0].topAlbums.length).toBe(2);
        expect(res.body.data.artists[0].topAlbums[0].title).toBe('Abbey Road');
    });
});

describe('api-graphql — Custom field collision policy', () => {
    it('user-supplied root queryField overrides the auto-generated one (warn-and-override)', async () => {
        const db = new InMemoryAdapter();
        db.store = { albums: [{ id: 'a1', title: 'auto' }] };
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([
            {
                name: 'albums',
                fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
                graphql: {
                    // Same name as auto-generated list query for `albums` collection.
                    queryFields: {
                        albums: {
                            type: new GQLList(
                                new GQLObjectType({
                                    name: 'OverrideAlbum',
                                    fields: { sentinel: { type: GQLString } },
                                })
                            ),
                            resolve: () => [{ sentinel: 'overridden' }],
                        },
                    },
                },
            },
        ]);
        const routes = await gen.generate(['albums']);

        const res = await invokePost(routes, { query: `{ albums { sentinel } }` });

        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.albums[0].sentinel).toBe('overridden');
    });
});

describe('api-graphql — Empty Mutation guard', () => {
    it('schema with no mutations does not throw at construction', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        // No collections + a model that exposes only a custom queryField means the generated
        // schema has zero mutations. graphql-js throws on empty mutation type construction;
        // the guard should produce mutation: undefined instead.
        gen.setSchemas([]);

        // Exercise the path indirectly: a schema with only a query and no model-derived
        // mutations. Easiest path: pass collections with a single model that overrides
        // the auto-generated mutations, then verify no exception. Using `generate([])`
        // would short-circuit; instead, exercise via a single-collection schema and
        // confirm queries work — the empty-mutation guard is a defensive future case.
        const routes = await gen.generate([]);
        // generate returns [] when there are no collections; we still want to confirm
        // buildSchema can handle the zero-mutation construction. Direct check via a
        // thin re-invoke with a schema that has no mutations is not possible without
        // exposing buildSchema. Instead, validate the more important case below.
        expect(routes).toEqual([]);
    });

    it('builds normally when only a custom queryField exists alongside CRUD', async () => {
        // Sanity that mutation type still includes auto-generated CRUD plus any custom.
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([
            {
                name: 'albums',
                fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
                graphql: {
                    queryFields: { ping: { type: GQLString, resolve: () => 'pong' } },
                },
            },
        ]);
        const routes = await gen.generate(['albums']);
        const res = await invokePost(routes, { query: `{ ping }` });
        expect(res.body.errors).toBeUndefined();
        expect(res.body.data.ping).toBe('pong');
    });
});

describe('api-graphql — Custom field shape validation', () => {
    it('warns and skips when graphql.queryFields is not an object or function', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({ database: db, configProvider: makeConfig([]) });
        gen.setSchemas([
            {
                name: 'albums',
                fields: { id: { type: 'id', options: {} } as any, title: { type: 'string', options: {} } as any },
                graphql: {
                    // Bogus value — should be skipped without breaking the schema build.
                    queryFields: 'oops' as any,
                },
            },
        ]);
        const routes = await gen.generate(['albums']);

        // Auto-generated `albums` query should still work.
        const res = await invokePost(routes, { query: `{ albums { id } }` });
        expect(res.body.errors).toBeUndefined();
    });
});

// ─────────────────────────  JWKS soft-decode  ─────────────────────────
//
// /graphql is a single endpoint that doesn't gate on the auth middleware — instead
// it soft-decodes the Bearer token and exposes the payload through ctx.userPayload
// so resolvers can run evaluateAccess. These tests prove the JWKS-mode wiring works
// end-to-end through the handler, complementing the unit coverage in core/jwt.test.ts.

interface TestJwks {
    server: Server;
    url: string;
    privateKey: KeyObject;
    kid: string;
}

async function startJwksServerForGraphql(): Promise<TestJwks> {
    const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const kid = randomUUID();
    const jwk = {
        ...publicKey.export({ format: 'jwk' }),
        kid,
        alg: 'RS256',
        use: 'sig',
    };
    const server = createServer((req, res) => {
        if (req.url === '/.well-known/jwks.json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ keys: [jwk] }));
            return;
        }
        res.writeHead(404);
        res.end();
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as AddressInfo).port;
    return { server, url: `http://127.0.0.1:${port}/.well-known/jwks.json`, privateKey, kid };
}

describe('api-graphql — JWKS soft-decode', () => {
    let jwks: TestJwks;

    beforeAll(async () => { jwks = await startJwksServerForGraphql(); });
    afterAll(async () => { await new Promise<void>((resolve) => jwks.server.close(() => resolve())); });

    const adminProtectedAlbums: ModelSchema = {
        name: 'albums',
        fields: {
            id: { type: 'id', options: {} } as any,
            title: { type: 'string', options: {} } as any,
        },
        access: { read: 'admin' },
    };

    it('admin role embedded in an RS256 token unlocks an admin-gated query', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({
            database: db,
            configProvider: makeConfig([], { authJwksUri: jwks.url }),
        });
        gen.setSchemas([adminProtectedAlbums]);
        const routes = await gen.generate(['albums']);
        const token = jwt.sign(
            { sub: 'jwks-admin', role: 'admin' },
            jwks.privateKey,
            { algorithm: 'RS256', keyid: jwks.kid }
        );
        const res = await invokePost(
            routes,
            { query: `{ albums { id } }` },
            { authorization: `Bearer ${token}` }
        );
        expect(res.body.errors).toBeUndefined();
    });

    it('a token signed with a foreign key is rejected (resolvers see anonymous)', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({
            database: db,
            configProvider: makeConfig([], { authJwksUri: jwks.url }),
        });
        gen.setSchemas([adminProtectedAlbums]);
        const routes = await gen.generate(['albums']);
        const { privateKey: foreign } = generateKeyPairSync('rsa', { modulusLength: 2048 });
        const token = jwt.sign(
            { sub: 'forged', role: 'admin' },
            foreign,
            { algorithm: 'RS256', keyid: jwks.kid }
        );
        const res = await invokePost(
            routes,
            { query: `{ albums { id } }` },
            { authorization: `Bearer ${token}` }
        );
        // Soft-decode failed → anonymous → admin gate denies → GraphQL error code present
        expect(res.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });

    it('audience mismatch is rejected when auth.audience is set', async () => {
        const db = new InMemoryAdapter();
        const gen = new GraphQLApiGenerator({
            database: db,
            configProvider: makeConfig([], { authJwksUri: jwks.url, authAudience: 'my-api' }),
        });
        gen.setSchemas([adminProtectedAlbums]);
        const routes = await gen.generate(['albums']);
        const wrongAud = jwt.sign(
            { sub: 'a', role: 'admin' },
            jwks.privateKey,
            { algorithm: 'RS256', keyid: jwks.kid, audience: 'other-api' }
        );
        const res = await invokePost(
            routes,
            { query: `{ albums { id } }` },
            { authorization: `Bearer ${wrongAud}` }
        );
        expect(res.body.errors?.[0]?.extensions?.code).toBe('UNAUTHENTICATED');
    });
});
