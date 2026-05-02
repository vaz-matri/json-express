import { describe, it, expect, beforeEach } from 'vitest';
import { asValue } from 'awilix';
import type {
    IConfigProvider,
    IDatabaseAdapter,
    IEmailProvider,
    IKvStore,
    ITransport,
    EmailMessage,
    JsonRequest,
    JsonResponse,
    RouteDefinition,
} from '@json-express/core';
import { JsonExpressKernel } from '@json-express/core';
import { ConsoleLogger } from '@json-express/logger-console';
import { MemoryDatabaseAdapter } from '@json-express/adapter-memory';
import { MemoryKvStore } from '@json-express/kv-memory';
import { MemoryQueueAdapter } from '@json-express/queue-memory';
import { IdentityPlugin, signAccessToken } from '../src/index';
import { hashRandomToken } from '../src/crypto';

const SECRET = 'email-flow-test-secret';

class RecordingEmailProvider implements IEmailProvider {
    public sent: EmailMessage[] = [];
    public async send(message: EmailMessage): Promise<void> {
        this.sent.push(message);
    }
}

class FakeTransport implements ITransport {
    public routes = new Map<string, RouteDefinition>();
    public registerRoute(route: RouteDefinition): void {
        this.routes.set(`${route.method} ${route.path}`, route);
    }
    public async start(): Promise<void> {}
    public async stop(): Promise<void> {}

    public async invoke(
        method: string,
        path: string,
        body: any = {},
        headers: Record<string, string> = {}
    ): Promise<JsonResponse> {
        const route = this.routes.get(`${method} ${path}`);
        if (!route) throw new Error(`No route ${method} ${path}`);
        const req: JsonRequest = { method, path, body, query: {}, params: {}, headers };
        return route.handler(req);
    }
}

function makeConfig(overrides: Record<string, any> = {}): IConfigProvider {
    const store: Record<string, any> = {
        'auth.secret': SECRET,
        'auth.email.appName': 'TestApp',
        'auth.email.verifyUrl': 'http://test.local/verify',
        'auth.email.resetUrl': 'http://test.local/reset',
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
    db: IDatabaseAdapter;
    kvStore: IKvStore;
    transport: FakeTransport;
    email: RecordingEmailProvider;
    config: IConfigProvider;
}

async function bootHarness(configOverrides: Record<string, any> = {}): Promise<Harness> {
    const kernel = new JsonExpressKernel();
    const config = makeConfig(configOverrides);
    const db = new MemoryDatabaseAdapter({ logger: new ConsoleLogger({ silent: true } as any) });
    const kvStore = new MemoryKvStore({ configProvider: config });
    const queue = new MemoryQueueAdapter({ configProvider: config });
    const transport = new FakeTransport();
    const email = new RecordingEmailProvider();

    kernel.registerConfigProvider(config);
    kernel.registerDatabase(db);
    kernel.registerKvStore(kvStore);
    kernel.registerQueue(queue);
    kernel.registerTransport(transport);
    kernel.registerEmailProvider(email);
    kernel.container.register({
        'middleware:auth': asValue({ name: 'auth', handle: async (_r: any, n: any) => n() }),
    });

    const plugin = new IdentityPlugin({ configProvider: config });
    await plugin.onBoot(kernel, config);

    return { plugin, db, kvStore, transport, email, config };
}

/** Pulls the `?token=<value>` out of the body of the most recent recorded email. */
function tokenFrom(message: EmailMessage): string {
    const body = message.text ?? message.html ?? '';
    const m = /[?&]token=([^&\s"<>]+)/.exec(body);
    if (!m) throw new Error(`No token found in email body: ${body}`);
    return decodeURIComponent(m[1]);
}

// ─────────────────────────  registration → verification  ─────────────────────────

describe('IdentityPlugin — registration sends verification email when provider present', () => {
    let h: Harness;
    beforeEach(async () => { h = await bootHarness(); });

    it('mounts /auth/verify and /auth/password/* when emailProvider is registered', () => {
        const paths = Array.from(h.transport.routes.keys());
        expect(paths).toContain('POST /auth/verify');
        expect(paths).toContain('POST /auth/verify/resend');
        expect(paths).toContain('POST /auth/password/forgot');
        expect(paths).toContain('POST /auth/password/reset');
        expect(paths).toContain('POST /auth/password/change');
    });

    it('sends verification email and stores a KV entry on register', async () => {
        const res = await h.transport.invoke('POST', '/auth/register', {
            email: 'alice@example.com',
            password: 'password-1234',
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.user.emailVerified).toBe(false);
        expect(h.email.sent).toHaveLength(1);
        const sent = h.email.sent[0];
        expect(sent.to).toBe('alice@example.com');
        expect(sent.subject).toContain('Verify');
        expect(sent.subject).toContain('TestApp');
        const token = tokenFrom(h.email.sent[0]);
        expect(await h.kvStore.get(`ev:${hashRandomToken(token)}`)).not.toBeNull();
    });

    it('verifies the email when /auth/verify consumes the token', async () => {
        const reg = await h.transport.invoke('POST', '/auth/register', {
            email: 'bob@example.com', password: 'password-1234',
        });
        const token = tokenFrom(h.email.sent[0]);

        const verify = await h.transport.invoke('POST', '/auth/verify', { token });
        expect(verify.statusCode).toBe(200);
        expect(verify.body.user.emailVerified).toBe(true);

        const user = await h.db.getById('users', reg.body.user.id);
        expect(user.emailVerified).toBe(true);
        // single-use: row deleted after consumption
        expect(await h.db.getAll('emailVerificationTokens')).toHaveLength(0);

        // double-use rejected
        const reuse = await h.transport.invoke('POST', '/auth/verify', { token });
        expect(reuse.statusCode).toBe(400);
    });

    it('rejects expired verification tokens', async () => {
        const h2 = await bootHarness({ 'auth.verifyTtl': '1ms' });
        const reg = await h2.transport.invoke('POST', '/auth/register', {
            email: 'carol@example.com', password: 'password-1234',
        });
        const stored = (await h2.db.search('emailVerificationTokens', { userId: String(reg.body.user.id) }))[0];
        await h2.db.update('emailVerificationTokens', String(stored.id), {
            expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        const token = tokenFrom(h2.email.sent[0]);
        const res = await h2.transport.invoke('POST', '/auth/verify', { token });
        expect(res.statusCode).toBe(400);
    });

    it('verify-resend issues a new token and emails it', async () => {
        await h.transport.invoke('POST', '/auth/register', {
            email: 'dan@example.com', password: 'password-1234',
        });
        const beforeCount = h.email.sent.length;
        const res = await h.transport.invoke('POST', '/auth/verify/resend', { email: 'dan@example.com' });
        expect(res.statusCode).toBe(200);
        expect(h.email.sent.length).toBe(beforeCount + 1);
    });

    it('verify-resend returns 200 even for unknown emails (no enumeration)', async () => {
        const before = h.email.sent.length;
        const res = await h.transport.invoke('POST', '/auth/verify/resend', { email: 'nobody@example.com' });
        expect(res.statusCode).toBe(200);
        expect(h.email.sent.length).toBe(before); // no email sent
    });
});

// ─────────────────────────  strict mode  ─────────────────────────

describe('IdentityPlugin — strict mode', () => {
    let h: Harness;
    beforeEach(async () => { h = await bootHarness({ 'auth.requireVerifiedEmail': true }); });

    it('register does not issue tokens in strict mode', async () => {
        const res = await h.transport.invoke('POST', '/auth/register', {
            email: 'erin@example.com', password: 'password-1234',
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.accessToken).toBeUndefined();
        expect(res.body.refreshToken).toBeUndefined();
        expect(res.body.message).toMatch(/verify/i);
    });

    it('login returns 403 until email is verified', async () => {
        await h.transport.invoke('POST', '/auth/register', {
            email: 'frank@example.com', password: 'password-1234',
        });
        const blocked = await h.transport.invoke('POST', '/auth/login', {
            email: 'frank@example.com', password: 'password-1234',
        });
        expect(blocked.statusCode).toBe(403);
        expect(blocked.body.error).toMatch(/verified/i);

        // Verify, then login succeeds
        const token = tokenFrom(h.email.sent[0]);
        await h.transport.invoke('POST', '/auth/verify', { token });
        const ok = await h.transport.invoke('POST', '/auth/login', {
            email: 'frank@example.com', password: 'password-1234',
        });
        expect(ok.statusCode).toBe(200);
        expect(ok.body.accessToken).toBeTypeOf('string');
    });
});

// ─────────────────────────  password reset  ─────────────────────────

describe('IdentityPlugin — password reset', () => {
    let h: Harness;
    beforeEach(async () => {
        h = await bootHarness();
        await h.transport.invoke('POST', '/auth/register', {
            email: 'gina@example.com', password: 'old-password-12',
        });
        // Drain the verification email so token-from helpers point at the reset email later.
        h.email.sent = [];
    });

    it('forgot-password sends a reset email and creates a token row', async () => {
        const res = await h.transport.invoke('POST', '/auth/password/forgot', { email: 'gina@example.com' });
        expect(res.statusCode).toBe(200);
        expect(h.email.sent).toHaveLength(1);
        expect(h.email.sent[0].subject).toContain('Reset');
        const tokens = await h.db.getAll('passwordResetTokens');
        expect(tokens).toHaveLength(1);
    });

    it('forgot-password is anti-enumeration: 200 + no email for unknown addresses', async () => {
        const res = await h.transport.invoke('POST', '/auth/password/forgot', { email: 'nobody@x.y' });
        expect(res.statusCode).toBe(200);
        expect(h.email.sent).toHaveLength(0);
    });

    it('reset-password updates passwordHash, revokes all sessions, deletes the token', async () => {
        // Issue an existing refresh token so we can prove it's revoked.
        const login = await h.transport.invoke('POST', '/auth/login', {
            email: 'gina@example.com', password: 'old-password-12',
        });
        expect(login.statusCode).toBe(200);
        const oldRefresh = login.body.refreshToken;

        await h.transport.invoke('POST', '/auth/password/forgot', { email: 'gina@example.com' });
        const token = tokenFrom(h.email.sent[0]);

        const reset = await h.transport.invoke('POST', '/auth/password/reset', {
            token,
            newPassword: 'new-password-12',
        });
        expect(reset.statusCode).toBe(200);

        // Old password no longer works
        const oldLogin = await h.transport.invoke('POST', '/auth/login', {
            email: 'gina@example.com', password: 'old-password-12',
        });
        expect(oldLogin.statusCode).toBe(401);

        // New password works
        const newLogin = await h.transport.invoke('POST', '/auth/login', {
            email: 'gina@example.com', password: 'new-password-12',
        });
        expect(newLogin.statusCode).toBe(200);

        // Old refresh token is revoked
        const refreshAttempt = await h.transport.invoke('POST', '/auth/refresh', { refreshToken: oldRefresh });
        expect(refreshAttempt.statusCode).toBe(401);

        // Reset token is single-use
        const reuse = await h.transport.invoke('POST', '/auth/password/reset', {
            token, newPassword: 'another-pw-12',
        });
        expect(reuse.statusCode).toBe(400);
    });

    it('rejects short new passwords', async () => {
        await h.transport.invoke('POST', '/auth/password/forgot', { email: 'gina@example.com' });
        const token = tokenFrom(h.email.sent[0]);
        const res = await h.transport.invoke('POST', '/auth/password/reset', { token, newPassword: 'short' });
        expect(res.statusCode).toBe(400);
    });

    it('rejects expired reset tokens', async () => {
        const h2 = await bootHarness({ 'auth.resetTtl': '1ms' });
        await h2.transport.invoke('POST', '/auth/register', {
            email: 'hank@example.com', password: 'password-1234',
        });
        h2.email.sent = [];
        await h2.transport.invoke('POST', '/auth/password/forgot', { email: 'hank@example.com' });
        const stored = (await h2.db.getAll('passwordResetTokens'))[0];
        await h2.db.update('passwordResetTokens', String(stored.id), {
            expiresAt: new Date(Date.now() - 1000).toISOString(),
        });
        const token = tokenFrom(h2.email.sent[0]);
        const res = await h2.transport.invoke('POST', '/auth/password/reset', { token, newPassword: 'fresh-pw-12' });
        expect(res.statusCode).toBe(400);
    });
});

// ─────────────────────────  authenticated change-password  ─────────────────────────

describe('IdentityPlugin — change-password (authenticated)', () => {
    let h: Harness;
    let userId: string;
    let token: string;

    beforeEach(async () => {
        h = await bootHarness();
        const reg = await h.transport.invoke('POST', '/auth/register', {
            email: 'ivan@example.com', password: 'old-password-12',
        });
        userId = reg.body.user.id;
        token = reg.body.accessToken;
    });

    it('rejects unauthenticated callers with 401', async () => {
        const res = await h.transport.invoke('POST', '/auth/password/change', {
            currentPassword: 'old-password-12', newPassword: 'new-password-12',
        });
        expect(res.statusCode).toBe(401);
    });

    it('rejects spoofed x-user-payload header (verifier is the source of truth)', async () => {
        const res = await h.transport.invoke('POST', '/auth/password/change',
            { currentPassword: 'old-password-12', newPassword: 'new-password-12' },
            { 'x-user-payload': JSON.stringify({ sub: userId }) }
        );
        expect(res.statusCode).toBe(401);
    });

    it('rejects when currentPassword is wrong', async () => {
        const res = await h.transport.invoke('POST', '/auth/password/change',
            { currentPassword: 'wrong-pw-1234', newPassword: 'new-password-12' },
            { authorization: `Bearer ${token}` }
        );
        expect(res.statusCode).toBe(401);
    });

    it('updates password, revokes ALL refresh tokens', async () => {
        // Make a second active session
        const login = await h.transport.invoke('POST', '/auth/login', {
            email: 'ivan@example.com', password: 'old-password-12',
        });
        const otherRefresh = login.body.refreshToken;

        const res = await h.transport.invoke('POST', '/auth/password/change',
            { currentPassword: 'old-password-12', newPassword: 'new-password-12' },
            { authorization: `Bearer ${token}` }
        );
        expect(res.statusCode).toBe(200);

        // Both refresh tokens revoked
        const tokens = await h.db.search('refreshTokens', { userId });
        expect(tokens.every(t => t.revoked)).toBe(true);

        // Old password rejected, new password accepted
        const old = await h.transport.invoke('POST', '/auth/login', {
            email: 'ivan@example.com', password: 'old-password-12',
        });
        expect(old.statusCode).toBe(401);
        const fresh = await h.transport.invoke('POST', '/auth/login', {
            email: 'ivan@example.com', password: 'new-password-12',
        });
        expect(fresh.statusCode).toBe(200);

        // Other session can't be refreshed
        const refreshAttempt = await h.transport.invoke('POST', '/auth/refresh', { refreshToken: otherRefresh });
        expect(refreshAttempt.statusCode).toBe(401);
    });
});

// ─────────────────────────  graceful degradation  ─────────────────────────

describe('IdentityPlugin — graceful degradation when no email provider', () => {
    it('does not mount /auth/verify or /auth/password/forgot', async () => {
        const kernel = new JsonExpressKernel();
        const config = makeConfig();
        const db = new MemoryDatabaseAdapter({ logger: new ConsoleLogger({ silent: true } as any) });
        const transport = new FakeTransport();

        kernel.registerConfigProvider(config);
        kernel.registerDatabase(db);
        kernel.registerTransport(transport);
        // No email provider registered
        kernel.container.register({
            'middleware:auth': asValue({ name: 'auth', handle: async (_r: any, n: any) => n() }),
        });
        const plugin = new IdentityPlugin({ configProvider: config });
        await plugin.onBoot(kernel, config);

        const paths = Array.from(transport.routes.keys());
        expect(paths).not.toContain('POST /auth/verify');
        expect(paths).not.toContain('POST /auth/verify/resend');
        expect(paths).not.toContain('POST /auth/password/forgot');
        expect(paths).not.toContain('POST /auth/password/reset');
        // change-password is always available
        expect(paths).toContain('POST /auth/password/change');
    });

    it('register still works (no verification email sent) when no provider', async () => {
        const kernel = new JsonExpressKernel();
        const config = makeConfig();
        const db = new MemoryDatabaseAdapter({ logger: new ConsoleLogger({ silent: true } as any) });
        const transport = new FakeTransport();
        kernel.registerConfigProvider(config);
        kernel.registerDatabase(db);
        kernel.registerTransport(transport);
        kernel.container.register({
            'middleware:auth': asValue({ name: 'auth', handle: async (_r: any, n: any) => n() }),
        });
        const plugin = new IdentityPlugin({ configProvider: config });
        await plugin.onBoot(kernel, config);

        const res = await transport.invoke('POST', '/auth/register', {
            email: 'jane@example.com', password: 'password-1234',
        });
        expect(res.statusCode).toBe(201);
        expect(res.body.user.emailVerified).toBe(false);
        expect(await db.getAll('emailVerificationTokens')).toHaveLength(0);
    });
});

// helper export to silence unused warnings (signAccessToken intentionally re-imported for future cases)
void signAccessToken;
