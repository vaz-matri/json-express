import { test, expect } from '@playwright/test';

test.describe('Plugin Health — /health and /info endpoints', () => {
    test.describe.configure({ mode: 'serial' });

    test('should return UP status from /health', async ({ request }) => {
        const response = await request.get('/health');
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.status).toBe('UP');
        expect(body.database).toBe('connected');
    });

    test('should return build info from /info', async ({ request }) => {
        const response = await request.get('/info');
        expect(response.status()).toBe(200);

        const body = await response.json();
        expect(body.environment).toBeDefined();
        expect(body.uptimeSeconds).toBeGreaterThan(0);
        expect(body.timestamp).toBeDefined();
        expect(body.system.nodeVersion).toBeDefined();
        expect(body.system.platform).toBeDefined();
        expect(body.system.memoryUsageMb).toBeGreaterThan(0);
    });
});
