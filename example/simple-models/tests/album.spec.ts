import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Albums API — CRUD', () => {

    test('should list all albums', async ({ request }) => {
        const response = await request.get('/albums');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.length).toBeGreaterThanOrEqual(3);
    });

    test('should fetch a single album with typed fields preserved', async ({ request }) => {
        const response = await request.get('/albums/alb-1');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBe('alb-1');
        expect(body.title).toBe('Abbey Road');
        expect(body.artistId).toBe('art-1');
        expect(body.releaseYear).toBe(1969);
        expect(typeof body.releaseYear).toBe('number');
        expect(body.explicit).toBe(false);
        expect(typeof body.explicit).toBe('boolean');
        // Without _expand, the relation field is not hydrated
        expect(body.artist).toBeUndefined();
    });

    test('should create a new album', async ({ request }) => {
        const response = await request.post('/albums', {
            data: { title: 'The Dark Side of the Moon', artistId: 'art-3', releaseYear: 1973 }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.id).toBeDefined();
        expect(body.title).toBe('The Dark Side of the Moon');
    });

    test('should update an existing album', async ({ request }) => {
        const response = await request.patch('/albums/alb-1', {
            data: { title: 'Abbey Road (Remastered)' }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBe('alb-1');
        expect(body.title).toBe('Abbey Road (Remastered)');
    });

    test('should delete an album', async ({ request }) => {
        const createRes = await request.post('/albums', {
            data: { title: 'To Be Deleted', artistId: 'art-1' }
        });
        const created = await createRes.json();

        const deleteRes = await request.delete(`/albums/${created.id}`);
        expect(deleteRes.ok()).toBeTruthy();

        const getRes = await request.get(`/albums/${created.id}`);
        expect(getRes.status()).toBe(404);
    });
});

test.describe('Albums API — many-to-one relation expansion', () => {

    test('expands artist on a single fetch', async ({ request }) => {
        const response = await request.get('/albums/alb-2?_expand=artist');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.artist).toBeDefined();
        expect(body.artist.id).toBe('art-2');
        expect(body.artist.name).toBe('Daft Punk');
    });

    test('expands artist on a list fetch', async ({ request }) => {
        const response = await request.get('/albums?_expand=artist');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        const abbey = body.find((a: any) => a.id === 'alb-1');
        expect(abbey.artist).toBeDefined();
        expect(abbey.artist.name).toBe('The Beatles');
    });
});
