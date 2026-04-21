import { test, expect } from '@playwright/test';

test.describe('Albums API', () => {

    test('should list all albums', async ({ request }) => {
        const response = await request.get('/albums');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.length).toBeGreaterThanOrEqual(2); // Seed data has 2
    });

    test('should fetch a single album by id', async ({ request }) => {
        const response = await request.get('/albums/alb-1');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBe('alb-1');
        expect(body.title).toBe('Abbey Road');
        // Without expand, artist should not be populated, only artistId
        expect(body.artistId).toBe('art-1');
        expect(body.artist).toBeUndefined();
    });

    test('should expand artist relation on list fetch', async ({ request }) => {
        const response = await request.get('/albums?_expand=artist');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.length).toBeGreaterThanOrEqual(2);
        
        const abbeyRoad = body.find((a: any) => a.id === 'alb-1');
        expect(abbeyRoad).toBeDefined();
        // The artist object should be populated
        expect(abbeyRoad.artist).toBeDefined();
        expect(abbeyRoad.artist.id).toBe('art-1');
        expect(abbeyRoad.artist.name).toBe('The Beatles');
    });

    test('should expand artist relation on single fetch', async ({ request }) => {
        const response = await request.get('/albums/alb-2?_expand=artist');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        
        expect(body.id).toBe('alb-2');
        expect(body.artist).toBeDefined();
        expect(body.artist.id).toBe('art-2');
        expect(body.artist.name).toBe('Daft Punk');
    });

    test('should create a new album', async ({ request }) => {
        const response = await request.post('/albums', {
            data: {
                title: 'The Dark Side of the Moon',
                artistId: 'art-new-1' // Dummy artist ID for this test
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBeDefined();
        expect(body.title).toBe('The Dark Side of the Moon');

        // Fetch to verify
        const getResponse = await request.get(`/albums/${body.id}`);
        const getBody = await getResponse.json();
        expect(getBody.title).toBe('The Dark Side of the Moon');
    });

    test('should update an existing album', async ({ request }) => {
        const response = await request.patch('/albums/alb-1', {
            data: {
                title: 'Abbey Road (Remastered)'
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBe('alb-1');
        expect(body.title).toBe('Abbey Road (Remastered)');

        // Fetch to verify
        const getResponse = await request.get('/albums/alb-1');
        const getBody = await getResponse.json();
        expect(getBody.title).toBe('Abbey Road (Remastered)');
    });

    test('should delete an album', async ({ request }) => {
        // First create one to delete
        const createRes = await request.post('/albums', {
            data: { title: 'To Be Deleted', artistId: 'dummy' }
        });
        const created = await createRes.json();
        const deleteId = created.id;

        const deleteRes = await request.delete(`/albums/${deleteId}`);
        expect(deleteRes.ok()).toBeTruthy();

        // Verify it's gone
        const getResponse = await request.get(`/albums/${deleteId}`);
        expect(getResponse.status()).toBe(404);
    });
});
