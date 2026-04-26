import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const TEST_USER = {
    email: 'alice-e2e@example.com',
    password: 'correct horse battery staple',
};

let accessToken = '';
let refreshToken = '';

const post = (req: APIRequestContext, path: string, body: any, token?: string) =>
    req.post(path, {
        data: body,
        headers: token ? { authorization: `Bearer ${token}` } : {},
    });

test.describe('plugin-identity — registration', () => {
    test('rejects missing fields with 400', async ({ request }) => {
        const res = await post(request, '/auth/register', {});
        expect(res.status()).toBe(400);
    });

    test('rejects short passwords', async ({ request }) => {
        const res = await post(request, '/auth/register', { email: 'short@x.y', password: 'short' });
        expect(res.status()).toBe(400);
    });

    test('creates a fresh user and returns tokens', async ({ request }) => {
        const res = await post(request, '/auth/register', TEST_USER);
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.user.email).toBe(TEST_USER.email);
        expect(body.user.role).toBe('user');
        expect(typeof body.accessToken).toBe('string');
        expect(typeof body.refreshToken).toBe('string');
        accessToken = body.accessToken;
        refreshToken = body.refreshToken;
    });

    test('rejects duplicate registration with 409', async ({ request }) => {
        const res = await post(request, '/auth/register', TEST_USER);
        expect(res.status()).toBe(409);
    });
});

test.describe('plugin-identity — login', () => {
    test('returns 401 on unknown email', async ({ request }) => {
        const res = await post(request, '/auth/login', {
            email: 'nobody@example.com',
            password: 'whatever-pw',
        });
        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Invalid credentials' });
    });

    test('returns 401 on wrong password (same shape — no enumeration)', async ({ request }) => {
        const res = await post(request, '/auth/login', {
            email: TEST_USER.email,
            password: 'definitely wrong',
        });
        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Invalid credentials' });
    });

    test('returns tokens on valid credentials', async ({ request }) => {
        const res = await post(request, '/auth/login', TEST_USER);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.user.email).toBe(TEST_USER.email);
        expect(typeof body.accessToken).toBe('string');
        accessToken = body.accessToken;
        refreshToken = body.refreshToken;
    });
});

test.describe('plugin-identity — token works on protected resources', () => {
    test('POST /notes succeeds with a valid Bearer token', async ({ request }) => {
        const res = await post(request, '/notes', { title: 'mine', body: 'hello' }, accessToken);
        expect(res.status()).toBeLessThan(300);
    });

    test('POST /notes returns 401 without a token', async ({ request }) => {
        const res = await post(request, '/notes', { title: 'forbidden', body: 'x' });
        expect(res.status()).toBe(401);
    });
});

test.describe('plugin-identity — refresh', () => {
    let rotated = '';

    test('rotates: returns a new pair, old refresh becomes invalid', async ({ request }) => {
        const r1 = await post(request, '/auth/refresh', { refreshToken });
        expect(r1.status()).toBe(200);
        const body = await r1.json();
        expect(body.refreshToken).not.toBe(refreshToken);
        rotated = body.refreshToken;

        const r2 = await post(request, '/auth/refresh', { refreshToken });
        expect(r2.status()).toBe(401);
    });

    test('rejects unknown tokens', async ({ request }) => {
        const res = await post(request, '/auth/refresh', { refreshToken: 'totally-fake' });
        expect(res.status()).toBe(401);
    });

    test('hand off rotated token to logout suite', async () => {
        refreshToken = rotated;
        expect(refreshToken).toBeTruthy();
    });
});

test.describe('plugin-identity — logout', () => {
    test('revokes the refresh token; subsequent refresh fails', async ({ request }) => {
        const out = await post(request, '/auth/logout', { refreshToken });
        expect(out.status()).toBe(200);
        const after = await post(request, '/auth/refresh', { refreshToken });
        expect(after.status()).toBe(401);
    });

    test('is idempotent — 200 on unknown tokens (no enumeration)', async ({ request }) => {
        const res = await post(request, '/auth/logout', { refreshToken: 'totally-fake' });
        expect(res.status()).toBe(200);
    });
});

// ─────────────────────────  Phase 2  ─────────────────────────
// Email-dependent endpoints use plaintext tokens that are only sent via email.
// We can't recover them from the running webServer's stdout in Playwright, so the
// deep flows are exhaustively unit-tested in packages/plugin-identity/tests/email.test.ts.
// Here we only confirm the endpoints are mounted (the same HTTP plumbing as the proven flows)
// and exercise change-password end-to-end (no email needed — auth header is enough).

test.describe('plugin-identity — email-dependent endpoints are mounted', () => {
    test('POST /auth/verify exists (returns 400 without a token, not 404)', async ({ request }) => {
        const res = await post(request, '/auth/verify', {});
        expect(res.status()).toBe(400);
    });

    test('POST /auth/password/forgot exists (returns 400 without an email)', async ({ request }) => {
        const res = await post(request, '/auth/password/forgot', {});
        expect(res.status()).toBe(400);
    });

    test('POST /auth/password/forgot is anti-enumerating (200 for unknown email)', async ({ request }) => {
        const res = await post(request, '/auth/password/forgot', { email: 'nobody@test.local' });
        expect(res.status()).toBe(200);
    });

    test('POST /auth/password/reset exists (returns 400 without a token)', async ({ request }) => {
        const res = await post(request, '/auth/password/reset', { newPassword: 'whatever-12' });
        expect(res.status()).toBe(400);
    });
});

test.describe('plugin-identity — change-password (authenticated, no email)', () => {
    const cpUser = { email: 'change-pw@example.com', password: 'initial-password-12' };
    let cpToken = '';

    test('register a fresh user for change-password tests', async ({ request }) => {
        const res = await post(request, '/auth/register', cpUser);
        expect(res.status()).toBe(201);
        cpToken = (await res.json()).accessToken;
        expect(typeof cpToken).toBe('string');
    });

    test('rejects unauthenticated callers with 401', async ({ request }) => {
        const res = await post(request, '/auth/password/change', {
            currentPassword: cpUser.password, newPassword: 'new-password-12',
        });
        expect(res.status()).toBe(401);
    });

    test('rejects when currentPassword is wrong', async ({ request }) => {
        const res = await post(request, '/auth/password/change',
            { currentPassword: 'wrong-pw-1234', newPassword: 'new-password-12' },
            cpToken
        );
        expect(res.status()).toBe(401);
    });

    test('changes password — old password no longer logs in, new one does', async ({ request }) => {
        const res = await post(request, '/auth/password/change',
            { currentPassword: cpUser.password, newPassword: 'new-password-12' },
            cpToken
        );
        expect(res.status()).toBe(200);

        const oldLogin = await post(request, '/auth/login', cpUser);
        expect(oldLogin.status()).toBe(401);

        const newLogin = await post(request, '/auth/login', { email: cpUser.email, password: 'new-password-12' });
        expect(newLogin.status()).toBe(200);
    });
});
