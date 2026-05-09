import { test, expect } from '@playwright/test';

test.describe('Seeder Faker — schema-driven auto-seeding', () => {

    test('seeds 10 wizards from the model on boot', async ({ request }) => {
        const response = await request.get('/wizards');
        expect(response.ok()).toBeTruthy();

        const wizards = await response.json();
        expect(Array.isArray(wizards)).toBe(true);
        expect(wizards.length).toBe(10);

        for (const w of wizards) {
            expect(w.id).toBeDefined();
            expect(typeof w.name).toBe('string');
            expect(typeof w.school).toBe('string');
            expect(typeof w.level).toBe('number');
            expect(w.level).toBeGreaterThanOrEqual(1);
            expect(w.level).toBeLessThanOrEqual(100);
            expect(typeof w.active).toBe('boolean');
        }
    });

    test('seeds 10 potions and every wizardId points at a real wizard', async ({ request }) => {
        const wizardsRes = await request.get('/wizards');
        const wizards = await wizardsRes.json();
        const wizardIds = new Set(wizards.map((w: any) => String(w.id)));

        const potionsRes = await request.get('/potions');
        expect(potionsRes.ok()).toBeTruthy();

        const potions = await potionsRes.json();
        expect(Array.isArray(potions)).toBe(true);
        expect(potions.length).toBe(10);

        for (const p of potions) {
            expect(p.id).toBeDefined();
            expect(typeof p.name).toBe('string');
            expect(typeof p.potencyLevel).toBe('number');
            expect(p.potencyLevel).toBeGreaterThanOrEqual(1);
            expect(p.potencyLevel).toBeLessThanOrEqual(10);
            expect(p.wizardId).toBeDefined();
            expect(wizardIds.has(String(p.wizardId))).toBe(true);
        }
    });
});
