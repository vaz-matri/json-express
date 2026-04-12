import { test, expect } from '@playwright/test';

test.describe('API REST — Cross-Collection Search', () => {

    // Search all collections with no filter
    test('should return all collections when searching with empty body', async ({ request }) => {
        const response = await request.post('/search', {
            data: {}
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        // Should contain both albums and artists keys
        expect(body.albums).toBeDefined();
        expect(body.artists).toBeDefined();
        expect(body.albums.length).toBeGreaterThan(0);
        expect(body.artists.length).toBeGreaterThan(0);
    });

    // Search with query filter
    test('should filter results with a query', async ({ request }) => {
        const response = await request.post('/search', {
            data: {
                query: { genre: 'Electronic' }
            }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        // Only albums have genre field, so artists should be empty (or absent)
        expect(body.albums).toBeDefined();
        expect(body.albums.length).toBe(1);
        expect(body.albums[0].name).toBe('Discovery');
    });

    // Search scoped to a single collection
    test('should search only specified collections', async ({ request }) => {
        const response = await request.post('/search', {
            data: {
                collections: ['artists']
            }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.artists).toBeDefined();
        expect(body.albums).toBeUndefined();
    });

    // Search with query scoped to a single collection
    test('should search with query in a single collection', async ({ request }) => {
        const response = await request.post('/search', {
            data: {
                collections: ['artists'],
                query: { country: 'France' }
            }
        });
        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.artists).toBeDefined();
        expect(body.artists.length).toBe(1);
        expect(body.artists[0].name).toBe('Daft Punk');
    });
});
