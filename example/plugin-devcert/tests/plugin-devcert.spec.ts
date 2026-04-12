import { test, expect } from '@playwright/test';

test.describe('Plugin Devcert — Graceful Boot', () => {
    // When plugin-devcert is installed but JEX__HTTPS is NOT set to true,
    // the plugin should stay silent and the server should boot normally on HTTP.
    // This verifies the "silent fallback" behavior documented in the architecture.

    test('should boot server normally with devcert installed but HTTPS not enabled', async ({ request }) => {
        const response = await request.get('/albums');
        expect(response.ok()).toBeTruthy();

        const albums = await response.json();
        expect(Array.isArray(albums)).toBe(true);
        expect(albums.length).toBeGreaterThan(0);
    });

    test('should still support CRUD operations', async ({ request }) => {
        const response = await request.post('/albums', {
            data: { name: 'Homework', artist: 'Daft Punk' }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.name).toBe('Homework');
        expect(body.id).toBeDefined();

        // Cleanup
        const deleteResponse = await request.delete(`/albums/${body.id}`);
        expect(deleteResponse.status()).toBe(200);
    });
});
