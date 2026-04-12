import { test, expect } from '@playwright/test';

test.describe('Logger Pino — Structured Logging Swap', () => {
    test.describe.configure({ mode: 'serial' });
    let albumId: string;

    test('should fetch all albums with Pino logger active', async ({ request }) => {
        const response = await request.get('/albums');
        expect(response.ok()).toBeTruthy();

        const albums = await response.json();
        expect(Array.isArray(albums)).toBe(true);
        expect(albums.length).toBeGreaterThan(0);
    });

    test('should create a new album', async ({ request }) => {
        const response = await request.post('/albums', {
            data: { name: 'Random Access Memories', artist: 'Daft Punk' }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.name).toBe('Random Access Memories');
        expect(body.id).toBeDefined();
        albumId = body.id;
    });

    test('should fetch the created album by ID', async ({ request }) => {
        const response = await request.get(`/albums/${albumId}`);
        expect(response.ok()).toBeTruthy();

        const album = await response.json();
        expect(album.name).toBe('Random Access Memories');
    });

    test('should delete the album', async ({ request }) => {
        const response = await request.delete(`/albums/${albumId}`);
        expect(response.status()).toBe(200);

        const getResponse = await request.get(`/albums/${albumId}`);
        expect(getResponse.status()).toBe(404);
    });
});
