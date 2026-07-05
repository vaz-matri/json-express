import { test, expect } from '@playwright/test';

test.describe('KV Redis — E2E Tests', () => {
    test.describe.configure({ mode: 'serial' });

    test('should set and get a value from KV', async ({ request }) => {
        const setRes = await request.post('/caches/my-test-key', {
            data: { hello: 'world' }
        });
        expect(setRes.status()).toBe(200);

        const getRes = await request.get('/caches/my-test-key');
        expect(getRes.status()).toBe(200);
        
        const data = await getRes.json();
        expect(data.hello).toBe('world');
    });

    test('should expire the value after 1 second TTL', async ({ request }) => {
        // Wait 1.1 seconds for TTL to evict
        await new Promise(res => setTimeout(res, 1100));

        const getRes = await request.get('/caches/my-test-key');
        expect(getRes.status()).toBe(404);
    });
});
