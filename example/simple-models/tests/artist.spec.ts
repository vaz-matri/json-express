import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Artists API — CRUD', () => {

    test('should list all artists', async ({ request }) => {
        const response = await request.get('/artists');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.length).toBeGreaterThanOrEqual(3);
    });

    test('should fetch a single artist by id', async ({ request }) => {
        const response = await request.get('/artists/art-1');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBe('art-1');
        expect(body.name).toBe('The Beatles');
    });

    test('should create a new artist', async ({ request }) => {
        const response = await request.post('/artists', {
            data: { name: 'Radiohead', genre: 'Alternative' }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.id).toBeDefined();
        expect(body.name).toBe('Radiohead');
    });

    test('should update an existing artist', async ({ request }) => {
        const response = await request.patch('/artists/art-2', {
            data: { genre: 'Electronic/Dance' }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.genre).toBe('Electronic/Dance');
    });

    test('should delete an artist', async ({ request }) => {
        const createRes = await request.post('/artists', {
            data: { name: 'Tame Impala' }
        });
        const created = await createRes.json();

        const deleteRes = await request.delete(`/artists/${created.id}`);
        expect(deleteRes.ok()).toBeTruthy();

        const getRes = await request.get(`/artists/${created.id}`);
        expect(getRes.status()).toBe(404);
    });
});

test.describe('Artists API — unique constraint', () => {

    test('rejects a duplicate artist name', async ({ request }) => {
        const response = await request.post('/artists', {
            data: { name: 'The Beatles', genre: 'Rock' }
        });
        expect(response.status()).toBe(400);
    });
});

test.describe('Artists API — inverse one-to-many relation', () => {

    test('expands albums on a single artist fetch', async ({ request }) => {
        const response = await request.get('/artists/art-1?_expand=albums');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBe('art-1');
        expect(Array.isArray(body.albums)).toBeTruthy();
        const titles = body.albums.map((a: any) => a.title);
        expect(titles.some((t: string) => t.startsWith('Abbey Road'))).toBeTruthy();
    });

    test('expands albums on a list fetch', async ({ request }) => {
        const response = await request.get('/artists?_expand=albums');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        const daft = body.find((a: any) => a.id === 'art-2');
        expect(Array.isArray(daft.albums)).toBeTruthy();
        expect(daft.albums.some((a: any) => a.title === 'Discovery')).toBeTruthy();
    });
});
