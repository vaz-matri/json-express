import { test, expect } from '@playwright/test';

test.describe('HTML Simple — Users API', () => {
    test.describe.configure({ mode: 'serial' });
    let userId: string;

    test('should return empty users list initially', async ({ request }) => {
        const response = await request.get('/users');
        expect(response.ok()).toBeTruthy();

        const users = await response.json();
        expect(Array.isArray(users)).toBe(true);
    });

    test('should create a new user', async ({ request }) => {
        const response = await request.post('/users', {
            data: { username: 'alice', email: 'alice@example.com' }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.username).toBe('alice');
        expect(body.email).toBe('alice@example.com');
        expect(body.id).toBeDefined();
        userId = body.id;
    });

    test('should fetch the created user by ID', async ({ request }) => {
        const response = await request.get(`/users/${userId}`);
        expect(response.ok()).toBeTruthy();

        const user = await response.json();
        expect(user.username).toBe('alice');
    });

    test('should update the user', async ({ request }) => {
        const response = await request.patch(`/users/${userId}`, {
            data: { email: 'alice@updated.com' }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.email).toBe('alice@updated.com');
    });

    test('should delete the user', async ({ request }) => {
        const response = await request.delete(`/users/${userId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/users/${userId}`);
        expect(getResponse.status()).toBe(404);
    });
});
