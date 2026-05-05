import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('exposeApi: false', () => {

    test('the audit-log collection has no auto-generated REST routes', async ({ request }) => {
        const list = await request.get('/audit-log');
        expect(list.status()).toBe(404);

        const create = await request.post('/audit-log', {
            data: { collection: 'x', action: 'y', recordId: 'z' }
        });
        expect(create.status()).toBe(404);

        const patch = await request.patch('/audit-log/some-id', { data: {} });
        expect(patch.status()).toBe(404);

        const del = await request.delete('/audit-log/some-id');
        expect(del.status()).toBe(404);
    });

    test('custom endpoints on the model still register and expose curated reads', async ({ request }) => {
        await request.patch('/albums/alb-1', { data: { title: 'Abbey Road (v2)' } });

        const res = await request.get('/audit-log/list');
        expect(res.ok()).toBeTruthy();
        const audit = await res.json();
        expect(audit.length).toBeGreaterThan(0);
    });
});
