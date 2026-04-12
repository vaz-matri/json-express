import { test, expect } from '@playwright/test';

test.describe('Health & Info API', () => {
    test('should return 200 OK for /health', async ({ request }) => {
        const response = await request.get('/health');
        expect(response.status()).toBe(200);
        
        const body = await response.json();
        expect(body.status).toBe('UP');
        expect(body.database).toBe('connected');
    });

    test('should return 200 OK for /info', async ({ request }) => {
        const response = await request.get('/info');
        expect(response.status()).toBe(200);
        
        const body = await response.json();
        expect(body.environment).toBeDefined();
        expect(body.uptimeSeconds).toBeGreaterThan(0);
        expect(body.timestamp).toBeDefined();
        expect(body.system).toBeDefined();
        expect(body.system.nodeVersion).toBeDefined();
        expect(body.system.platform).toBeDefined();
        expect(body.system.memoryUsageMb).toBeGreaterThan(0);
    });
});
