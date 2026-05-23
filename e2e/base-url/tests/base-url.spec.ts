import { test, expect } from '@playwright/test';

test.describe('Base URL — API prefix via .env', () => {
    test.describe.configure({ mode: 'serial' });

    test('should return 404 when accessing /items without prefix', async ({ request }) => {
        const response = await request.get('/items');
        expect(response.status()).toBe(404);
    });

    test('should return 200 when accessing /api/items with prefix', async ({ request }) => {
        const response = await request.get('/api/items');
        expect(response.ok()).toBeTruthy();

        const items = await response.json();
        expect(Array.isArray(items)).toBe(true);
    });

    let itemId: string;

    test('should create an item under /api/items', async ({ request }) => {
        const response = await request.post('/api/items', {
            data: { name: 'Widget', price: 9.99 }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.name).toBe('Widget');
        expect(body.id).toBeDefined();
        itemId = body.id;
    });

    test('should fetch the created item by ID under prefix', async ({ request }) => {
        const response = await request.get(`/api/items/${itemId}`);
        expect(response.ok()).toBeTruthy();

        const item = await response.json();
        expect(item.name).toBe('Widget');
    });

    test('should update the item under prefix', async ({ request }) => {
        const response = await request.patch(`/api/items/${itemId}`, {
            data: { price: 14.99 }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.price).toBe(14.99);
    });

    test('should delete the item under prefix', async ({ request }) => {
        const response = await request.delete(`/api/items/${itemId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/api/items/${itemId}`);
        expect(getResponse.status()).toBe(404);
    });
});
