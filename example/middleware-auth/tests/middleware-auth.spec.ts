import { test, expect } from '@playwright/test';
import jwt from 'jsonwebtoken';

const SECRET = 'test-secret-key';

test.describe('Middleware Auth — JWT Protection', () => {
    test.describe.configure({ mode: 'serial' });

    // UNAUTHORIZED — No token
    test('should return 401 when GET /users without a token', async ({ request }) => {
        const response = await request.get('/users');
        expect(response.status()).toBe(401);

        const body = await response.json();
        expect(body.error).toContain('Unauthorized');
    });

    test('should return 401 when POST /users without a token', async ({ request }) => {
        const response = await request.post('/users', {
            data: { username: 'hacker', role: 'none' }
        });
        expect(response.status()).toBe(401);
    });

    // FORBIDDEN — Invalid token
    test('should return 403 with an invalid token', async ({ request }) => {
        const response = await request.get('/users', {
            headers: { Authorization: 'Bearer totally-fake-token' }
        });
        expect(response.status()).toBe(403);

        const body = await response.json();
        expect(body.error).toContain('Forbidden');
    });

    // AUTHORIZED — Valid token
    test('should return 200 when GET /users with a valid JWT', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });

        const response = await request.get('/users', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(response.ok()).toBeTruthy();

        const users = await response.json();
        expect(Array.isArray(users)).toBe(true);
    });

    test('should return 201 when POST /users with a valid JWT', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });

        const response = await request.post('/users', {
            headers: { Authorization: `Bearer ${token}` },
            data: { username: 'newuser', role: 'viewer' }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.username).toBe('newuser');
        expect(body.id).toBeDefined();
    });
});

test.describe('Schema-Driven RBAC — posts (access rules)', () => {
    test.describe.configure({ mode: 'serial' });

    test('anonymous GET /posts succeeds (read: public)', async ({ request }) => {
        const response = await request.get('/posts');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThanOrEqual(2);
    });

    test('anonymous POST /posts is blocked by auth middleware (401)', async ({ request }) => {
        const response = await request.post('/posts', { data: { title: 'X', body: 'Y' } });
        expect(response.status()).toBe(401);
    });

    test('non-admin POST /posts returns 403', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-2', role: 'viewer' }, SECRET, { expiresIn: '1h' });
        const response = await request.post('/posts', {
            headers: { Authorization: `Bearer ${token}` },
            data: { title: 'Forbidden', body: 'Try' }
        });
        expect(response.status()).toBe(403);
        const body = await response.json();
        expect(body.error).toMatch(/admin/);
    });

    test('admin POST /posts returns 201', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });
        const response = await request.post('/posts', {
            headers: { Authorization: `Bearer ${token}` },
            data: { title: 'Admin Post', body: 'OK' }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.title).toBe('Admin Post');
    });

    test('editor PATCH /posts/:id succeeds (update: [admin, editor])', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-3', role: 'editor' }, SECRET, { expiresIn: '1h' });
        const response = await request.patch('/posts/p-1', {
            headers: { Authorization: `Bearer ${token}` },
            data: { title: 'Edited by editor' }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.title).toBe('Edited by editor');
    });

    test('editor DELETE /posts/:id is forbidden (delete: admin only)', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-3', role: 'editor' }, SECRET, { expiresIn: '1h' });
        const response = await request.delete('/posts/p-1', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(response.status()).toBe(403);
    });

    test('admin DELETE /posts/:id succeeds', async ({ request }) => {
        const token = jwt.sign({ sub: 'user-1', role: 'admin' }, SECRET, { expiresIn: '1h' });
        const response = await request.delete('/posts/p-2', {
            headers: { Authorization: `Bearer ${token}` }
        });
        expect(response.status()).toBe(200);
    });
});

test.describe('Schema-Driven RBAC — notes (owner row-level security)', () => {
    test.describe.configure({ mode: 'serial' });

    const tokenA = jwt.sign({ sub: 'user-a' }, SECRET, { expiresIn: '1h' });
    const tokenB = jwt.sign({ sub: 'user-b' }, SECRET, { expiresIn: '1h' });

    test('anonymous GET /notes returns 401', async ({ request }) => {
        const response = await request.get('/notes');
        expect(response.status()).toBe(401);
    });

    test('user-a GET /notes returns only user-a records', async ({ request }) => {
        const response = await request.get('/notes', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.length).toBe(2);
        expect(body.every((n: any) => n.ownerId === 'user-a')).toBe(true);
    });

    test('user-b GET /notes returns only user-b records', async ({ request }) => {
        const response = await request.get('/notes', {
            headers: { Authorization: `Bearer ${tokenB}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.length).toBe(1);
        expect(body[0].ownerId).toBe('user-b');
    });

    test('user-a GET /notes?ownerId=user-b cannot spoof — owner clause overwrites', async ({ request }) => {
        const response = await request.get('/notes?ownerId=user-b', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.every((n: any) => n.ownerId === 'user-a')).toBe(true);
    });

    test('user-a GET /notes/:id on user-b record returns 404 (no existence leak)', async ({ request }) => {
        const response = await request.get('/notes/n-b-1', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(404);
    });

    test('user-a PATCH /notes/:id on user-b record returns 404', async ({ request }) => {
        const response = await request.patch('/notes/n-b-1', {
            headers: { Authorization: `Bearer ${tokenA}` },
            data: { title: 'hijack attempt' }
        });
        expect(response.status()).toBe(404);
    });

    test('user-a DELETE /notes/:id on user-b record returns 404', async ({ request }) => {
        const response = await request.delete('/notes/n-b-1', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(404);
    });

    test('user-a POST /notes auto-stamps ownerId=user-a even when client sends ownerId=user-b', async ({ request }) => {
        const response = await request.post('/notes', {
            headers: { Authorization: `Bearer ${tokenA}` },
            data: { title: 'A new note', body: '...', ownerId: 'user-b' }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.ownerId).toBe('user-a');
    });

    test('user-a PATCH own note succeeds', async ({ request }) => {
        const response = await request.patch('/notes/n-a-1', {
            headers: { Authorization: `Bearer ${tokenA}` },
            data: { title: 'Updated by owner' }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.title).toBe('Updated by owner');
    });

    test('user-a DELETE own note succeeds', async ({ request }) => {
        const response = await request.delete('/notes/n-a-2', {
            headers: { Authorization: `Bearer ${tokenA}` }
        });
        expect(response.status()).toBe(200);
    });
});

test.describe('Schema-Driven RBAC — notes (field-level access)', () => {
    test.describe.configure({ mode: 'serial' });

    // Same `sub` so the row-level owner check passes; the role claim is what
    // the field-level rule keys on.
    const userToken = jwt.sign({ sub: 'user-a' }, SECRET, { expiresIn: '1h' });
    const adminToken = jwt.sign({ sub: 'user-a', role: 'admin' }, SECRET, { expiresIn: '1h' });

    test('non-admin owner reading own note has adminNotes omitted', async ({ request }) => {
        const response = await request.get('/notes/n-a-1', {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.id).toBe('n-a-1');
        expect(body.ownerId).toBe('user-a');
        expect(body.adminNotes).toBeUndefined();   // omitted (not null)
    });

    test('admin owner reading own note sees adminNotes', async ({ request }) => {
        const response = await request.get('/notes/n-a-1', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.adminNotes).toBe('ADMIN-ONLY a-1');
    });

    test('non-admin GET /notes list omits adminNotes from every record', async ({ request }) => {
        const response = await request.get('/notes', {
            headers: { Authorization: `Bearer ${userToken}` }
        });
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.every((n: any) => n.adminNotes === undefined)).toBe(true);
    });

    test('non-admin POST with adminNotes silently strips the field', async ({ request }) => {
        const createRes = await request.post('/notes', {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { title: 'Strip Test', body: 'hi', adminNotes: 'forged' }
        });
        expect(createRes.status()).toBe(201);
        const created = await createRes.json();
        expect(created.adminNotes).toBeUndefined();   // not echoed back to non-admin

        // Verify the field never made it to storage by reading as admin.
        const readBackId = created.id;
        const readRes = await request.get(`/notes/${readBackId}`, {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const readBack = await readRes.json();
        expect(readBack.adminNotes).toBeUndefined();   // never persisted
        expect(readBack.title).toBe('Strip Test');
    });

    test('admin POST with adminNotes retains the field', async ({ request }) => {
        const createRes = await request.post('/notes', {
            headers: { Authorization: `Bearer ${adminToken}` },
            data: { title: 'Admin Note', body: 'with admin field', adminNotes: 'kept' }
        });
        expect(createRes.status()).toBe(201);
        const created = await createRes.json();
        expect(created.adminNotes).toBe('kept');
    });

    test('non-admin PATCH with adminNotes leaves the existing value untouched', async ({ request }) => {
        // Update title via non-admin caller; smuggled adminNotes should be stripped.
        const patchRes = await request.patch('/notes/n-a-1', {
            headers: { Authorization: `Bearer ${userToken}` },
            data: { title: 'Renamed by user', adminNotes: 'hijack' }
        });
        expect(patchRes.status()).toBe(200);

        // Read back as admin to verify adminNotes is unchanged.
        const readRes = await request.get('/notes/n-a-1', {
            headers: { Authorization: `Bearer ${adminToken}` }
        });
        const body = await readRes.json();
        expect(body.title).toBe('Renamed by user');
        expect(body.adminNotes).toBe('ADMIN-ONLY a-1');   // original value preserved
    });
});
