import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret-key';

test.describe('Middleware Auth — JWT Protection', () => {
    test.describe.configure({ mode: 'serial' });

    // UNAUTHORIZED — No token
    test('should return 401 when GET /review without a token', async ({ request }) => {
        const response = await request.get('/review');
        expect(response.status()).toBe(401);

        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
    });

    test('should return 401 when POST /review without a token', async ({ request }) => {
        const response = await request.post('/review', {
            data: { bookId: 'book-1', rating: 4, body: 'no token' }
        });
        expect(response.status()).toBe(401);
    });

    // FORBIDDEN — Invalid token
    test('should return 403 with an invalid token', async ({ request }) => {
        const response = await request.get('/review', {
            headers: { Authorization: 'Bearer totally-fake-token' }
        });
        expect(response.status()).toBe(403);

        const body = await response.json();
        expect(body.error).toContain('Forbidden');
    });

    // AUTHORIZED — Valid token
    test('should return 200 when GET /review with a valid JWT', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });

        const response = await request.get('/review', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
    });

    test('should return 201 when POST /review with a valid JWT', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });

        const response = await request.post('/review', {
            headers: { Authorization: `Bearer ${token}` },
            data: { bookId: 'book-1', rating: 5, body: 'first review' }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.body).toBe('first review');
        expect(body.id).toBeDefined();
    });
});

test.describe('Schema-Driven RBAC — book (access rules)', () => {
    test.describe.configure({ mode: 'serial' });

    test('anonymous GET /book succeeds (read: public)', async ({ request }) => {
        const response = await request.get('/book');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThanOrEqual(2);
    });

    test('anonymous POST /book is blocked by auth middleware (401)', async ({ request }) => {
        const response = await request.post('/book', {
            data: { title: 'X', authorId: 'author-1', publisherId: 'pub-1' }
        });
        expect(response.status()).toBe(401);
    });

    test('non-admin POST /book returns 403', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-2', role: 'viewer' }, SECRET, { expiresIn: '1h' });
        const response = await request.post('/book', {
            headers: { Authorization: `Bearer ${token}` },
            data: { title: 'Forbidden', authorId: 'author-1', publisherId: 'pub-1' }
        });
        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.error).toMatch(/admin/);
    });

    test('admin POST /book returns 201', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });
        const response = await request.post('/book', {
            headers: { Authorization: `Bearer ${token}` },
            data: { title: 'Admin Book', authorId: 'author-1', publisherId: 'pub-1' }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.title).toBe('Admin Book');
    });

    test('editor PATCH /book/:id succeeds (update: [admin, editor])', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-3', role: 'editor' }, SECRET, { expiresIn: '1h' });
        const response = await request.patch('/book/book-1', {
            headers: { Authorization: `Bearer ${token}` },
            data: { title: 'Edited by editor' }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.title).toBe('Edited by editor');
    });

    test('editor DELETE /book/:id is forbidden (delete: admin only)', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-3', role: 'editor' }, SECRET, { expiresIn: '1h' });
        const response = await request.delete('/book/book-1', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(response.status()).toBe(403);
    });

    test('admin DELETE /book/:id succeeds', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });
        const response = await request.delete('/book/book-2', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
    });
});

test.describe('Schema-Driven RBAC — review (owner row-level security)', () => {
    test.describe.configure({ mode: 'serial' });

    const tokenA = jwt.sign({ sub: 'user-a' }, SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ sub: 'user-b' }, SECRET, { expiresIn: '1h' });

    test('anonymous GET /review returns 401', async ({ request }) => {
        const response = await request.get('/review');
        expect(response.status()).toBe(401);
    });

    test('user-a GET /review returns only user-a records', async ({ request }) => {
        const response = await request.get('/review', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.length).toBe(2);
        expect(body.every((r: any) => r.ownerId === 'user-a')).toBe(true);
    });

    test('user-b GET /review returns only user-b records', async ({ request }) => {
        const response = await request.get('/review', {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.length).toBe(1);
        expect(body[0].ownerId).toBe('user-b');
    });

    test('user-a GET /review?ownerId=user-b cannot spoof — owner clause overwrites', async ({ request }) => {
        const response = await request.get('/review?ownerId=user-b', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.every((r: any) => r.ownerId === 'user-a')).toBe(true);
    });

    test('user-a GET /review/:id on user-b record returns 404 (no existence leak)', async ({ request }) => {
        const response = await request.get('/review/r-b-1', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(404);
    });

    test('user-a PATCH /review/:id on user-b record returns 404', async ({ request }) => {
        const response = await request.patch('/review/r-b-1', {
            headers: { Authorization: `Bearer ${tokenA}` },
            data: { body: 'hijack attempt' }
        });
        expect(response.status()).toBe(404);
    });

    test('user-a DELETE /review/:id on user-b record returns 404', async ({ request }) => {
        const response = await request.delete('/review/r-b-1', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(404);
    });

    test('user-a POST /review auto-stamps ownerId=user-a even when client sends ownerId=user-b', async ({ request }) => {
        const response = await request.post('/review', {
            headers: { Authorization: `Bearer ${tokenA}` },
            data: { bookId: 'book-1', rating: 4, body: 'A new review', ownerId: 'user-b' }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.ownerId).toBe('user-a');
    });

    test('user-a PATCH own review succeeds', async ({ request }) => {
        const response = await request.patch('/review/r-a-1', {
            headers: { Authorization: `Bearer ${tokenA}` },
            data: { body: 'Updated by owner' }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.body).toBe('Updated by owner');
    });

    test('user-a DELETE own review succeeds', async ({ request }) => {
        const response = await request.delete('/review/r-a-2', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(200);
    });
});

test.describe('Schema-Driven RBAC — review (field-level access)', () => {
    test.describe.configure({ mode: 'serial' });

    // Same `sub` so the row-level owner check passes; the role claim is what
    // the field-level rule keys on.
    const userToken = jwt.sign({ sub: 'user-a' }, SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ sub: 'user-a', role: 'admin' }, SECRET, { expiresIn: '1h' });

    test('non-admin owner reading own review has moderatorNotes omitted', async ({ request }) => {
        const response = await request.get('/review/r-a-1', {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.id).toBe('r-a-1');
        expect(body.ownerId).toBe('user-a');
        expect(body.moderatorNotes).toBeUndefined();   // omitted (not null)
    });

    test('admin owner reading own review sees moderatorNotes', async ({ request }) => {
        const response = await request.get('/review/r-a-1', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.moderatorNotes).toBe('MODERATOR-ONLY a-1');
    });

    test('non-admin GET /review list omits moderatorNotes from every record', async ({ request }) => {
        const response = await request.get('/review', {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.every((r: any) => r.moderatorNotes === undefined)).toBe(true);
    });

    test('non-admin POST with moderatorNotes silently strips the field', async ({ request }) => {
        const createRes = await request.post('/review', {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { bookId: 'book-1', rating: 5, body: 'Strip Test', moderatorNotes: 'forged' }
        });
        expect(createRes.status()).toBe(201);
        const created = await createRes.json();
        expect(created.moderatorNotes).toBeUndefined();   // not echoed back to non-admin

        // Verify the field never made it to storage by reading as admin.
        const readBackId = created.id;
        const readRes = await request.get(`/review/${readBackId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const readBack = await readRes.json();
        expect(readBack.moderatorNotes).toBeUndefined();   // never persisted
        expect(readBack.body).toBe('Strip Test');
    });

    test('admin POST with moderatorNotes retains the field', async ({ request }) => {
        const createRes = await request.post('/review', {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { bookId: 'book-1', rating: 5, body: 'Admin Review', moderatorNotes: 'kept' }
        });
        expect(createRes.status()).toBe(201);
        const created = await createRes.json();
        expect(created.moderatorNotes).toBe('kept');
    });

    test('non-admin PATCH with moderatorNotes leaves the existing value untouched', async ({ request }) => {
        // Update body via non-admin caller; smuggled moderatorNotes should be stripped.
        const patchRes = await request.patch('/review/r-a-1', {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { body: 'Renamed by user', moderatorNotes: 'hijack' }
        });
        expect(patchRes.status()).toBe(200);

        // Read back as admin to verify moderatorNotes is unchanged.
        const readRes = await request.get('/review/r-a-1', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const body = await readRes.json();
        expect(body.body).toBe('Renamed by user');
        expect(body.moderatorNotes).toBe('MODERATOR-ONLY a-1');   // original value preserved
    });
});
