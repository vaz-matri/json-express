import { test, expect } from '@playwright/test';

test.describe.configure({ mode: 'serial' });

test.describe('Model hooks', () => {

    test('beforeCreate stamps createdAt and seeds the default playCount', async ({ request }) => {
        const before = Date.now();
        const res = await request.post('/albums', {
            data: { title: 'Hook Album A', artistId: 'art-1' }
        });
        expect(res.status()).toBe(201);
        const album = await res.json();

        expect(album.createdAt).toBeDefined();
        expect(new Date(album.createdAt).getTime()).toBeGreaterThanOrEqual(before);
        expect(album.playCount).toBe(0);
    });

    test('afterCreate writes a row to the audit-log via ctx.db', async ({ request }) => {
        const created = await (await request.post('/albums', {
            data: { title: 'Hook Album B', artistId: 'art-1' }
        })).json();

        const audit = await (await request.get('/audit-log/list')).json();
        const row = audit.find((r: any) => r.recordId === created.id && r.action === 'create');
        expect(row).toBeDefined();
        expect(row.collection).toBe('albums');
    });

    test('beforeUpdate stamps updatedAt on every PATCH', async ({ request }) => {
        const before = Date.now();
        const res = await request.patch('/albums/alb-1', {
            data: { title: 'Abbey Road (Remastered)' }
        });
        expect(res.ok()).toBeTruthy();
        const album = await res.json();

        expect(album.updatedAt).toBeDefined();
        expect(new Date(album.updatedAt).getTime()).toBeGreaterThanOrEqual(before);
    });

    test('afterUpdate appends an update row to the audit-log', async ({ request }) => {
        await request.patch('/albums/alb-2', { data: { title: 'Discovery (Deluxe)' } });

        const audit = await (await request.get('/audit-log/list')).json();
        const row = audit.find((r: any) => r.recordId === 'alb-2' && r.action === 'update');
        expect(row).toBeDefined();
    });
});
