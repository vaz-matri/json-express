import { test, expect } from '@playwright/test';

test.describe('Built-in docs (docs-light)', () => {
    test('GET /docs returns the HTML documentation page', async ({ request }) => {
        const response = await request.get('/docs');
        expect(response.ok()).toBeTruthy();
        expect(response.headers()['content-type']).toContain('text/html');

        const html = await response.text();
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('JSON Express');
        // The albums collection should be rendered as a card with its routes.
        expect(html).toContain('/albums');
    });

    test('GET /docs/json returns the route manifest', async ({ request }) => {
        const response = await request.get('/docs/json');
        expect(response.ok()).toBeTruthy();
        expect(response.headers()['content-type']).toContain('application/json');

        const manifest = await response.json();
        expect(Array.isArray(manifest)).toBe(true);

        const albumRoutes = manifest.filter((r: any) => r.path?.startsWith('/albums'));
        expect(albumRoutes.length).toBeGreaterThan(0);

        const methods = new Set(albumRoutes.map((r: any) => r.method));
        for (const verb of ['GET', 'POST', 'PATCH', 'DELETE']) {
            expect(methods.has(verb)).toBe(true);
        }
    });
});
