import { describe, it, expect, beforeEach } from 'vitest';
import { createContainer, asValue } from 'awilix';
import type {
    IConfigProvider,
    IDatabaseAdapter,
    ITransport,
    JsonRequest,
    JsonResponse,
    RouteDefinition,
} from '@json-express/core';
import { JsonExpressKernel, ConsoleLogger, createJwtVerifier } from '@json-express/core';
import { MemoryDatabaseAdapter } from '@json-express/adapter-memory';
import { IdentityPlugin } from '../src/index';

const SECRET = 'flow-test-secret';

class FakeTransport implements ITransport {
    public routes = new Map<string, RouteDefinition>();
    public registerRoute(route: RouteDefinition): void {
        this.routes.set(`${route.method} ${route.path}`, route);
    }
    public async start(): Promise<void> {}
    public async stop(): Promise<void> {}

    public async invoke(method: string, path: string, body: any = {}): Promise<JsonResponse> {
        const route = this.routes.get(`${method} ${path}`);
        if (!route) throw new Error(`No route ${method} ${path}`);
        const req: JsonRequest = { method, path, body, query: {}, params: {}, headers: {} };
        return route.handler(req);
    }
}

function makeConfig(overrides: Record<string, any> = {}): IConfigProvider {
    const store: Record<string, any> = {
        'auth.secret': SECRET,
        ...overrides,
    };
    return {
        get: (k, d) => (k in store ? store[k] : d) as any,
        has: (k) => k in store,
        set: (k, v) => { store[k] = v; },
    };
}

interface Harness {
    plugin: IdentityPlugin;
    kernel: JsonExpressKernel;
    config: IConfigProvider;
    db: IDatabaseAdapter;
    transport: FakeTransport;
}

async function bootHarness(configOverrides: Record<string, any> = {}): Promise<Harness> {
    const kernel = new JsonExpressKernel();
    const config = makeConfig(configOverrides);
    const db = new MemoryDatabaseAdapter({ logger: new ConsoleLogger({ silent: true } as any) });
    const transport = new FakeTransport();

    kernel.registerConfigProvider(config);
    kernel.registerDatabase(db);
    kernel.registerTransport(transport);
    // The peer-dep check looks for 'middleware:auth' — register a stub.
    kernel.container.register({
        'middleware:auth': asValue({ name: 'auth', handle: async (_r: any, n: any) => n() }),
    });

    const plugin = new IdentityPlugin({ configProvider: config });
    await plugin.onBoot(kernel, config);

    return { plugin, kernel, config, db, transport };
}

describe('IdentityPlugin — provideSchemas', () => {
    it('contributes users, roles, refreshTokens, emailVerificationTokens, passwordResetTokens', () => {
        const plugin = new IdentityPlugin({});
        const names = plugin.provideSchemas().map(s => s.name);
        expect(names).toEqual([
            'users',
            'roles',
            'refreshTokens',
            'emailVerificationTokens',
            'passwordResetTokens',
        ]);
    });
});

describe('IdentityPlugin — peer-dep + config errors', () => {
    it('throws when middleware-auth is not registered', async () => {
        const kernel = new JsonExpressKernel();
        const config = makeConfig();
        kernel.registerDatabase(new MemoryDatabaseAdapter({}));
        kernel.registerTransport(new FakeTransport());
        const plugin = new IdentityPlugin({ configProvider: config });
        await expect(plugin.onBoot(kernel, config)).rejects.toThrow(/middleware-auth/);
    });

    it('throws when auth.secret is unset', async () => {
        const kernel = new JsonExpressKernel();
        kernel.registerDatabase(new MemoryDatabaseAdapter({}));
        kernel.registerTransport(new FakeTransport());
        kernel.container.register({
            'middleware:auth': asValue({ name: 'auth', handle: async (_r: any, n: any) => n() }),
        });
        const config: IConfigProvider = {
            get: (_k, d) => d as any,
            has: () => false,
            set: () => {},
        };
        const plugin = new IdentityPlugin({ configProvider: config });
        await expect(plugin.onBoot(kernel, config)).rejects.toThrow(/JEX__AUTH__SECRET/);
    });
});

describe('IdentityPlugin — admin auto-seed', () => {
    it('seeds admin@local on first boot when users is empty', async () => {
        const { db } = await bootHarness();
        const users = await db.getAll('users');
        expect(users).toHaveLength(1);
        expect(users[0].email).toBe('admin@local');
        expect(users[0].role).toBe('admin');
        expect(users[0].passwordHash).toMatch(/^\$argon2/);
    });

    it('is idempotent — does not seed when users already populated', async () => {
        const { db, plugin, kernel, config } = await bootHarness();
        const beforeCount = (await db.getAll('users')).length;
        // simulate a re-boot (e.g. process restart)
        await plugin.onBoot(kernel, config);
        const afterCount = (await db.getAll('users')).length;
        expect(afterCount).toBe(beforeCount);
    });
});

describe('IdentityPlugin — registration', () => {
    let harness: Harness;
    beforeEach(async () => { harness = await bootHarness(); });

    it('rejects requests missing email/password with 400', async () => {
        const res = await harness.transport.invoke('POST', '/auth/register', {});
        expect(res.statusCode).toBe(400);
    });

    it('rejects passwords shorter than 8 chars', async () => {
        const res = await harness.transport.invoke('POST', '/auth/register', { email: 'a@b.c', password: 'short' });
        expect(res.statusCode).toBe(400);
    });

    it('creates a user and returns issued tokens', async () => {
        const res = await harness.transport.invoke('POST', '/auth/register', {
            email: 'alice@example.com',
            password: 'correct horse battery staple',
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.accessToken).toBeTypeOf('string');
        expect(res.body.refreshToken).toBeTypeOf('string');
        expect(res.body.user.email).toBe('alice@example.com');
        expect(res.body.user.role).toBe('user');

        // Verify the access token through the canonical core verifier
        const verify = createJwtVerifier({ secret: SECRET });
        const decoded = JSON.parse((await verify(`Bearer ${res.body.accessToken}`))!);
        expect(decoded.email).toBe('alice@example.com');
        expect(decoded.role).toBe('user');
    });

    it('returns 409 on duplicate email', async () => {
        await harness.transport.invoke('POST', '/auth/register', {
            email: 'dup@example.com', password: 'abcd1234',
        });
        const res = await harness.transport.invoke('POST', '/auth/register', {
            email: 'dup@example.com', password: 'abcd1234',
        });
        expect(res.statusCode).toBe(409);
    });

    it('respects auth.allowRegistration=false', async () => {
        const closed = await bootHarness({ 'auth.allowRegistration': false });
        const res = await closed.transport.invoke('POST', '/auth/register', {
            email: 'x@y.z', password: 'abcd1234',
        });
        expect(res.statusCode).toBe(403);
    });
});

describe('IdentityPlugin — login', () => {
    it('returns 401 on unknown email (generic message)', async () => {
        const { transport } = await bootHarness();
        const res = await transport.invoke('POST', '/auth/login', {
            email: 'nobody@example.com', password: 'whatever12',
        });
        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid credentials' });
    });

    it('returns 401 on wrong password (same generic message — no enumeration)', async () => {
        const { transport } = await bootHarness();
        await transport.invoke('POST', '/auth/register', {
            email: 'eve@example.com', password: 'right-password-12',
        });
        const res = await transport.invoke('POST', '/auth/login', {
            email: 'eve@example.com', password: 'wrong-password-12',
        });
        expect(res.statusCode).toBe(401);
        expect(res.body).toEqual({ error: 'Invalid credentials' });
    });

    it('returns tokens on valid credentials', async () => {
        const { transport } = await bootHarness();
        await transport.invoke('POST', '/auth/register', {
            email: 'bob@example.com', password: 'good-password-12',
        });
        const res = await transport.invoke('POST', '/auth/login', {
            email: 'bob@example.com', password: 'good-password-12',
        });
        expect(res.statusCode).toBe(200);
        expect(res.body.accessToken).toBeTypeOf('string');
        expect(res.body.refreshToken).toBeTypeOf('string');
    });
});

describe('IdentityPlugin — refresh', () => {
    it('rotates: old refresh token becomes invalid after first use', async () => {
        const { transport } = await bootHarness();
        const reg = await transport.invoke('POST', '/auth/register', {
            email: 'carol@example.com', password: 'password-1234',
        });
        const original = reg.body.refreshToken;

        const r1 = await transport.invoke('POST', '/auth/refresh', { refreshToken: original });
        expect(r1.statusCode).toBe(200);
        expect(r1.body.refreshToken).not.toBe(original);

        const r2 = await transport.invoke('POST', '/auth/refresh', { refreshToken: original });
        expect(r2.statusCode).toBe(401);
    });

    it('rejects unknown tokens', async () => {
        const { transport } = await bootHarness();
        const res = await transport.invoke('POST', '/auth/refresh', { refreshToken: 'totally-fake' });
        expect(res.statusCode).toBe(401);
    });

    it('rejects expired tokens', async () => {
        const { transport, db } = await bootHarness({ 'auth.refreshTtl': '1ms' });
        const reg = await transport.invoke('POST', '/auth/register', {
            email: 'dan@example.com', password: 'password-1234',
        });
        // Force-expire by mutating the stored row (simpler than waiting).
        const stored = (await db.search('refreshTokens', { userId: String(reg.body.user.id) }))[0];
        await db.update('refreshTokens', String(stored.id), {
            expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        const res = await transport.invoke('POST', '/auth/refresh', { refreshToken: reg.body.refreshToken });
        expect(res.statusCode).toBe(401);
    });
});

describe('IdentityPlugin — logout', () => {
    it('revokes the refresh token; subsequent refresh fails', async () => {
        const { transport } = await bootHarness();
        const reg = await transport.invoke('POST', '/auth/register', {
            email: 'erin@example.com', password: 'password-1234',
        });
        const out = await transport.invoke('POST', '/auth/logout', { refreshToken: reg.body.refreshToken });
        expect(out.statusCode).toBe(200);
        const after = await transport.invoke('POST', '/auth/refresh', { refreshToken: reg.body.refreshToken });
        expect(after.statusCode).toBe(401);
    });

    it('is idempotent — returns 200 even for unknown tokens (no enumeration)', async () => {
        const { transport } = await bootHarness();
        const res = await transport.invoke('POST', '/auth/logout', { refreshToken: 'totally-fake' });
        expect(res.statusCode).toBe(200);
    });
});
