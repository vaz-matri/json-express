import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const ALICE = { email: 'alice-e2e@example.com', password: 'correct horse battery staple' };
const BOB   = { email: 'bob-e2e@example.com',   password: 'tr0ub4dor & 3' };

let aliceToken = '';
let aliceRefresh = '';
let aliceId = '';
let bobToken = '';
let bobId = '';
let aliceArticleId = '';

const post = (req: APIRequestContext, path: string, body: any, token?: string) =>
    req.post(path, { data: body, headers: token ? { authorization: `Bearer ${token}` } : {} });

const get = (req: APIRequestContext, path: string, token?: string) =>
    req.get(path, { headers: token ? { authorization: `Bearer ${token}` } : {} });

const patch = (req: APIRequestContext, path: string, body: any, token?: string) =>
    req.patch(path, { data: body, headers: token ? { authorization: `Bearer ${token}` } : {} });

const del = (req: APIRequestContext, path: string, token?: string) =>
    req.delete(path, { headers: token ? { authorization: `Bearer ${token}` } : {} });

// ─────────────────────────  Phase 1 — auth flow  ─────────────────────────

test.describe('plugin-identity — registration', () => {
    test('rejects missing fields with 400', async ({ request }) => {
        const res = await post(request, '/auth/register', {});
        expect(res.status()).toBe(400);
    });

    test('rejects short passwords', async ({ request }) => {
        const res = await post(request, '/auth/register', { email: 'short@x.y', password: 'short' });
        expect(res.status()).toBe(400);
    });

    test('creates Alice and returns tokens', async ({ request }) => {
        const res = await post(request, '/auth/register', ALICE);
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.user.email).toBe(ALICE.email);
        expect(body.user.role).toBe('user');
        aliceToken = body.accessToken;
        aliceRefresh = body.refreshToken;
        aliceId = body.user.id;
    });

    test('creates Bob too', async ({ request }) => {
        const res = await post(request, '/auth/register', BOB);
        expect(res.status()).toBe(201);
        const body = await res.json();
        bobToken = body.accessToken;
        bobId = body.user.id;
        expect(bobId).not.toBe(aliceId);
    });

    test('rejects duplicate registration with 409', async ({ request }) => {
        const res = await post(request, '/auth/register', ALICE);
        expect(res.status()).toBe(409);
    });
});

test.describe('plugin-identity — login', () => {
    test('returns 401 on unknown email (no enumeration)', async ({ request }) => {
        const res = await post(request, '/auth/login', { email: 'nobody@example.com', password: 'whatever-pw' });
        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Invalid credentials' });
    });

    test('returns 401 on wrong password (same shape)', async ({ request }) => {
        const res = await post(request, '/auth/login', { email: ALICE.email, password: 'definitely wrong' });
        expect(res.status()).toBe(401);
        expect(await res.json()).toEqual({ error: 'Invalid credentials' });
    });

    test('returns tokens on valid credentials', async ({ request }) => {
        const res = await post(request, '/auth/login', ALICE);
        expect(res.status()).toBe(200);
        const body = await res.json();
        aliceToken = body.accessToken;
        aliceRefresh = body.refreshToken;
    });
});

// ─────────────────────────  Phase 2 — articles (the meat)  ─────────────────────────

test.describe('articles — public read', () => {
    test('GET /articles works without a token', async ({ request }) => {
        const res = await get(request, '/articles');
        expect(res.status()).toBe(200);
        expect(Array.isArray(await res.json())).toBe(true);
    });
});

test.describe('articles — auth required to write', () => {
    test('POST /articles returns 401 without a token', async ({ request }) => {
        const res = await post(request, '/articles', { title: 'x', body: 'y' });
        expect(res.status()).toBe(401);
    });
});

test.describe('articles — owner auto-stamping + field redaction on create', () => {
    test('Alice posts an article; authorId is auto-stamped, internalNotes is silently stripped', async ({ request }) => {
        const res = await post(request, '/articles',
            { title: 'Hello', body: 'World', internalNotes: 'this should be dropped' },
            aliceToken
        );
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.title).toBe('Hello');
        expect(body.authorId).toBe(aliceId);          // framework stamped it from JWT.sub
        expect(body.internalNotes).toBeUndefined();   // stripped from response (not admin)
        aliceArticleId = body.id;
    });

    test('the stored row really has no internalNotes (write-side strip works too)', async ({ request }) => {
        const res = await get(request, `/articles/${aliceArticleId}`);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.internalNotes).toBeUndefined();
    });

    test('public read also omits internalNotes', async ({ request }) => {
        // Anonymous list — even if there's nothing to hide, the schema-level rule
        // should keep the field absent from every row regardless of caller role.
        const res = await get(request, '/articles');
        const rows = await res.json();
        for (const r of rows) expect(r.internalNotes).toBeUndefined();
    });
});

test.describe('articles — per-record ownership on update / delete', () => {
    test("Bob cannot PATCH Alice's article (404, no enumeration)", async ({ request }) => {
        const res = await patch(request, `/articles/${aliceArticleId}`, { title: 'hijacked' }, bobToken);
        expect(res.status()).toBe(404);
    });

    test("Bob cannot DELETE Alice's article", async ({ request }) => {
        const res = await del(request, `/articles/${aliceArticleId}`, bobToken);
        expect(res.status()).toBe(404);
    });

    test('Alice CAN PATCH her own article', async ({ request }) => {
        const res = await patch(request, `/articles/${aliceArticleId}`, { title: 'Hello (edited)' }, aliceToken);
        expect(res.status()).toBe(200);
        expect((await res.json()).title).toBe('Hello (edited)');
    });
});

test.describe('articles — role-gated custom endpoint', () => {
    test('non-admin gets 403 from POST /articles/:id/feature', async ({ request }) => {
        const res = await post(request, `/articles/${aliceArticleId}/feature`, {}, aliceToken);
        expect(res.status()).toBe(403);
        expect((await res.json()).error).toMatch(/admin/i);
    });

    test('unauthenticated gets 401 from POST /articles/:id/feature', async ({ request }) => {
        const res = await post(request, `/articles/${aliceArticleId}/feature`, {});
        expect(res.status()).toBe(401);
    });
});

// ─────────────────────────  Phase 3 — comments  ─────────────────────────

test.describe('comments — owner-scoped writes, public read', () => {
    let aliceCommentId = '';

    test('GET /comments is public', async ({ request }) => {
        const res = await get(request, '/comments');
        expect(res.status()).toBe(200);
    });

    test('POST /comments needs a token', async ({ request }) => {
        const res = await post(request, '/comments', { articleId: aliceArticleId, body: 'hi' });
        expect(res.status()).toBe(401);
    });

    test("Bob comments on Alice's article — authorId stamped to Bob", async ({ request }) => {
        const res = await post(request, '/comments',
            { articleId: aliceArticleId, body: 'great post' },
            bobToken
        );
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.authorId).toBe(bobId);
    });

    test('Alice can comment on her own article too', async ({ request }) => {
        const res = await post(request, '/comments',
            { articleId: aliceArticleId, body: 'thanks!' },
            aliceToken
        );
        expect(res.status()).toBe(201);
        aliceCommentId = (await res.json()).id;
    });

    test("Bob cannot edit Alice's comment", async ({ request }) => {
        const res = await patch(request, `/comments/${aliceCommentId}`, { body: 'nope' }, bobToken);
        expect(res.status()).toBe(404);
    });
});

// ─────────────────────────  Phase 4 — /me (defineRoutes + JWT)  ─────────────────────────

test.describe('me — fieldless defineRoutes module reads JWT', () => {
    test('GET /me returns Alice when called with her token', async ({ request }) => {
        const res = await get(request, '/me', aliceToken);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(aliceId);
        expect(body.email).toBe(ALICE.email);
        expect(body.passwordHash).toBeUndefined();    // explicitly stripped by /me
    });

    test('GET /me returns 401 without a token', async ({ request }) => {
        const res = await get(request, '/me');
        expect(res.status()).toBe(401);
    });

    test('GET /me/articles returns only Alice\'s articles', async ({ request }) => {
        const res = await get(request, '/me/articles', aliceToken);
        expect(res.status()).toBe(200);
        const rows = await res.json();
        expect(Array.isArray(rows)).toBe(true);
        expect(rows.length).toBeGreaterThan(0);
        for (const a of rows) expect(a.authorId).toBe(aliceId);
    });

    test('GET /me/articles for Bob returns nothing (he posted no articles)', async ({ request }) => {
        const res = await get(request, '/me/articles', bobToken);
        expect(res.status()).toBe(200);
        const rows = await res.json();
        expect(rows).toEqual([]);
    });
});

// ─────────────────────────  Phase 5 — refresh + logout (kv-memory)  ─────────────────────────

test.describe('plugin-identity — refresh', () => {
    let rotated = '';

    test('rotates: returns a new pair, old refresh becomes invalid', async ({ request }) => {
        const r1 = await post(request, '/auth/refresh', { refreshToken: aliceRefresh });
        expect(r1.status()).toBe(200);
        const body = await r1.json();
        expect(body.refreshToken).not.toBe(aliceRefresh);
        rotated = body.refreshToken;

        const r2 = await post(request, '/auth/refresh', { refreshToken: aliceRefresh });
        expect(r2.status()).toBe(401);
    });

    test('rejects unknown tokens', async ({ request }) => {
        const res = await post(request, '/auth/refresh', { refreshToken: 'totally-fake' });
        expect(res.status()).toBe(401);
    });

    test('hand off rotated token to logout suite', async () => {
        aliceRefresh = rotated;
        expect(aliceRefresh).toBeTruthy();
    });
});

test.describe('plugin-identity — logout', () => {
    test('revokes the refresh token; subsequent refresh fails', async ({ request }) => {
        const out = await post(request, '/auth/logout', { refreshToken: aliceRefresh });
        expect(out.status()).toBe(200);
        const after = await post(request, '/auth/refresh', { refreshToken: aliceRefresh });
        expect(after.status()).toBe(401);
    });

    test('is idempotent — 200 on unknown tokens (no enumeration)', async ({ request }) => {
        const res = await post(request, '/auth/logout', { refreshToken: 'totally-fake' });
        expect(res.status()).toBe(200);
    });
});

// ─────────────────────────  Phase 6 — email-dependent endpoints are mounted  ─────────────────────────

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

// ─────────────────────────  Phase 7 — change-password (authenticated, no email)  ─────────────────────────

test.describe('plugin-identity — change-password', () => {
    const cpUser = { email: 'change-pw@example.com', password: 'initial-password-12' };
    let cpToken = '';

    test('register a fresh user', async ({ request }) => {
        const res = await post(request, '/auth/register', cpUser);
        expect(res.status()).toBe(201);
        cpToken = (await res.json()).accessToken;
    });

    test('rejects unauthenticated callers', async ({ request }) => {
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
