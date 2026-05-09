import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Model-bound custom endpoints', () => {

    test('POST /albums/:id/play increments playCount', async ({ request }) => {
        const before = await (await request.get('/albums/alb-1')).json();
        const start = before.playCount ?? 0;

        const res = await request.post('/albums/alb-1/play');
        expect(res.ok()).toBeTruthy();
        const after = await res.json();
        expect(after.playCount).toBe(start + 1);

        const second = await (await request.post('/albums/alb-1/play')).json();
        expect(second.playCount).toBe(start + 2);
    });

    test('POST /albums/:id/play returns 404 for an unknown album', async ({ request }) => {
        const res = await request.post('/albums/does-not-exist/play');
        expect(res.status()).toBe(404);
    });

    test('GET /audit-log/list reads the internal audit-log via ctx.db', async ({ request }) => {
        const res = await request.get('/audit-log/list');
        expect(res.ok()).toBeTruthy();
        const audit = await res.json();
        expect(Array.isArray(audit)).toBeTruthy();
    });
});
