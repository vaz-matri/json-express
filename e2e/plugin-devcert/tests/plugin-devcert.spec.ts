import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('plugin-devcert — HTTPS boot', () => {
    test('serves the seed collection over HTTPS', async ({ request }) => {
        const res = await request.get('/albums');
        expect(res.ok()).toBe(true);
        expect(res.url().startsWith('https://')).toBe(true);

        const body = await res.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        expect(body[0]).toHaveProperty('id');
        expect(body[0]).toHaveProperty('name');
    });

    test('mounts the docs page over HTTPS', async ({ request }) => {
        const res = await request.get('/docs');
        expect(res.ok()).toBe(true);
        expect(res.url().startsWith('https://')).toBe(true);
        expect(res.headers()['content-type']).toContain('text/html');
    });

    test('refuses plain HTTP on the same port', async ({ playwright }) => {
        // The TLS-only server can't speak plain HTTP. The exact failure mode
        // (socket hang up vs ECONNRESET vs timeout) is platform-dependent —
        // we just confirm the request never resolves into a successful HTTP response.
        const httpClient = await playwright.request.newContext({
            baseURL: 'http://localhost:3000',
        });

        let succeeded = false;
        try {
            const res = await httpClient.get('/albums', { timeout: 3000 });
            succeeded = res.ok();
        } catch {
            // Expected: TLS server rejects/garbles plain HTTP traffic.
        }
        expect(succeeded).toBe(false);

        await httpClient.dispose();
    });
});

test.describe('plugin-devcert — CRUD over HTTPS', () => {
    let createdId = '';

    test('POST /albums creates a record', async ({ request }) => {
        const res = await request.post('/albums', {
            data: { name: 'Discovery', artist: 'Daft Punk' },
        });
        expect(res.status()).toBe(201);

        const body = await res.json();
        expect(body.name).toBe('Discovery');
        expect(body.artist).toBe('Daft Punk');
        expect(body.id).toBeDefined();
        createdId = body.id;
    });

    test('GET /albums/:id returns the created record', async ({ request }) => {
        const res = await request.get(`/albums/${createdId}`);
        expect(res.status()).toBe(200);

        const body = await res.json();
        expect(body.id).toBe(createdId);
        expect(body.artist).toBe('Daft Punk');
    });

    test('DELETE /albums/:id cleans up', async ({ request }) => {
        const res = await request.delete(`/albums/${createdId}`);
        expect(res.status()).toBe(200);

        const after = await request.get(`/albums/${createdId}`);
        expect(after.status()).toBe(404);
    });
});
