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
