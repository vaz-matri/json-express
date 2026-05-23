import { test, expect } from '@playwright/test';
import Redis from 'ioredis';

test.describe('Queue BullMQ — E2E Tests', () => {
    test('should enqueue a job to Redis when a Task is created', async ({ request }) => {
        const response = await request.post('/tasks', {
            data: {
                description: 'Queue test task'
            }
        });
        expect(response.status()).toBe(201);
        const body = await response.json();
        expect(body.id).toBeDefined();

        // Connect directly to Redis to verify BullMQ received the job
        const redis = new Redis('redis://localhost:6379');
        
        // Wait a tiny bit for the enqueue to hit Redis
        await new Promise(res => setTimeout(res, 500));

        // BullMQ uses keys like 'bull:test-queue:id'
        const keys = await redis.keys('bull:test-queue:*');
        expect(keys.length).toBeGreaterThan(0);

        redis.disconnect();
    });
});
