import { test, expect } from '@playwright/test';

test.describe('Albums API — unknown id returns 404', () => {
    const missingId = 'does-not-exist-zzz';

    test('GET /albums/:unknown returns 404', async ({ request }) => {
        const response = await request.get(`/albums/${missingId}`);
        expect(response.status()).toBe(404);

        const body = await response.json();
        expect(body.error).toContain(missingId);
    });

    test('PATCH /albums/:unknown returns 404', async ({ request }) => {
        const response = await request.patch(`/albums/${missingId}`, {
            data: { name: 'Should not stick' }
        });
        expect(response.status()).toBe(404);
    });

    test('DELETE /albums/:unknown returns 404', async ({ request }) => {
        const response = await request.delete(`/albums/${missingId}`);
        expect(response.status()).toBe(404);
    });
});
