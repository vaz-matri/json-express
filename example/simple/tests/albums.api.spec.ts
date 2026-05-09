import { test, expect } from '@playwright/test';

test.describe('Albums API CRUD', () => {
    test.describe.configure({ mode: 'serial' });
    let albumId: string;

    // SEED — runs first so it observes the boot state from data/albums.json
    test('should expose the seeded record from data/albums.json', async ({ request }) => {
        const response = await request.get('/albums');
        expect(response.ok()).toBeTruthy();
        expect(response.headers()['content-type']).toContain('application/json');

        const albums = await response.json();
        expect(Array.isArray(albums)).toBe(true);

        const seeded = albums.find((a: any) => a.name === 'Encore');
        expect(seeded).toBeDefined();
        expect(seeded.releaseDate).toBe('12-11-2004');
        expect(seeded.id).toBeDefined();
    });

    // CREATE
    test('should create a new album', async ({ request }) => {
        const response = await request.post('/albums', {
            data: {
                name: 'Discovery',
                releaseDate: '12-03-2001'
            }
        });
        expect(response.status()).toBe(201);
        
        const body = await response.json();
        expect(body.name).toBe('Discovery');
        expect(body.id).toBeDefined();
        albumId = body.id;
    });

    // READ (All)
    test('should fetch all albums', async ({ request }) => {
        const response = await request.get('/albums');
        expect(response.ok()).toBeTruthy();
        
        const albums = await response.json();
        expect(Array.isArray(albums)).toBe(true);
        expect(albums.some((a: any) => a.name === 'Discovery')).toBe(true);
    });

    // READ (One)
    test('should fetch the created album by ID', async ({ request }) => {
        const response = await request.get(`/albums/${albumId}`);
        expect(response.ok()).toBeTruthy();
        
        const album = await response.json();
        expect(album.name).toBe('Discovery');
        expect(album.id).toBe(albumId);
    });

    // UPDATE
    test('should update album details', async ({ request }) => {
        const response = await request.patch(`/albums/${albumId}`, {
            data: { name: 'Discovery (Anniversary Edition)' }
        });
        expect(response.ok()).toBeTruthy();
        
        const body = await response.json();
        expect(body.name).toBe('Discovery (Anniversary Edition)');
    });

    // DELETE
    test('should delete the album', async ({ request }) => {
        const response = await request.delete(`/albums/${albumId}`);
        expect(response.status()).toBe(200);
        
        // Verify deletion
        const getResponse = await request.get(`/albums/${albumId}`);
        expect(getResponse.status()).toBe(404);
    });
});
