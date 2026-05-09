import { test, expect } from '@playwright/test';

test.describe('Middleware Validation — Zod Schema Guarding', () => {
    test.describe.configure({ mode: 'serial' });

    // VALID — should pass validation and create
    test('should create a product with valid body', async ({ request }) => {
        const response = await request.post('/products', {
            data: {
                name: 'Keyboard',
                price: 79.99,
                inStock: true
            }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.name).toBe('Keyboard');
        expect(body.price).toBe(79.99);
        expect(body.id).toBeDefined();
    });

    // INVALID — missing required field (name)
    test('should reject POST with missing required field', async ({ request }) => {
        const response = await request.post('/products', {
            data: {
                price: 49.99
            }
        });
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.error).toBe('Validation failed');
        expect(body.details).toBeDefined();
    });

    // INVALID — wrong type (price is string instead of number)
    test('should reject POST with wrong field type', async ({ request }) => {
        const response = await request.post('/products', {
            data: {
                name: 'Mouse',
                price: 'not-a-number'
            }
        });
        expect(response.status()).toBe(400);

        const body = await response.json();
        expect(body.error).toBe('Validation failed');
    });

    // VALID — default field (inStock defaults to true when omitted)
    test('should accept POST without optional field using default', async ({ request }) => {
        const response = await request.post('/products', {
            data: {
                name: 'Monitor',
                price: 299.99
            }
        });
        expect(response.status()).toBe(201);

        const body = await response.json();
        expect(body.name).toBe('Monitor');
        expect(body.inStock).toBe(true);
    });
});
