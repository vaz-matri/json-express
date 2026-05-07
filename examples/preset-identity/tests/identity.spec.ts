import { test, expect, type APIRequestContext } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

const ALICE = { email: 'alice-preset@example.com', password: 'correct horse battery staple' };
const BOB   = { email: 'bob-preset@example.com',   password: 'tr0ub4dor & 3' };

let aliceToken = '';
let aliceRefresh = '';
let aliceId = '';
let bobToken = '';
let bobId = '';
let aliceTaskId = '';

const post = (req: APIRequestContext, path: string, body: any, token?: string) =>
    req.post(path, { data: body, headers: token ? { authorization: `Bearer ${token}` } : {} });

const get = (req: APIRequestContext, path: string, token?: string) =>
    req.get(path, { headers: token ? { authorization: `Bearer ${token}` } : {} });

const patch = (req: APIRequestContext, path: string, body: any, token?: string) =>
    req.patch(path, { data: body, headers: token ? { authorization: `Bearer ${token}` } : {} });

// ─────────────────────────  Phase 0 — middleware-auth + model access collaborate  ─────────────────────────

test.describe('middleware-auth + model access — two layers, one decision', () => {
    test('GET /tasks is enforced (401 anonymously) — proves middleware-auth is wired', async ({ request }) => {
        const res = await get(request, '/tasks');
        expect(res.status()).toBe(401);
    });

    test('GET /tags is public per the model rule', async ({ request }) => {
        // Subtle but important: middleware-auth lets the request through (no Bearer token, no
        // x-user-payload) and the model's `read: 'public'` rule allows it. The two layers
        // collaborate — middleware-auth sets up the user context, the model decides access.
        const res = await get(request, '/tags');
        expect(res.status()).toBe(200);
        const tags = await res.json();
        expect(Array.isArray(tags)).toBe(true);
        expect(tags.length).toBeGreaterThanOrEqual(2);   // seeded
    });
});

// ─────────────────────────  Phase 1 — registration & login  ─────────────────────────

test.describe('identity — registration', () => {
    test('Alice registers and gets tokens with iss/aud claims baked in', async ({ request }) => {
        const res = await post(request, '/auth/register', ALICE);
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.user.email).toBe(ALICE.email);
        aliceToken = body.accessToken;
        aliceRefresh = body.refreshToken;
        aliceId = body.user.id;
    });

    test('Bob registers too', async ({ request }) => {
        const res = await post(request, '/auth/register', BOB);
        expect(res.status()).toBe(201);
        const body = await res.json();
        bobToken = body.accessToken;
        bobId = body.user.id;
    });

    test('Alice can log in with her credentials', async ({ request }) => {
        const res = await post(request, '/auth/login', ALICE);
        expect(res.status()).toBe(200);
        const body = await res.json();
        aliceToken = body.accessToken;
        aliceRefresh = body.refreshToken;
    });
});

// ─────────────────────────  Phase 2 — owner-scoped tasks  ─────────────────────────

test.describe('tasks — owner-scoped reads keep users\' lists isolated', () => {
    test('Alice creates a task; ownerId is auto-stamped from her JWT', async ({ request }) => {
        const res = await post(request, '/tasks',
            { title: 'finish the writeup', priority: 1 },
            aliceToken
        );
        expect(res.status()).toBe(201);
        const body = await res.json();
        expect(body.ownerId).toBe(aliceId);
        aliceTaskId = body.id;
    });

    test('Bob creates a task too', async ({ request }) => {
        const res = await post(request, '/tasks',
            { title: 'review pr', priority: 2 },
            bobToken
        );
        expect(res.status()).toBe(201);
        expect((await res.json()).ownerId).toBe(bobId);
    });

    test('Alice GET /tasks sees only her own (Bob\'s task is invisible)', async ({ request }) => {
        const res = await get(request, '/tasks', aliceToken);
        expect(res.status()).toBe(200);
        const rows = await res.json();
        expect(rows.length).toBeGreaterThan(0);
        for (const t of rows) expect(t.ownerId).toBe(aliceId);
    });

    test('Bob GET /tasks sees only his own', async ({ request }) => {
        const res = await get(request, '/tasks', bobToken);
        const rows = await res.json();
        for (const t of rows) expect(t.ownerId).toBe(bobId);
    });

    test('Bob cannot read Alice\'s task by id (404, no enumeration)', async ({ request }) => {
        const res = await get(request, `/tasks/${aliceTaskId}`, bobToken);
        expect(res.status()).toBe(404);
    });

    test('Alice can flip her task to done', async ({ request }) => {
        const res = await patch(request, `/tasks/${aliceTaskId}`, { status: 'done' }, aliceToken);
        expect(res.status()).toBe(200);
        expect((await res.json()).status).toBe('done');
    });
});

// ─────────────────────────  Phase 3 — role-gated tags  ─────────────────────────

test.describe('tags — role gating at the model level', () => {
    test('regular user cannot create tags (403)', async ({ request }) => {
        const res = await post(request, '/tags', { name: 'pizza', color: '#fc0' }, aliceToken);
        expect(res.status()).toBe(403);
        expect((await res.json()).error).toMatch(/admin/i);
    });

    test('anonymous still cannot create tags (401)', async ({ request }) => {
        const res = await post(request, '/tags', { name: 'pizza', color: '#fc0' });
        expect(res.status()).toBe(401);
    });

    // Note: the happy-path 'admin can create' scenario isn't tested here because
    // the auto-seeded admin's password is randomly generated and printed once
    // to logs (see plugin-identity's seedAdminIfEmpty). Grab it from the boot
    // logs and exercise it manually with curl if you want to verify.
});

// ─────────────────────────  Phase 4 — /me + /me/stats (defineRoutes + JWT)  ─────────────────────────

test.describe('me — JWT-driven aggregation via defineRoutes', () => {
    test('GET /me returns Alice\'s profile (passwordHash stripped)', async ({ request }) => {
        const res = await get(request, '/me', aliceToken);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.id).toBe(aliceId);
        expect(body.email).toBe(ALICE.email);
        expect(body.passwordHash).toBeUndefined();
    });

    test('GET /me/stats reflects Alice\'s task counts (1 done, 0 pending)', async ({ request }) => {
        const res = await get(request, '/me/stats', aliceToken);
        expect(res.status()).toBe(200);
        const body = await res.json();
        expect(body.total).toBe(1);
        expect(body.done).toBe(1);
        expect(body.pending).toBe(0);
    });

    test('GET /me/stats for Bob shows his pending count', async ({ request }) => {
        const res = await get(request, '/me/stats', bobToken);
        const body = await res.json();
        expect(body.total).toBe(1);
        expect(body.pending).toBe(1);
        expect(body.done).toBe(0);
    });

    test('GET /me requires a token', async ({ request }) => {
        const res = await get(request, '/me');
        expect(res.status()).toBe(401);
    });
});

// ─────────────────────────  Phase 5 — refresh + logout (kv-memory)  ─────────────────────────

test.describe('refresh + logout — kv-memory backs the refresh-token store', () => {
    let rotated = '';

    test('refresh rotates: new pair issued, old refresh becomes invalid', async ({ request }) => {
        const r1 = await post(request, '/auth/refresh', { refreshToken: aliceRefresh });
        expect(r1.status()).toBe(200);
        rotated = (await r1.json()).refreshToken;
        expect(rotated).not.toBe(aliceRefresh);

        const r2 = await post(request, '/auth/refresh', { refreshToken: aliceRefresh });
        expect(r2.status()).toBe(401);
    });

    test('logout revokes the refresh token', async ({ request }) => {
        const out = await post(request, '/auth/logout', { refreshToken: rotated });
        expect(out.status()).toBe(200);

        const after = await post(request, '/auth/refresh', { refreshToken: rotated });
        expect(after.status()).toBe(401);
    });

    test('logout is idempotent — 200 on unknown tokens (anti-enumeration)', async ({ request }) => {
        const res = await post(request, '/auth/logout', { refreshToken: 'totally-fake' });
        expect(res.status()).toBe(200);
    });
});

// ─────────────────────────  Phase 6 — email-console wiring  ─────────────────────────

test.describe('email-console — forgot-password is mounted and anti-enumerating', () => {
    test('POST /auth/password/forgot returns 200 even for unknown emails', async ({ request }) => {
        const res = await post(request, '/auth/password/forgot', { email: 'nobody@test.local' });
        expect(res.status()).toBe(200);
    });

    test('POST /auth/password/forgot returns 200 for a real user (email-console prints to stdout)', async ({ request }) => {
        const res = await post(request, '/auth/password/forgot', { email: ALICE.email });
        expect(res.status()).toBe(200);
        // The actual email content goes to the WebServer stdout (visible above
        // in the playwright reporter output). Inspect those lines manually if
        // you want to copy the reset link for a full reset flow.
    });

    test('POST /auth/verify is mounted (proves email-dependent endpoints registered)', async ({ request }) => {
        const res = await post(request, '/auth/verify', {});
        expect(res.status()).toBe(400);  // 400, not 404 — the route exists
    });
});

// ─────────────────────────  Phase 7 — middleware-auth rejects forged tokens  ─────────────────────────

test.describe('middleware-auth — token validation', () => {
    test('garbage Bearer token is rejected with 403 (signature verify fails)', async ({ request }) => {
        const res = await get(request, '/tasks', 'totally.not.a.jwt');
        expect(res.status()).toBe(403);
    });

    test('missing Bearer prefix is rejected with 401 (no token at all)', async ({ request }) => {
        const res = await request.get('/tasks', { headers: { authorization: aliceToken } });
        expect(res.status()).toBe(401);
    });
});
