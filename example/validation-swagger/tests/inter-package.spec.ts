import { test, expect } from '@playwright/test';

test.describe('Inter-Package Metadata Transit', () => {
    test('should pass validation schema to swagger OpenAPI manifest correctly', async ({ request }) => {
        // Fetch the OpenAPI manifest dynamically built by docs-swagger
        const response = await request.get('/docs/json');
        expect(response.ok()).toBeTruthy();
        
        const openApi = await response.json();
        
        // 1. Assert Swagger manifest loaded properly
        expect(openApi.openapi).toBe('3.0.0');
        expect(openApi.paths['/users']).toBeDefined();
        expect(openApi.paths['/users']['post']).toBeDefined();

        // 2. Locate the translated request schema injected into Swagger
        const postRoute = openApi.paths['/users']['post'];
        const schema = postRoute.requestBody?.content['application/json']?.schema;
        
        expect(schema).toBeDefined();
        expect(schema.type).toBe('object');
        
        // 3. Assert the Zod schema from `jex.config.ts` was properly extracted by api-rest,
        // passed neutrally via metadata, and translated into OpenAPI 3 by docs-swagger
        expect(schema.properties.username).toBeDefined();
        expect(schema.properties.username.type).toBe('string');
        
        expect(schema.properties.age).toBeDefined();
        expect(schema.properties.age.type).toBe('number');
        
        expect(schema.properties.isActive).toBeDefined();
        expect(schema.properties.isActive.type).toBe('boolean');

        // 4. Assert required fields logic was preserved (isActive has a default, so it's not required)
        expect(schema.required).toContain('username');
        expect(schema.required).toContain('age');
        expect(schema.required).not.toContain('isActive');
    });
});
