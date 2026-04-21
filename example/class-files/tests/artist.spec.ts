import { test, expect } from '@playwright/test';

test.describe('Artists API', () => {

    test('should list all artists', async ({ request }) => {
        const response = await request.get('/artists');
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(Array.isArray(body)).toBeTruthy();
        expect(body.length).toBeGreaterThanOrEqual(2); // Seed data has 2
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
            data: {
                name: 'Pink Floyd',
                genre: 'Rock'
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBeDefined();
        expect(body.name).toBe('Pink Floyd');

        // Fetch to verify
        const getResponse = await request.get(`/artists/${body.id}`);
        expect(getResponse.ok()).toBeTruthy();
        const getBody = await getResponse.json();
        expect(getBody.name).toBe('Pink Floyd');
    });

    test('should update an existing artist', async ({ request }) => {
        const response = await request.patch('/artists/art-2', {
            data: {
                genre: 'Electronic/Dance'
            }
        });
        expect(response.ok()).toBeTruthy();
        const body = await response.json();
        expect(body.id).toBe('art-2');
        expect(body.genre).toBe('Electronic/Dance');

        // Fetch to verify
        const getResponse = await request.get('/artists/art-2');
        const getBody = await getResponse.json();
        expect(getBody.genre).toBe('Electronic/Dance');
    });

    test('should delete an artist', async ({ request }) => {
        // First create one to delete
        const createRes = await request.post('/artists', {
            data: { name: 'To Be Deleted' }
        });
        const created = await createRes.json();
        const deleteId = created.id;

        const deleteRes = await request.delete(`/artists/${deleteId}`);
        expect(deleteRes.ok()).toBeTruthy();

        // Verify it's gone
        const getResponse = await request.get(`/artists/${deleteId}`);
        expect(getResponse.status()).toBe(404);
    });
});
