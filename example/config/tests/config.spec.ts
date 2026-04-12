import { test, expect } from '@playwright/test';

test.describe('Config — Advanced jex.config.ts with API Prefix', () => {
    test.describe.configure({ mode: 'serial' });

    // Without prefix should 404
    test('should return 404 when accessing /items without prefix', async ({ request }) => {
        const response = await request.get('/items');
        expect(response.status()).toBe(404);
    });

    // With prefix should work
    test('should return 200 when accessing /api/v1/items', async ({ request }) => {
        const response = await request.get('/api/v1/items');
        expect(response.ok()).toBeTruthy();

        const items = await response.json();
        expect(Array.isArray(items)).toBe(true);
        expect(items.length).toBeGreaterThan(0);
    });

    // Full CRUD under prefix
    let itemId: string;

    test('should create an item under /api/v1/items', async ({ request }) => {
        const response = await request.post('/api/v1/items', {
            data: { name: 'Gadget', price: 19.99 }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.name).toBe('Gadget');
        expect(body.id).toBeDefined();
        itemId = body.id;
    });

    test('should fetch the created item by ID under prefix', async ({ request }) => {
        const response = await request.get(`/api/v1/items/${itemId}`);
        expect(response.ok()).toBeTruthy();

        const item = await response.json();
        expect(item.name).toBe('Gadget');
    });

    test('should update the item under prefix', async ({ request }) => {
        const response = await request.patch(`/api/v1/items/${itemId}`, {
            data: { price: 24.99 }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.price).toBe(24.99);
    });

    test('should delete the item under prefix', async ({ request }) => {
        const response = await request.delete(`/api/v1/items/${itemId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/api/v1/items/${itemId}`);
        expect(getResponse.status()).toBe(404);
    });
});
