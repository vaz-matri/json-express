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
