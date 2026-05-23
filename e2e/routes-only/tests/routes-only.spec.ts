import { test, expect } from '@playwright/test';

test.describe('defineRoutes() — fieldless model with custom endpoint', () => {
    test.describe.configure({ mode: 'serial' });

    test('search returns matching products', async ({ request }) => {
        const response = await request.get('/search?q=key');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.query).toBe('key');
        expect(Array.isArray(body.results)).toBe(true);
        expect(body.results.length).toBe(1);
        expect(body.results[0].name).toBe('Keyboard');
    });

    test('search with too-short query is rejected by validation', async ({ request }) => {
        const response = await request.get('/search?q=a');
        expect(response.status()).toBe(400);
        const body = await response.json();
        expect(body.error).toBe('Validation failed');
    });

    test('CRUD on the search "collection" is not generated', async ({ request }) => {
        // GET /search/:id should NOT match any auto-generated CRUD route — no fields, exposeApi: false.
        // The transport returns 404 for unmatched paths.
        const response = await request.get('/search/anything');
        expect([404]).toContain(response.status());
    });

    test('underlying products collection still works as a CRUD resource', async ({ request }) => {
        const response = await request.get('/products');
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body.length).toBeGreaterThanOrEqual(3);
    });
});
