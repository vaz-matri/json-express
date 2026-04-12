import { test, expect } from '@playwright/test';

test.describe('Seeder Faker — Data Population on Boot', () => {

    test('should have seeded users on boot', async ({ request }) => {
        const response = await request.get('/users');
        expect(response.ok()).toBeTruthy();

        const users = await response.json();
        expect(Array.isArray(users)).toBe(true);
        expect(users.length).toBe(5);
    });

    test('seeded records should have expected fields', async ({ request }) => {
        const response = await request.get('/users');
        const users = await response.json();

        for (const user of users) {
            expect(user.id).toBeDefined();
            expect(user.name).toBeDefined();
            expect(typeof user.name).toBe('string');
            expect(user.email).toBeDefined();
            expect(typeof user.email).toBe('string');
            expect(user.age).toBeDefined();
            expect(typeof user.age).toBe('number');
            expect(user.age).toBeGreaterThanOrEqual(18);
            expect(user.age).toBeLessThanOrEqual(65);
        }
    });
});
